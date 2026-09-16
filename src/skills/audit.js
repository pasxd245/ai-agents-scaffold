import fs from 'node:fs';
import path from 'node:path';

import { parseFrontmatter } from '../utils/frontmatter.js';
import { SKILL_FILE } from '../constants.js';

/**
 * Supply-chain screening for skills.
 *
 * A skill executes with the full permissions of the agent that loads it, so a
 * hostile one reaches API keys, SSH credentials and the shell. Published
 * skills have a poor safety record: Snyk's 2026 ToxicSkills audit of 3,984
 * skills found ~37% carrying at least one security flaw and 76 with live
 * malicious payloads, most combining prompt injection with conventional
 * malware.
 *
 * This is a screen, not a scanner. It flags patterns worth a human's eyes
 * before an install; it cannot prove a skill is safe, and it never blocks.
 */

/** Files worth reading. Anything else is reported by name only. */
const TEXT_EXT = new Set([
  '.md',
  '.sh',
  '.bash',
  '.zsh',
  '.py',
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.rb',
  '.pl',
  '.ps1',
  '.yaml',
  '.yml',
  '.json',
  '.toml',
]);

/** Skip anything larger than this; a huge file in a skill is itself reported. */
const MAX_SCAN_BYTES = 512 * 1024;

/**
 * @typedef {object} AuditFinding
 * @property {'network'|'credentials'|'execution'|'injection'|'opaque'} category
 * @property {'high'|'medium'} severity
 * @property {string} file    - Path relative to the skill directory
 * @property {number} [line]  - 1-indexed line number, when the finding has one
 * @property {string} message
 */

/**
 * Patterns worth surfacing. Each is a heuristic: a legitimate skill may well
 * match one, which is why findings are reported rather than enforced.
 *
 * @type {ReadonlyArray<{
 *   category: AuditFinding['category'],
 *   severity: AuditFinding['severity'],
 *   re: RegExp,
 *   message: string
 * }>}
 */
const PATTERNS = [
  {
    category: 'network',
    severity: 'medium',
    // `urllib.parse` is pure string handling; only request-capable modules
    // count. Matching bare `urllib` flags every link checker that parses URLs.
    re: /\b(curl|wget|nc|netcat)\b|\bfetch\s*\(|\brequests\.(get|post)\b|\burllib\.(request|error)\b|\bhttps?:\/\/(?!(?:www\.)?(?:github\.com|raw\.githubusercontent\.com|agents\.md|agentskills\.io|json\.schemastore\.org))/,
    message: 'reaches the network',
  },
  {
    category: 'credentials',
    severity: 'high',
    re: /\.ssh\b|id_rsa|\.aws\/credentials|\.npmrc|\.netrc|\.env\b|API_KEY|SECRET_KEY|ACCESS_TOKEN|keychain|wallet\.dat|Login Data|cookies\.sqlite/i,
    message: 'references credential or secret storage',
  },
  {
    category: 'execution',
    severity: 'high',
    // Match the calls, not the module: `except subprocess.CalledProcessError`
    // is error handling, and bare `subprocess\.` flagged it high-severity.
    re: /\beval\s*\(|\bexec\s*\(|child_process|subprocess\.(run|call|check_output|check_call|Popen)\b|os\.system|Function\s*\(\s*['"`]|\|\s*(?:ba)?sh\b|base64\s+-d|atob\s*\(/,
    message: 'executes code dynamically or shells out',
  },
  {
    category: 'injection',
    severity: 'high',
    re: /ignore (?:all )?(?:previous|prior|above) instructions|disregard (?:the )?(?:above|previous)|you are now|system prompt|do not (?:tell|inform|mention to) the user|without (?:asking|informing) the user/i,
    message:
      'contains instruction-override phrasing typical of prompt injection',
  },
];

/** Zero-width and bidi characters used to hide text from human reviewers. */
const HIDDEN_CHARS = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/;

/**
 * Recursively list a skill's entries, relative to its root.
 *
 * Symbolic links are returned separately rather than followed. A link is
 * neither a directory nor a regular file, so a walk that tests only those two
 * drops it silently — and the installer copies links verbatim, which is how a
 * benignly named `notes.md` pointing at `~/.ssh/id_rsa` reached an installed
 * skill through an audit that reported `clean: true`. What a link points at is
 * not visible in the file's own bytes, so it is reported, never scanned.
 *
 * @param {string} root
 * @returns {{ files: string[], links: Array<{ rel: string, target: string }> }}
 */
function listEntries(root) {
  /** @type {string[]} */
  const files = [];
  /** @type {Array<{ rel: string, target: string }>} */
  const links = [];
  /** @param {string} dir */
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      const rel = path.relative(root, abs);
      if (entry.isSymbolicLink()) {
        links.push({ rel, target: fs.readlinkSync(abs) });
      } else if (entry.isDirectory()) {
        walk(abs);
      } else if (entry.isFile()) {
        files.push(rel);
      }
    }
  };
  walk(root);
  return { files, links };
}

/**
 * Split an `allowed-tools` value into individual grants.
 *
 * The field accepts both comma- and space-separated lists, and a scoped grant
 * contains spaces of its own (`Bash(git log *)`), so separators only count at
 * paren depth zero.
 *
 * @param {string} value
 * @returns {string[]}
 */
function splitTools(value) {
  /** @type {string[]} */
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);

    if (depth === 0 && (ch === ',' || /\s/.test(ch))) {
      if (cur.trim()) out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/**
 * Screen a skill directory for supply-chain risks.
 *
 * @param {string} skillDir - Path to the skill directory
 * @returns {{ findings: AuditFinding[], scanned: number, clean: boolean }}
 */
export function auditSkill(skillDir) {
  /** @type {AuditFinding[]} */
  const findings = [];

  if (!fs.existsSync(path.join(skillDir, SKILL_FILE))) {
    return {
      findings: [
        {
          category: 'opaque',
          severity: 'high',
          file: SKILL_FILE,
          message: 'no SKILL.md — this is not a skill directory',
        },
      ],
      scanned: 0,
      clean: false,
    };
  }

  const { files, links } = listEntries(skillDir);
  let scanned = 0;

  for (const { rel, target } of links) {
    findings.push({
      category: 'opaque',
      severity: 'high',
      file: rel,
      message:
        `symbolic link pointing at "${target}" — its contents are not part ` +
        'of the skill and cannot be reviewed here',
    });
  }

  for (const rel of files) {
    const abs = path.join(skillDir, rel);
    const { size } = fs.statSync(abs);
    const ext = path.extname(rel).toLowerCase();

    if (!TEXT_EXT.has(ext)) {
      findings.push({
        category: 'opaque',
        severity: 'medium',
        file: rel,
        message: `binary or unreadable file shipped with the skill (${size} bytes)`,
      });
      continue;
    }

    if (size > MAX_SCAN_BYTES) {
      findings.push({
        category: 'opaque',
        severity: 'medium',
        file: rel,
        message: `file is ${Math.round(size / 1024)}KB — too large to screen`,
      });
      continue;
    }

    scanned++;
    // A BOM at offset 0 is an encoding mark, not hidden text; the same code
    // point anywhere else in the file is still flagged below.
    const lines = fs
      .readFileSync(abs, 'utf8')
      .replace(/^\uFEFF/, '')
      .split('\n');

    lines.forEach((line, i) => {
      for (const p of PATTERNS) {
        if (p.re.test(line)) {
          findings.push({
            category: p.category,
            severity: p.severity,
            file: rel,
            line: i + 1,
            message: p.message,
          });
        }
      }
      if (HIDDEN_CHARS.test(line)) {
        findings.push({
          category: 'injection',
          severity: 'high',
          file: rel,
          line: i + 1,
          message:
            'contains zero-width or bidirectional characters, which can hide text from a human reviewer',
        });
      }
    });
  }

  // A skill that grants itself shell access is worth a second look, even
  // when nothing in its scripts matched.
  const parsed = parseFrontmatter(
    fs.readFileSync(path.join(skillDir, SKILL_FILE), 'utf8')
  );
  if (parsed?.frontmatter?.['allowed-tools']) {
    const tools = String(parsed.frontmatter['allowed-tools']);
    // `Bash(git log *)` is least privilege done right and must not score the
    // same as a bare `Bash`. Only an unscoped grant is worth reporting.
    const unscoped = splitTools(tools).includes('Bash');
    if (unscoped) {
      findings.push({
        category: 'execution',
        severity: 'medium',
        file: SKILL_FILE,
        message: `grants unscoped shell access via allowed-tools: ${tools}. Prefer a scoped grant such as Bash(git log *)`,
      });
    }
  }

  return { findings, scanned, clean: findings.length === 0 };
}
