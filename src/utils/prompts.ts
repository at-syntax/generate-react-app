import promptsModule from "prompts";

/**
 * prompts
 * @param args
 * @param options
 * @returns
 */
export function prompts(
  args: promptsModule.PromptObject | promptsModule.PromptObject[],
  options?: promptsModule.Options
) {
  return promptsModule(args, {
    onCancel() {
      process.exit(1);
    },
    ...options,
  });
}

export type PromptObject<T extends string = string> =
  promptsModule.PromptObject<T>;
