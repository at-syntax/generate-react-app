import chalk from "chalk";
import { runCommand } from "./command-runner";

export async function isNpxPresent(): Promise<void> {
  try {
    await runCommand("npx", ["--help"]);
  } catch (error) {
    if (error != null && (error as Record<"code", unknown>).code === "ENOENT") {
      console.log(
        `Couldn't find ${chalk.blue(
          "npx"
        )}! Please install it by running ${chalk.blue("npm install -g npx")}`
      );

      process.exit(1);
    } else {
      throw error;
    }
  }
}
