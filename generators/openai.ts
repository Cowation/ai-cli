import OpenAI from "openai";
import CommandGenerator from "../types/generator";
import { ChatCompletionCreateParams, ChatCompletionCreateParamsBase, ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";
import { platform, release, type, version } from "os";

type GPTModel = ChatCompletionCreateParamsBase['model'];

export default class OpenAIGenerator implements CommandGenerator {
  model: GPTModel;
  openai: OpenAI;

  constructor(options: {
    model: GPTModel
  }) {
    this.model = options.model;
    this.openai = new OpenAI();
  }

  async generateCommand(request: string, options?: { history?: ChatCompletionMessageParam[], tweak?: string }) {
    const messages = [
      {
        role: "system",
        content: `Respond only with a single shell command.\n OS Type: ${type()}\nOS Platform: ${platform()}\nOS Release: ${release()}\nOS Version: ${version()}\n`,
      },
      ...options?.history ?? [],
    ] satisfies ChatCompletionMessageParam[];

    if (options?.tweak) {
      messages.push({
        role: "user",
        content: `Tweak the command to meet the following criteria:\n${options.tweak}`
      });
    } else if (options?.history) {
      messages.push({
        role: "user",
        content: "Regenerate a new command."
      });
    } else {
      messages.push({
        role: "user",
        content: `Create a shell command that accomplishes the following:\n${request}`
      });
    }

    const chatCompletion = await this.openai.chat.completions.create({
      model: this.model,
      messages,
      function_call: {
        name: "runCommand"
      },
      functions: [
        {
          name: "runCommand",
          description: "Runs a shell command.",
          parameters: {
            type: "object",
            properties: {
              command: {
                type: "string",
                description: "The command to run."
              }
            },
            required: ["command"]
          }
        }
      ]
    });

    if (!chatCompletion.choices[0].message.function_call) throw new Error("echo \"No function called by model\"");

    const args = JSON.parse(chatCompletion.choices[0].message.function_call.arguments);

    return {
      command: args.command,
      history: [
        ...messages.slice(1),
        {
          role: "assistant",
          content: args.command
        }
      ] satisfies ChatCompletionMessageParam[]
    }
  }
}