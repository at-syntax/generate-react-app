import { spawn, type StdioOptions } from "child_process";

function buildCommand(command: string, args: string[]) {
  try {
    // Determine the platform
    const isWin = process.platform === "win32";

    args = isWin ? ["/c", command, ...args] : args;
    command = isWin ? "cmd.exe" : command;

    return { command, args };
  } catch (_error) {
    console.error(`Unable to execute command: ${command} ${args.join(" ")}`);
    return { command, args };
  }
}

export function runCommand(
  command: string,
  args: string[],
  cwd?: string,
  stdio?: StdioOptions
): Promise<void> {
  const { command: cmd, args: cmdArgs } = buildCommand(command, args);

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, {
      cwd,
      stdio,
      shell: true,
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
