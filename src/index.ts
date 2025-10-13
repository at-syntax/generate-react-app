import path from "path";
import fs from "fs";
import yargs, { type Arguments } from "yargs";
import { hideBin } from "yargs/helpers";
import chalk from "chalk";
import { prompts } from "./utils/prompts";
import ora from "ora";
import type { Answers, ArgName, GenerateProjectOptions } from "./types";
import { copyTemplate } from "./template";
import { initializeGit, installDependencies } from "./commands";
import { args, getQuestions } from "./questions";
import { validateAndGetProject } from "./project-manager";
import { isNpxPresent } from "./utils/is-npx-present";
import { getGitUser } from "./utils/get-git-user";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function create(argv: Arguments<any>) {
  const { folder, basename } = validateAndGetProject(argv["project-name"]);

  await isNpxPresent();

  const { name, email } = getGitUser();

  const questions = getQuestions({
    slug: basename,
    authorName: name,
    authorEmail: email,
  });

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
