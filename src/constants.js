// File extensions
export const TEMPLATE_EXT = '.hbs';

// Skill conventions
export const SKILL_FILE = 'SKILL.md';
// Used both as `<agents>/skills/` (install destination) and
// `templates/skills/` (built-in install pool — same string, different role).
export const SKILLS_DIRNAME = 'skills';
// Metadata `type` value for ref pointers AND the singular template name.
export const SKILL_REF = 'skill-ref';

// Type directory under `templates/`
export const SCAFFOLD_TYPE = 'scaffold';

// Defaults
export const DEFAULT_AGENTS_DIR = '.agents';
export const DEFAULT_TEMPLATE = 'base';

// Template internal layout (mirrors js-tmpl's expected fields)
export const TEMPLATE_DIRNAME = 'template';
export const VALUES_FILE = 'values.yaml';
export const VALUES_DIRNAME = 'values';
export const PARTIALS_DIRNAME = 'partials';

// Configuration
export const A2SCAFFOLD_DIRNAME = '.a2scaffold';
export const RC_BASENAME = '.a2scaffoldrc';
export const VALUES_BASENAME = 'values';
export const CONFIG_EXTS = ['.json', '.yaml', '.yml'];

// Legacy: kept for any external callers; new code should use RC_BASENAME + CONFIG_EXTS.
export const RC_FILENAME = '.a2scaffoldrc.json';

/**
 * Harness config files: seeded, never overwritten, and checked for drift.
 *
 * Sync leaves seeded files alone silently. These are the exception, because
 * their staleness costs more than documentation drift: a permission rule that
 * has not caught up with the template is canon the harness no longer guards,
 * and a `context.fileName` list without `AGENTS.md` is a harness that no
 * longer reads the instructions at all. A repo may also have put its own
 * settings in them — MCP servers, a theme, local rules — so the check is per
 * required entry (see `enforcement.js`), and the answer is a report, never a
 * rewrite.
 */
export const ENFORCEMENT_FILES = [
  '.claude/settings.json',
  '.gemini/settings.json',
];
