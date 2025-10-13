// Additional specific mocks for this test file
jest.mock("../utils/command-runner");

import { isNpxPresent } from "../utils/is-npx-present";
import { runCommand } from "../utils/command-runner";
import { mockConsole, mockProcess } from "./setup";

const mockRunCommand = runCommand as jest.MockedFunction<typeof runCommand>;

describe("is-npx-present", () => {
  describe("isNpxPresent", () => {
    it("should resolve when npx is available", async () => {
      mockRunCommand.mockResolvedValue();

      await expect(isNpxPresent()).resolves.toBeUndefined();

      expect(mockRunCommand).toHaveBeenCalledWith("npx", ["--help"]);
    });

    it("should exit with error message when npx is not found", async () => {
      const error = { code: "ENOENT" } as NodeJS.ErrnoException;
      mockRunCommand.mockRejectedValue(error);

      await isNpxPresent();

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't find npx!")
      );
      expect(mockProcess.exit).toHaveBeenCalledWith(1);
    });

    it("should throw other errors", async () => {
      const error = new Error("Network error");
      mockRunCommand.mockRejectedValue(error);

      await expect(isNpxPresent()).rejects.toThrow("Network error");
    });

    it("should handle null errors", async () => {
      mockRunCommand.mockRejectedValue(null);

      await expect(isNpxPresent()).rejects.toBe(null);
    });
  });
});
