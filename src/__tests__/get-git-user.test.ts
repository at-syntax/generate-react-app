import { getGitUser } from "../utils/get-git-user";
import { spawnSync } from "child_process";

jest.mock("child_process");

const mockSpawnSync = spawnSync as jest.MockedFunction<typeof spawnSync>;

describe("get-git-user", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getGitUser", () => {
    it("should return git user name and email", () => {
      mockSpawnSync
        .mockReturnValueOnce({
          stdout: Buffer.from("John Doe"),
          stderr: Buffer.from(""),
          status: 0,
          signal: null,
          pid: 1234,
          output: [null, Buffer.from("John Doe"), Buffer.from("")],
        })
        .mockReturnValueOnce({
          stdout: Buffer.from("john@example.com"),
          stderr: Buffer.from(""),
          status: 0,
          signal: null,
          pid: 1235,
          output: [null, Buffer.from("john@example.com"), Buffer.from("")],
        });

      const result = getGitUser();

      expect(result).toEqual({
        name: "John Doe",
        email: "john@example.com",
      });

      expect(mockSpawnSync).toHaveBeenCalledTimes(2);
      expect(mockSpawnSync).toHaveBeenNthCalledWith(1, "git", [
        "config",
        "--get",
        "user.name",
      ]);
      expect(mockSpawnSync).toHaveBeenNthCalledWith(2, "git", [
        "config",
        "--get",
        "user.email",
      ]);
    });

    it("should handle git command errors gracefully", () => {
      mockSpawnSync.mockImplementation(() => {
        throw new Error("Git not found");
      });

      const result = getGitUser();

      expect(result).toEqual({
        name: undefined,
        email: undefined,
      });
    });

    it("should trim whitespace from git output", () => {
      mockSpawnSync
        .mockReturnValueOnce({
          stdout: Buffer.from("  John Doe  \n"),
          stderr: Buffer.from(""),
          status: 0,
          signal: null,
          pid: 1234,
          output: [null, Buffer.from("  John Doe  \n"), Buffer.from("")],
        })
        .mockReturnValueOnce({
          stdout: Buffer.from("\n  john@example.com  \n"),
          stderr: Buffer.from(""),
          status: 0,
          signal: null,
          pid: 1235,
          output: [
            null,
            Buffer.from("\n  john@example.com  \n"),
            Buffer.from(""),
          ],
        });

      const result = getGitUser();

      expect(result).toEqual({
        name: "John Doe",
        email: "john@example.com",
      });
    });
  });
});
