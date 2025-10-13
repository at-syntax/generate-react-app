import fs from "fs";
import path from "path";
import chalk from "chalk";

export const validateProjectName = (name: string): boolean => {
  // normal directory name
  const valid = /^[^<>:;,?"*|/\\]+$/.test(name);
  return valid;
};

export const directoryToProjectName = (dir: string): string => {
  return dir
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export function validateAndGetProject(projectName: string) {
  if (!projectName) {
    console.log(
      `Please specify the project name:\n${chalk.blue(
        "generate-react-app"
      )} ${chalk.green("<project-name>")}\n\nFor example:\n${chalk.blue(
        "generate-react-app"
      )} ${chalk.green("my-react-app")}\n\nRun ${chalk.blue(
        "generate-react-app --help"
      )} to see all options.`
    );
    process.exit(1);
  }

  const folder = path.join(process.cwd(), projectName);

  if (fs.existsSync(folder)) {
    console.log(
      `A folder already exists at ${chalk.blue(
        folder
      )}! Please specify another folder name or delete the existing one.`
    );

    process.exit(1);
  }

  const basename = path.basename(projectName);

  if (!validateProjectName(basename)) {
    console.log(
      chalk.red(
        `Cannot create a project named ${chalk.green(
          basename
        )} because of npm naming restrictions:\n\n* name can only contain URL-friendly characters\n\nPlease choose a different project name.`
      )
    );
    process.exit(1);
  }

  return { folder, basename };
}
