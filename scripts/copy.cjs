const fs = require("fs");
const path = require("path");

function cp(src, dest, options = {}) {
  if (!fs.existsSync(src)) {
    throw new Error(`cp: cannot stat '${src}': No such file or directory`);
  }

  const srcStat = fs.statSync(src);

  // Handle destination logic like Unix cp
  let finalDest = dest;
  if (fs.existsSync(dest) && fs.statSync(dest).isDirectory()) {
    // If dest exists and is a directory, copy source into it
    finalDest = path.join(dest, path.basename(src));
  }

  if (srcStat.isDirectory()) {
    if (!options.recursive) {
      throw new Error(`cp: -r not specified; omitting directory '${src}'`);
    }

    // Create destination directory
    if (!fs.existsSync(finalDest)) {
      fs.mkdirSync(finalDest, { recursive: true });
    }

    // Copy directory contents
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      cp(path.join(src, entry), path.join(finalDest, entry), options);
    }
  } else {
    // Ensure parent directory exists
    const parentDir = path.dirname(finalDest);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // Copy file
    fs.copyFileSync(src, finalDest);
  }
}

// CLI usage - matches cp command syntax
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = { recursive: false };
  let src, dest;

  // Parse arguments like cp command
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-r" || args[i] === "-R") {
      options.recursive = true;
    } else if (!src) {
      src = args[i];
    } else if (!dest) {
      dest = args[i];
    }
  }

  if (!src || !dest) {
    console.log("Usage: node cp.js [-r] <source> <destination>");
    process.exit(1);
  }

  try {
    cp(src, dest, options);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = cp;
