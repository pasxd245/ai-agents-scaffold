export {
  scaffold,
  sync,
  checkExistingFiles,
  classifyConflicts,
  resolveScaffoldConfig,
  listOutputPaths,
  hasManagedRegion,
} from './scaffold/index.js';
export { listTemplates, resolveTemplatePath } from './templates/index.js';
export {
  validateSkill,
  scoreConformance,
  auditSkill,
  listSkills,
  installSkill,
  parseSkillSource,
  isSkillRef,
  discoverSkills,
  installSkillRef,
} from './skills/index.js';
