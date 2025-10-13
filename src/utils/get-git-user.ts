import { spawnSync } from "child_process";

export function getGitUser() {
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
  return { name, email };
}
