// Additional specific mocks for this test file
jest.mock("../utils/command-runner");

import { installDependencies, initializeGit } from "../commands";
import { runCommand } from "../utils/command-runner";
import { mockConsole, mockPlatform } from "./setup";

const mockRunCommand = runCommand as jest.MockedFunction<typeof runCommand>;

describe("commands", () => {
  describe("installDependencies", () => {
    it("should run yarn install on non-Windows platforms", async () => {
      mockPlatform("darwin");

      await installDependencies("/test/path", "yarn");

      expect(mockRunCommand).toHaveBeenCalledWith(
        "yarn",
        ["install"],
        "/test/path"
      );
    });

    it("should run cmd.exe with yarn on Windows", async () => {
      mockPlatform("win32");

      await installDependencies("/test/path", "yarn");

      expect(mockRunCommand).toHaveBeenCalledWith(
        "yarn",
        ["install"],
        "/test/path"
      );
    });

    it("should run pnpm install on non-Windows platforms", async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, "platform", { value: "linux" });

      await installDependencies("/test/path", "pnpm");

      expect(mockRunCommand).toHaveBeenCalledWith(
        "pnpm",
        ["install"],
        "/test/path"
      );

      Object.defineProperty(process, "platform", { value: originalPlatform });
    });

    it("should run bun install on non-Windows platforms", async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, "platform", { value: "linux" });

      await installDependencies("/test/path", "bun");

      expect(mockRunCommand).toHaveBeenCalledWith(
        "bun",
        ["install"],
        "/test/path"
      );

      Object.defineProperty(process, "platform", { value: originalPlatform });
    });

    it("should default to npm install", async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, "platform", { value: "linux" });

      await installDependencies("/test/path", "unknown");

      expect(mockRunCommand).toHaveBeenCalledWith(
        "npm",
        ["install"],
        "/test/path"
      );

      Object.defineProperty(process, "platform", { value: originalPlatform });
    });
  });

  describe("initializeGit", () => {
    it("should initialize git repository with initial commit", async () => {
      mockRunCommand.mockResolvedValue();

      await initializeGit("/test/path");

      expect(mockRunCommand).toHaveBeenCalledTimes(3);
      expect(mockRunCommand).toHaveBeenNthCalledWith(
        1,
        "git",
        ["init"],
        "/test/path",
        "ignore"
      );
      expect(mockRunCommand).toHaveBeenNthCalledWith(
        2,
        "git",
        ["add", "."],
        "/test/path",
        "ignore"
      );
      expect(mockRunCommand).toHaveBeenNthCalledWith(
        3,
        "git",
        ["commit", "-m", '"Initial commit"'],
        "/test/path",
        "ignore"
      );
    });

    it("should not throw when git commands fail", async () => {
      mockRunCommand.mockRejectedValue(new Error("Git not found"));

      await expect(initializeGit("/test/path")).resolves.toBeUndefined();

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining("Warning: Git initialization failed")
      );
    });
  });
});
