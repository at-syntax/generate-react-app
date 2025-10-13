import { copyTemplate } from "../template";
import fs from "fs";
import path from "path";
import os from "os";

describe("template", () => {
  let tempDir: string;

  // Create a shared temp directory for each test
  beforeEach(() => {
    tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "generate-react-app-test-")
    );
  });

  afterEach(() => {
    // Clean up temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // Helper functions for creating temp files and directories
  function createTempDir(relativePath: string): string {
    const fullPath = path.join(tempDir, relativePath);
    fs.mkdirSync(fullPath, { recursive: true });
    return fullPath;
  }

  function createTempFile(relativePath: string, content: string): string {
    const fullPath = path.join(tempDir, relativePath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content);
    return fullPath;
  }

  describe("copyTemplate", () => {
    it("should copy and process template files", async () => {
      // Create template structure
      const templateDir = createTempDir("template/typescript");
      createTempDir("template/common");
      const targetDir = createTempDir("target");

      // Create template files
      createTempFile(
        "template/common/.gitignore",
        "node_modules\n*.log\n{{%=PACKAGE_NAME%}}-temp"
      );
      createTempFile(
        "template/typescript/package.json",
        JSON.stringify({
          name: "{{%=PACKAGE_NAME%}}",
          description: "{{%=DESCRIPTION%}}",
          author: "{{%=AUTHOR_NAME%}} <{{%=AUTHOR_EMAIL%}}>",
        })
      );
      createTempFile(
        "template/typescript/src/index.ts",
        "// {{%=PACKAGE_NAME%}}"
      );

      const options = {
        targetPath: targetDir,
        slug: "my-library",
        description: "A test library",
        authorName: "John Doe",
        authorEmail: "john@example.com",
        authorUrl: "https://johndoe.com",
        repoUrl: "https://github.com/johndoe/my-library",
        language: "typescript" as const,
        bundler: "vite" as const,
        packageManager: "yarn" as const,
      };

      await copyTemplate(templateDir, targetDir, options);

      // Check that files were copied and processed
      const gitignoreContent = fs.readFileSync(
        path.join(targetDir, ".gitignore"),
        "utf8"
      );
      expect(gitignoreContent).toBe("node_modules\n*.log\nmy-library-temp");

      const packageJsonContent = fs.readFileSync(
        path.join(targetDir, "package.json"),
        "utf8"
      );
      const packageJson = JSON.parse(packageJsonContent);
      expect(packageJson.name).toBe("my-library");
      expect(packageJson.description).toBe("A test library");
      expect(packageJson.author).toBe("John Doe <john@example.com>");

      const indexContent = fs.readFileSync(
        path.join(targetDir, "src/index.ts"),
        "utf8"
      );
      expect(indexContent).toBe("// my-library");
    });

    it("should handle directories recursively", async () => {
      const templateDir = createTempDir("template/typescript");
      const targetDir = createTempDir("target");

      // Create nested directory structure
      createTempFile(
        "template/typescript/src/components/Button.tsx",
        "export const Button = () => <button>{{%=PACKAGE_NAME%}}</button>;"
      );
      createTempFile(
        "template/typescript/src/utils/helpers.ts",
        "export const name = '{{%=PACKAGE_NAME%}}';"
      );

      const options = {
        targetPath: targetDir,
        slug: "test-lib",
        description: "Test",
        authorName: "Test",
        authorEmail: "test@test.com",
        authorUrl: "",
        repoUrl: "",
        language: "typescript" as const,
        bundler: "vite" as const,
        packageManager: "npm" as const,
      };

      await copyTemplate(templateDir, targetDir, options);

      // Check nested files were created and processed
      const buttonContent = fs.readFileSync(
        path.join(targetDir, "src/components/Button.tsx"),
        "utf8"
      );
      expect(buttonContent).toBe(
        "export const Button = () => <button>test-lib</button>;"
      );

      const helpersContent = fs.readFileSync(
        path.join(targetDir, "src/utils/helpers.ts"),
        "utf8"
      );
      expect(helpersContent).toBe("export const name = 'test-lib';");
    });

    it("should rename special directory names", async () => {
      const templateDir = createTempDir("template/typescript");
      const targetDir = createTempDir("target");

      // Create files with special directory names
      createTempFile(
        "template/typescript/$.github/workflows/ci.yml",
        "name: CI"
      );
      createTempFile("template/typescript/$.vscode/settings.json", "{}");
      createTempFile("template/typescript/$.gitignore", "node_modules");

      const options = {
        targetPath: targetDir,
        slug: "test-lib",
        description: "Test",
        authorName: "Test",
        authorEmail: "test@test.com",
        authorUrl: "",
        repoUrl: "",
        language: "typescript" as const,
        bundler: "vite" as const,
        packageManager: "npm" as const,
      };

      await copyTemplate(templateDir, targetDir, options);

      // Check that special directories were renamed
      expect(
        fs.existsSync(path.join(targetDir, ".github/workflows/ci.yml"))
      ).toBe(true);
      expect(fs.existsSync(path.join(targetDir, ".vscode/settings.json"))).toBe(
        true
      );
      expect(fs.existsSync(path.join(targetDir, ".gitignore"))).toBe(true);
    });

    it("should override common files with language-specific files", async () => {
      const templateDir = createTempDir("template/typescript");
      createTempDir("template/common");
      const targetDir = createTempDir("target");

      // Create common file
      createTempFile(
        "template/common/README.md",
        "# Common {{%=PACKAGE_NAME%}}"
      );

      // Create language-specific file that should override
      createTempFile(
        "template/typescript/README.md",
        "# TypeScript {{%=PACKAGE_NAME%}}"
      );

      const options = {
        targetPath: targetDir,
        slug: "override-test",
        description: "Test",
        authorName: "Test",
        authorEmail: "test@test.com",
        authorUrl: "",
        repoUrl: "",
        language: "typescript" as const,
        bundler: "vite" as const,
        packageManager: "npm" as const,
      };

      await copyTemplate(templateDir, targetDir, options);

      const readmeContent = fs.readFileSync(
        path.join(targetDir, "README.md"),
        "utf8"
      );
      expect(readmeContent).toBe("# TypeScript override-test");
    });
  });
});
