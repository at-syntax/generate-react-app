import type { Options } from "yargs";
import type { Answers, ArgName } from "./types";
import type { PromptObject } from "./utils/prompts";
import githubUsername from "github-username";
import { validateProjectName, directoryToProjectName } from "./project-manager";

export const args: Record<ArgName, Options> = {
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

export function getQuestions(initialAnswers: Partial<Answers>): Record<
  ArgName,
  Omit<PromptObject<keyof Answers>, "validate"> & {
    validate?: (value: string) => boolean | string;
  }
> {
  return {
    slug: {
      type: "text",
      name: "slug",
      message: "What is the name of the project?",
      initial: directoryToProjectName(initialAnswers.slug ?? ""),
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
      initial: initialAnswers.authorName,
    },
    "author-email": {
      type: "text",
      name: "authorEmail",
      message: "What is the email address for the project author? (optional)",
      initial: initialAnswers.authorEmail,
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
}
