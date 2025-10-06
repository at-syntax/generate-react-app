import path from "path";
import fs from "fs";
import yargs, { type Arguments, type Options } from "yargs";
import { hideBin } from "yargs/helpers";
import chalk from "chalk";
import { spawn, spawnSync } from "child_process";
import githubUsername from "github-username";
import { type PromptObject, prompts } from "./utils/prompts";
import ora from "ora";

type ArgName =
  | "slug"
  | "description"
  | "author-name"
  | "author-email"
  | "author-url"
  | "repo-url"
  | "language"
  | "bundler"
  | "package-manager";

interface GenerateProjectOptions {
  targetPath: string;
  slug: string;
  description: string;
  authorName?: string;
  authorEmail?: string;
  authorUrl?: string;
  repoUrl?: string;
  language: "javascript" | "typescript";
  bundler: "webpack" | "vite" | "rollup";
  packageManager: "npm" | "yarn" | "pnpm" | "bun";
}

const validateProjectName = (name: string): boolean => {
  // normal directory name
  const valid = /^[^<>:;,?"*|/\\]+$/.test(name);
  return valid;
};

const directoryToProjectName = (dir: string): string => {
  return dir
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

async function generateProject(options: GenerateProjectOptions) {
  const { targetPath, language, bundler } = options;

  // Create target directory
  fs.mkdirSync(targetPath, { recursive: true });

  // Get template path
  const templatePath = path.join(
    __dirname,
    "templates",
    `${language}-${bundler}`
  );

  // Copy and process template files
  await copyTemplate(templatePath, targetPath, options);
}

async function copyTemplate(
  templatePath: string,
  targetPath: string,
  options: GenerateProjectOptions
) {
  const files = fs.readdirSync(templatePath, { withFileTypes: true });

  for (const file of files) {
    const sourcePath = path.join(templatePath, file.name);
    // Rename special files back to their dot-prefixed names in the destination
    let destName = file.name;
    if (file.name === "_vscode") destName = ".vscode";
    if (file.name === "_gitignore") destName = ".gitignore";
    const destPath = path.join(targetPath, destName);

    if (file.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      await copyTemplate(sourcePath, destPath, options);
    } else {
      const content = fs.readFileSync(sourcePath, "utf8");
      const processedContent = replaceTemplateVariables(content, options);
      fs.writeFileSync(destPath, processedContent);
    }
  }
}

function replaceTemplateVariables(
  content: string,
  options: GenerateProjectOptions
): string {
  return content
    .replace(/\{\{PACKAGE_NAME\}\}/g, options.slug)
    .replace(/\{\{DESCRIPTION\}\}/g, options.description)
    .replace(/\{\{AUTHOR_NAME\}\}/g, options.authorName || "")
    .replace(/\{\{AUTHOR_EMAIL\}\}/g, options.authorEmail || "")
    .replace(/\{\{AUTHOR_URL\}\}/g, options.authorUrl || "")
    .replace(/\{\{REPO_URL\}\}/g, options.repoUrl || "")
    .replace(/\{\{PACKAGE_MANAGER\}\}/g, options.packageManager);
}

async function installDependencies(
  targetPath: string,
  packageManager: string
): Promise<void> {
  return new Promise((resolve, reject) => {
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

    const child = spawn(command, args, {
      cwd: targetPath,
      stdio: "pipe",
    });

    child.on("close", code => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`${command} ${args.join(" ")} failed with code ${code}`)
        );
      }
    });

    child.on("error", reject);
  });
}

async function initializeGit(targetPath: string): Promise<void> {
  try {
    // Initialize git repository
    await runCommand("git", ["init"], targetPath);

    // Add all files
    await runCommand("git", ["add", "."], targetPath);

    // Initial commit
    await runCommand("git", ["commit", "-m", "Initial commit"], targetPath);
  } catch (_error) {
    // Git initialization is not critical, so we don't throw
    console.warn(chalk.yellow("Warning: Git initialization failed"));
  }
}

function runCommand(
  command: string,
  args: string[],
  cwd: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "ignore",
    });

    child.on("close", code => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`${command} ${args.join(" ")} failed with code ${code}`)
        );
      }
    });

    child.on("error", reject);
  });
}

type Answers = {
  slug: string;
  description: string;
  authorName?: string;
  authorEmail?: string;
  authorUrl?: string;
  repoUrl?: string;
  language: "javascript" | "typescript";
  bundler: "webpack" | "vite" | "rollup";
  packageManager: "npm" | "yarn" | "pnpm" | "bun";
};

const args: Record<ArgName, Options> = {
  slug: {
    description: "Name of the project",
    type: "string",
  },
  description: {
    description: "Description of the project",
    type: "string",
  },
  "author-name": {
    description: "Name of the project author",
    type: "string",
  },
  "author-email": {
    description: "Email address of the project author",
    type: "string",
  },
  "author-url": {
    description: "URL for the project author",
    type: "string",
  },
  "repo-url": {
    description: "URL for the repository",
    type: "string",
  },
  language: {
    description: "Language for the repository",
    type: "string",
  },
  bundler: {
    description: "Bundler to use",
    type: "string",
  },
  "package-manager": {
    description: "Package manager to use",
    type: "string",
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function create(argv: Arguments<any>) {
  if (!argv["project-name"]) {
    console.log(
      `Please specify the project name:\n${chalk.blue(
        "generate-react-app"
      )} ${chalk.green("<project-name>")}\n\nFor example:\n${chalk.blue(
        "generate-react-app"
      )} ${chalk.green("my-react-project")}\n\nRun ${chalk.blue(
        "generate-react-app --help"
      )} to see all options.`
    );
    process.exit(1);
  }

  const folder = path.join(process.cwd(), argv["project-name"]);

  if (fs.existsSync(folder)) {
    console.log(
      `A folder already exists at ${chalk.blue(
        folder
      )}! Please specify another folder name or delete the existing one.`
    );

    process.exit(1);
  }

  const basename = path.basename(argv["project-name"]);

  if (!validateProjectName(basename)) {
    console.log(
      chalk.red(
        `Cannot create a project named ${chalk.green(
          basename
        )} because of naming restrictions:\n\n* name can only contain conventional characters\n\nPlease choose a different project name.`
      )
    );
    process.exit(1);
  }

  try {
    const child = spawn("npx", ["--help"]);

    await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("close", resolve);
    });
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

  let name, email;

  try {
    name = spawnSync("git", ["config", "--get", "user.name"])
      .stdout.toString()
      .trim();

    email = spawnSync("git", ["config", "--get", "user.email"])
      .stdout.toString()
      .trim();
  } catch (_e) {
    // Ignore error
  }

  const questions: Record<
    ArgName,
    Omit<PromptObject<keyof Answers>, "validate"> & {
      validate?: (value: string) => boolean | string;
    }
  > = {
    slug: {
      type: "text",
      name: "slug",
      message: "What is the name of the project?",
      initial: directoryToProjectName(basename),
      validate: input =>
        validateProjectName(input) || "Must be a valid project name",
    },
    description: {
      type: "text",
      name: "description",
      message: "What is the description for the project? (optional)",
      validate: input => !input || "Cannot be empty",
    },
    "author-name": {
      type: "text",
      name: "authorName",
      message: "What is the name of project author? (optional)",
      initial: name,
    },
    "author-email": {
      type: "text",
      name: "authorEmail",
      message: "What is the email address for the project author? (optional)",
      initial: email,
      validate: input =>
        !input ||
        /^\S+@\S+$/.test(input) ||
        "Must be a valid email address if provided",
    },
    "author-url": {
      type: "text",
      name: "authorUrl",
      message: "What is the URL for the project author? (optional)",
      initial: async (previous: string) => {
        let url = "";
        try {
          const username = await githubUsername(previous);
          url = `https://github.com/${username}`;
        } catch (_e) {
          url = "";
        }
        return url;
      },
      validate: input =>
        !input ||
        /^https?:\/\//.test(input) ||
        "Must be a valid URL if provided",
    },
    "repo-url": {
      type: "text",
      name: "repoUrl",
      message: "What is the URL for the repository? (optional)",
      initial: (_: string, answers: Answers) => {
        if (
          answers.authorUrl &&
          /^https?:\/\/github.com\/[^/]+/.test(answers.authorUrl)
        ) {
          return `${answers.authorUrl}/${answers.slug
            .replace(/^@/, "")
            .replace(/\//g, "-")}`;
        }

        return "";
      },
      validate: input =>
        !input ||
        /^https?:\/\//.test(input) ||
        "Must be a valid URL if provided",
    },
    language: {
      type: "select",
      name: "language",
      message: "Which language do you prefers?",
      active: "javascript",
      choices: [
        { title: "Javascript", value: "javascript" },
        { title: "Typescript", value: "typescript" },
      ],
    },
    bundler: {
      type: "select",
      name: "bundler",
      message: "Which bundler would you like to use?",
      active: "vite",
      choices: [
        { title: "Vite", value: "vite" },
        { title: "Webpack", value: "webpack" },
        { title: "Rollup", value: "rollup" },
      ],
    },
    "package-manager": {
      type: "select",
      name: "packageManager",
      message: "Which package manager would you like to use?",
      active: "npm",
      choices: [
        { title: "npm", value: "npm" },
        { title: "Yarn", value: "yarn" },
        { title: "pnpm", value: "pnpm" },
        { title: "Bun", value: "bun" },
      ],
    },
  };

  // Validate arguments passed to the CLI
  for (const [key, value] of Object.entries(argv)) {
    if (value == null) {
      continue;
    }

    const question = questions[key as ArgName];

    if (question == null) {
      continue;
    }

    let valid = question.validate ? question.validate(String(value)) : true;

    // We also need to guard against invalid choices
    // If we don't already have a validation message to provide a better error
    if (typeof valid !== "string" && "choices" in question) {
      const choices =
        typeof question.choices === "function"
          ? question.choices(undefined, argv, question)
          : question.choices;

      if (choices && !choices.some(choice => choice.value === value)) {
        valid = `Supported values are - ${choices.map(c =>
          chalk.green(c.value)
        )}`;
      }
    }

    if (valid !== true) {
      let message = `Invalid value ${chalk.red(
        String(value)
      )} passed for ${chalk.blue(key)}`;

      if (typeof valid === "string") {
        message += `: ${valid}`;
      }

      console.log(message);

      process.exit(1);
    }
  }

  const {
    slug,
    description,
    authorName,
    authorEmail,
    authorUrl,
    repoUrl,
    language,
    bundler,
    packageManager,
  } = {
    ...argv,
    ...(await prompts(
      Object.entries(questions)
        .filter(([key, val]) => {
          // Skip questions which are passed as parameter and pass validation
          if (argv[key] != null && val.validate?.(argv[key]) !== false) {
            return false;
          }

          // Skip questions with a single choice
          if (Array.isArray(val.choices) && val.choices.length === 1) {
            return false;
          }

          return true;
        })
        .map(([, v]) => {
          const { type, choices } = v;

          // Skip dynamic questions with a single choice
          if (type === "select" && typeof choices === "function") {
            return {
              ...v,
              type: (prev, values, prompt) => {
                const result = choices(prev, { ...argv, ...values }, prompt);

                if (result && result.length === 1) {
                  return null;
                }

                return type;
              },
            };
          }

          return v;
        })
    )),
  } as Answers;

  const spinner = ora("Generating template").start();

  try {
    await generateProject({
      targetPath: folder,
      slug,
      description,
      authorName,
      authorEmail,
      authorUrl,
      repoUrl,
      language,
      bundler,
      packageManager,
    });

    spinner.text = "Installing dependencies...";
    await installDependencies(folder, packageManager);

    spinner.text = "Initializing git repository...";
    await initializeGit(folder);

    spinner.succeed("Template generated successfully!");

    console.log(`\n✨ Created ${chalk.green(slug)} in ${chalk.blue(folder)}`);
    console.log("\nNext steps:");
    console.log(`  ${chalk.blue("cd")} ${basename}`);

    // Show package manager specific commands
    const runCommand =
      packageManager === "npm"
        ? "npm run"
        : packageManager === "yarn"
          ? "yarn"
          : `${packageManager} run`;
    const testCommand =
      packageManager === "npm"
        ? "npm test"
        : packageManager === "yarn"
          ? "yarn test"
          : `${packageManager} test`;

    console.log(`  ${chalk.blue(runCommand)} build`);
    console.log(`  ${chalk.blue(testCommand)}`);
    console.log(`\nHappy coding! 🚀`);
  } catch (error) {
    spinner.fail("Failed to generate template");
    console.error(
      chalk.red("\nError:"),
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

async function main() {
  await yargs(hideBin(process.argv))
    .command(
      "$0 [project-name]",
      "create a well configured react project",
      args,
      create
    )
    .demandCommand()
    .recommendCommands()
    .fail((message, error) => {
      console.log("\n");

      if (error) {
        console.log(chalk.red(error.message));
        throw error;
      }

      if (message) {
        console.log(chalk.red(message));
      } else {
        console.log(
          chalk.red(`An unknown error occurred. See '--help' for usage guide.`)
        );
      }

      process.exit(1);
    })
    .strict().argv;
}

main().catch(error => {
  console.error(chalk.red("Fatal error:"), error);
  process.exit(1);
});
