// Additional specific mocks for this test file
jest.mock("fs");
jest.mock("path");

import fs from "fs";
import path from "path";
import chalk from "chalk";
import {
  validateProjectName,
  directoryToProjectName,
  validateAndGetProject,
} from "../project-manager";
import { mockConsole, mockProcess } from "./setup";

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;
const mockedChalk = chalk as jest.Mocked<typeof chalk>;

describe("project-manager", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default path mocks
    mockedPath.join = jest.fn((...args: string[]) => args.join("/"));
    mockedPath.basename = jest.fn(
      (pathStr: string) => pathStr.split("/").pop() || ""
    );

    // Mock process.cwd
    jest.spyOn(process, "cwd").mockReturnValue("/current/working/directory");

    // Clear console and process mocks
    mockConsole.log.mockClear();
    mockProcess.exit.mockClear();

    // Make process.exit throw for easier testing
    mockProcess.exit.mockImplementation(() => {
      throw new Error("Process exit called");
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("validateProjectName", () => {
    it("should return true for valid project names", () => {
      const validNames = [
        "my-react-app",
        "myapp",
        "MyApp123",
        "app_name",
        "react-app-2023",
        "simple",
        "CamelCaseApp",
        "kebab-case-app",
        "snake_case_app",
        "app123",
      ];

      validNames.forEach(name => {
        expect(validateProjectName(name)).toBe(true);
      });
    });

    it("should return false for invalid project names with special characters", () => {
      const invalidNames = [
        "app<name>",
        "app:name",
        "app;name",
        "app,name",
        "app?name",
        'app"name',
        "app*name",
        "app|name",
        "app/name",
        "app\\name",
      ];

      invalidNames.forEach(name => {
        expect(validateProjectName(name)).toBe(false);
      });
    });

    it("should return false for empty string", () => {
      expect(validateProjectName("")).toBe(false);
    });

    it("should handle unicode characters", () => {
      expect(validateProjectName("app-café")).toBe(true);
      expect(validateProjectName("мой-проект")).toBe(true);
    });
  });

  describe("directoryToProjectName", () => {
    it("should convert directory names to lowercase and handle spaces", () => {
      expect(directoryToProjectName("MyReactApp")).toBe("myreactapp");
      expect(directoryToProjectName("My React App")).toBe("my-react-app");
      expect(directoryToProjectName("myApp123")).toBe("myapp123");
    });

    it("should replace special characters and spaces with hyphens", () => {
      expect(directoryToProjectName("My@React#App")).toBe("my-react-app");
      expect(directoryToProjectName("app_name")).toBe("app-name");
      expect(directoryToProjectName("app.name")).toBe("app-name");
      expect(directoryToProjectName("app name")).toBe("app-name");
    });

    it("should remove leading and trailing hyphens", () => {
      expect(directoryToProjectName("-my-app-")).toBe("my-app");
      expect(directoryToProjectName("---app---")).toBe("app");
      expect(directoryToProjectName("@#$app@#$")).toBe("app");
    });

    it("should handle empty and whitespace-only strings", () => {
      expect(directoryToProjectName("")).toBe("");
      expect(directoryToProjectName("   ")).toBe("");
      expect(directoryToProjectName("@#$%")).toBe("");
    });

    it("should handle consecutive special characters", () => {
      expect(directoryToProjectName("my!!!react@@@app")).toBe("my-react-app");
      expect(directoryToProjectName("app   name")).toBe("app-name");
    });

    it("should preserve numbers", () => {
      expect(directoryToProjectName("App123")).toBe("app123");
      expect(directoryToProjectName("My App 2.0")).toBe("my-app-2-0");
    });
  });

  describe("validateAndGetProject", () => {
    it("should exit with error message when project name is empty", () => {
      expect(() => validateAndGetProject("")).toThrow("Process exit called");
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("Please specify the project name:")
      );
    });

    it("should exit with error message when project name is null or undefined", () => {
      expect(() => validateAndGetProject(null as unknown as string)).toThrow(
        "Process exit called"
      );
      expect(() =>
        validateAndGetProject(undefined as unknown as string)
      ).toThrow("Process exit called");
    });

    it("should exit when folder already exists", () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedPath.join.mockReturnValue("/current/working/directory/my-app");

      expect(() => validateAndGetProject("my-app")).toThrow(
        "Process exit called"
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("A folder already exists")
      );
    });

    it("should exit when project name is invalid", () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedPath.basename.mockReturnValue("invalid<name>");

      expect(() => validateAndGetProject("invalid<name>")).toThrow(
        "Process exit called"
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("Cannot create a project named")
      );
    });

    it("should return folder and basename for valid project", () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedPath.join.mockReturnValue(
        "/current/working/directory/my-react-app"
      );
      mockedPath.basename.mockReturnValue("my-react-app");

      const result = validateAndGetProject("my-react-app");

      expect(result).toEqual({
        folder: "/current/working/directory/my-react-app",
        basename: "my-react-app",
      });
    });

    it("should handle nested project paths", () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedPath.join.mockReturnValue(
        "/current/working/directory/nested/path/my-app"
      );
      mockedPath.basename.mockReturnValue("my-app");

      const result = validateAndGetProject("nested/path/my-app");

      expect(result).toEqual({
        folder: "/current/working/directory/nested/path/my-app",
        basename: "my-app",
      });
    });

    it("should call path.join with correct arguments", () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedPath.basename.mockReturnValue("test-app");

      validateAndGetProject("test-app");

      expect(mockedPath.join).toHaveBeenCalledWith(
        "/current/working/directory",
        "test-app"
      );
    });

    it("should call fs.existsSync with correct folder path", () => {
      const expectedPath = "/current/working/directory/test-app";
      mockedPath.join.mockReturnValue(expectedPath);
      mockedFs.existsSync.mockReturnValue(false);
      mockedPath.basename.mockReturnValue("test-app");

      validateAndGetProject("test-app");

      expect(mockedFs.existsSync).toHaveBeenCalledWith(expectedPath);
    });

    it("should call path.basename with project name", () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedPath.basename.mockReturnValue("my-app");

      validateAndGetProject("my-app");

      expect(mockedPath.basename).toHaveBeenCalledWith("my-app");
    });

    it("should use chalk colors in error messages", () => {
      // Test empty project name
      expect(() => validateAndGetProject("")).toThrow("Process exit called");
      expect(mockedChalk.blue).toHaveBeenCalled();
      expect(mockedChalk.green).toHaveBeenCalled();

      // Reset mocks
      jest.clearAllMocks();
      mockedPath.join = jest.fn((...args: string[]) => args.join("/"));
      mockedPath.basename = jest.fn(
        (pathStr: string) => pathStr.split("/").pop() || ""
      );
      mockProcess.exit.mockImplementation(() => {
        throw new Error("Process exit called");
      });

      // Test existing folder
      mockedFs.existsSync.mockReturnValue(true);
      mockedPath.join.mockReturnValue("/some/path");
      expect(() => validateAndGetProject("existing")).toThrow(
        "Process exit called"
      );
      expect(mockedChalk.blue).toHaveBeenCalled();

      // Reset mocks again
      jest.clearAllMocks();
      mockedPath.join = jest.fn((...args: string[]) => args.join("/"));
      mockedPath.basename = jest.fn(
        (pathStr: string) => pathStr.split("/").pop() || ""
      );
      mockProcess.exit.mockImplementation(() => {
        throw new Error("Process exit called");
      });

      // Test invalid name
      mockedFs.existsSync.mockReturnValue(false);
      mockedPath.basename.mockReturnValue("invalid<name>");
      expect(() => validateAndGetProject("invalid<name>")).toThrow(
        "Process exit called"
      );
      expect(mockedChalk.red).toHaveBeenCalled();
      expect(mockedChalk.green).toHaveBeenCalled();
    });

    it("should handle edge cases with project names containing path separators", () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedPath.join.mockReturnValue(
        "/current/working/directory/path/with/slashes"
      );
      mockedPath.basename.mockReturnValue("slashes");

      const result = validateAndGetProject("path/with/slashes");

      expect(result.basename).toBe("slashes");
    });
  });
});
