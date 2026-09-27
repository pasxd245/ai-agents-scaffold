// Two shapes the audit used to flag as hostile: reading Node's own
// configuration object, and a regular-expression match.
const home = process.env.HOME;
const major = /^v(\d+)/.exec(process.version);

export { home, major };
