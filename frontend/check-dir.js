// check-dir.js: Prevent running scripts from nested frontend/frontend directory
const cwd = process.cwd();
if (cwd.match(/frontend[\\/]+frontend\b/)) {
  console.error(
    '\u274C You are in a nested frontend directory. Go up one level and run your command from the root/frontend.'
  );
  process.exit(1);
}
