import type { GenerateProjectOptions } from "./types";
import fs from "fs";
import path from "path";
import ejs from "ejs";

function renderTemplate(
  content: string,
  options: GenerateProjectOptions
): string {
  try {
    return ejs.render(
      content,
      {
        PACKAGE_NAME: options.slug,
        DESCRIPTION: options.description,
        AUTHOR_NAME: options.authorName || "",
        AUTHOR_EMAIL: options.authorEmail || "",
        AUTHOR_URL: options.authorUrl || "",
        REPO_URL: options.repoUrl || "",
        PACKAGE_MANAGER: options.packageManager,
        // Expose the full options object for more complex templating
        options: options,
      },
      {
        openDelimiter: "{{",
        closeDelimiter: "}}",
      }
    );
  } catch (error) {
    throw new Error("Failed to render template", {
      cause: error,
    });
  }
}

function renderFileName(
  fileName: string,
  options: GenerateProjectOptions
): string {
  try {
    return ejs.render(fileName.replace(/^\$/, ""), options);
  } catch (error) {
    throw new Error(`Failed to render file name: ${fileName}`, {
      cause: error,
    });
  }
}

async function copyTemplateFiles(
  templatePath: string,
  targetPath: string,
  options: GenerateProjectOptions
) {
  const files = fs.readdirSync(templatePath, { withFileTypes: true });

  for (const file of files) {
    const sourcePath = path.join(templatePath, file.name);
    // Rename special files back to their dot-prefixed names in the destination
    const destName = renderFileName(file.name, options);

    const destPath = path.join(targetPath, destName);

    if (file.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      await copyTemplateFiles(sourcePath, destPath, options);
    } else {
      const content = fs.readFileSync(sourcePath, "utf8");
      const processedContent = renderTemplate(content, options);
      fs.writeFileSync(destPath, processedContent);
    }
  }
}

export async function copyTemplate(
  templatePath: string,
  targetPath: string,
  options: GenerateProjectOptions
) {
  // Copy common files that are shared across all templates
  const commonTemplatePath = path.join(path.dirname(templatePath), "common");
  if (fs.existsSync(commonTemplatePath)) {
    await copyTemplateFiles(commonTemplatePath, targetPath, options);
  }

  // Copy language-specific template files (which may override common files)
  await copyTemplateFiles(templatePath, targetPath, options);
}
