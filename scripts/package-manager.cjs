#!/usr/bin/env node
/**
 * Package Manager Script
 *
 * This script manages package.json transformations for publishing:
 * - Default mode: Creates a minimal package.json for publishing by removing dev dependencies,
 *   dev scripts, and other non-essential fields
 * - Restore mode: Restores the original package.json from backup
 *
 * Usage:
 *   node package-manager.cjs          # Prepare for publishing
 *   node package-manager.cjs restore  # Restore original package.json
 *   node package-manager.cjs --help   # Show help
 */

const fs = require("fs");

// Constants
const PACKAGE_JSON = "package.json";
const BACKUP_FILE = "package.json.backup";

// Essential fields to include in minimal package.json
const ESSENTIAL_FIELDS = [
  "name",
  "version",
  "description",
  "keywords",
  "homepage",
  "bugs",
  "repository",
  "license",
  "author",
  "contributors",
  "exports",
  "main",
  "module",
  "types",
  "bin",
  "files",
  "dependencies",
  "peerDependencies",
  "peerDependenciesMeta",
  "bundledDependencies",
  "optionalDependencies",
  "publishConfig",
  "engines",
  "os",
  "cpu",
];

// Essential scripts that might be needed at runtime or for publishing
const ESSENTIAL_SCRIPTS = ["install", "preinstall", "postinstall"];

/**
 * Displays help information
 */
function showHelp() {
  console.log(`
Package Manager Script

USAGE:
  node package-manager.cjs [command]

COMMANDS:
  <none>    Prepare package.json for publishing (default)
  restore   Restore original package.json from backup
  --help    Show this help message

EXAMPLES:
  node package-manager.cjs          # Create minimal package.json
  node package-manager.cjs restore  # Restore from backup
`);
}

/**
 * Logs an error message and exits with error code
 * @param {string} message - Error message to display
 * @param {number} exitCode - Exit code (default: 1)
 */
function logErrorAndExit(message, exitCode = 1) {
  console.error(`❌ Error: ${message}`);
  process.exit(exitCode);
}

/**
 * Safely reads and parses JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {Object} Parsed JSON object
 */
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      logErrorAndExit(`File not found: ${filePath}`);
    } else if (error instanceof SyntaxError) {
      logErrorAndExit(`Invalid JSON in ${filePath}: ${error.message}`);
    } else {
      logErrorAndExit(`Failed to read ${filePath}: ${error.message}`);
    }
  }
}

/**
 * Safely writes JSON to file with atomic operation
 * @param {string} filePath - Path to write to
 * @param {Object} data - Data to write
 */
function writeJsonFile(filePath, data) {
  const tempFile = `${filePath}.tmp`;

  try {
    // Write to temporary file first (atomic operation)
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf8");

    // Atomically move temp file to final location
    fs.renameSync(tempFile, filePath);
  } catch (error) {
    // Clean up temp file if it exists
    if (fs.existsSync(tempFile)) {
      try {
        fs.unlinkSync(tempFile);
      } catch (cleanupError) {
        console.warn(`⚠️ Failed to clean up temp file: ${tempFile}`);
      }
    }
    logErrorAndExit(`Failed to write ${filePath}: ${error.message}`);
  }
}

/**
 * Creates minimal package.json by filtering essential fields
 * @param {Object} originalPackage - Original package.json content
 * @returns {Object} Minimal package.json content
 */
function createMinimalPackage(originalPackage) {
  const minimalPackage = {};

  // Copy essential fields
  ESSENTIAL_FIELDS.forEach(field => {
    if (
      originalPackage[field] !== undefined &&
      originalPackage[field] !== null
    ) {
      minimalPackage[field] = originalPackage[field];
    }
  });

  // Handle scripts specially - only include essential ones
  if (originalPackage.scripts) {
    const essentialScripts = {};
    let hasEssentialScripts = false;

    ESSENTIAL_SCRIPTS.forEach(scriptName => {
      if (originalPackage.scripts[scriptName]) {
        essentialScripts[scriptName] = originalPackage.scripts[scriptName];
        hasEssentialScripts = true;
      }
    });

    if (hasEssentialScripts) {
      minimalPackage.scripts = essentialScripts;
    }
  }

  return minimalPackage;
}

/**
 * Validates that we're in a valid Node.js project directory
 */
function validateProjectDirectory() {
  if (!fs.existsSync(PACKAGE_JSON)) {
    logErrorAndExit(
      `No package.json found in current directory: ${process.cwd()}\n` +
        "Please run this script from the project root directory."
    );
  }
}

/**
 * Prepares package.json for publishing
 */
function prepareForPublishing() {
  console.log("🚀 Preparing package.json for publishing...");

  // Validate environment
  validateProjectDirectory();

  // Check if backup already exists
  if (fs.existsSync(BACKUP_FILE)) {
    console.log("⚠️ Backup file already exists.");
    console.log(
      "   This might indicate package.json is already in minimal state."
    );
    console.log("   Use 'restore' command first if you want to start fresh.");
    console.log("   Overwriting existing backup...");
  }

  // Read and validate original package.json
  const originalPackage = readJsonFile(PACKAGE_JSON);

  // Validate required fields
  if (!originalPackage.name) {
    logErrorAndExit("package.json is missing required 'name' field");
  }
  if (!originalPackage.version) {
    logErrorAndExit("package.json is missing required 'version' field");
  }

  // Create minimal package
  const minimalPackage = createMinimalPackage(originalPackage);

  try {
    // Create backup of original package.json
    writeJsonFile(BACKUP_FILE, originalPackage);
    console.log(`📦 Original package.json backed up as ${BACKUP_FILE}`);

    // Write minimal package.json
    writeJsonFile(PACKAGE_JSON, minimalPackage);
    console.log("✅ Created minimal package.json for publishing");

    // Show what was included
    console.log("\n📋 Minimal package.json includes:");
    Object.keys(minimalPackage)
      .sort()
      .forEach(key => {
        const value = minimalPackage[key];
        if (typeof value === "object" && value !== null) {
          const itemCount = Array.isArray(value)
            ? value.length
            : Object.keys(value).length;
          console.log(`  - ${key} (${itemCount} items)`);
        } else {
          console.log(`  - ${key}`);
        }
      });

    console.log(
      `\n✨ Ready for publishing! Remember to run 'restore' after publishing.`
    );
  } catch (error) {
    logErrorAndExit(`Failed to prepare for publishing: ${error.message}`);
  }
}

/**
 * Restores original package.json from backup
 */
function restoreFromBackup() {
  console.log("🔄 Restoring original package.json...");

  // Validate environment
  validateProjectDirectory();

  // Check if backup exists
  if (!fs.existsSync(BACKUP_FILE)) {
    logErrorAndExit(
      `No backup found: ${BACKUP_FILE}\n` +
        "The original package.json may already be restored, or no backup was created."
    );
  }

  try {
    // Read backup
    const originalPackage = readJsonFile(BACKUP_FILE);

    // Restore original package.json
    writeJsonFile(PACKAGE_JSON, originalPackage);

    // Remove backup file
    fs.unlinkSync(BACKUP_FILE);

    console.log("✅ Successfully restored original package.json");
    console.log(`🔴 Removed backup file: ${BACKUP_FILE}`);
  } catch (error) {
    logErrorAndExit(`Failed to restore from backup: ${error.message}`);
  }
}

/**
 * Main function
 */
function main() {
  const command = process.argv[2];

  switch (command) {
    case "restore":
      restoreFromBackup();
      break;
    case "--help":
    case "-h":
      showHelp();
      break;
    case undefined:
      prepareForPublishing();
      break;
    default:
      console.error(`❌ Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

// Handle uncaught errors gracefully
process.on("uncaughtException", error => {
  console.error("❌ Uncaught Exception:", error.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Run the main function
main();
