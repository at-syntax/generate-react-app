import chalk from "chalk";
import { runCommand } from "./utils/command-runner";

export async function installDependencies(
  targetPath: string,
  packageManager: string
): Promise<void> {
  let command: string;
  let args: string[];

  switch (packageManager) {
    case "yarn":
      command = "yarn";
      args = ["install"];
      break;
    case "pnpm":
      command = "pnpm";
      args = ["install"];
      break;
    case "bun":
      command = "bun";
      args = ["install"];
      break;
    default:
      command = "npm";
      args = ["install"];
      break;
  }

  await runCommand(command, args, targetPath);
}

export async function initializeGit(targetPath: string): Promise<void> {
  try {
    // Initialize git repository
    await runCommand("git", ["init"], targetPath, "ignore");

    // Add all files
    await runCommand("git", ["add", "."], targetPath, "ignore");

    // Initial commit
    await runCommand(
      "git",
      ["commit", "-m", '"Initial commit"'],
      targetPath,
      "ignore"
    );
  } catch (_error) {
    // Git initialization is not critical, so we don't throw
    console.warn(chalk.yellow("Warning: Git initialization failed"));
  }
}
