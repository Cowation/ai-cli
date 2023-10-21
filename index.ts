import { oraPromise } from "ora";
import MockGenerator from "./generators/mock";
import OpenAIGenerator from "./generators/openai";
import { line } from "cli-spinners";
import { expand, input } from "@inquirer/prompts";
import { exec } from 'node:child_process';
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

const query = process.argv.splice(2).join(" ");

const generator = new OpenAIGenerator({
  model: "gpt-3.5-turbo"
});
// const generator = new MockGenerator();

const main = async (query: string, previousHistory?: ChatCompletionMessageParam[], tweak?: string) => {
  const { command, history } = await oraPromise(
    generator.generateCommand(query, {
      history: previousHistory,
      tweak
    }),
    {
      spinner: line,
      text: "Finding command...",
      successText: "Command generated!",
      failText: "Could not generate command.",
      discardStdin: false
    }
  );
  
  const answer = await expand({
    message: `${command}`,
    default: "e",
    choices: [
      {
        key: "e",
        name: "Execute",
        value: "execute"
      },
      {
        key: "r",
        name: "Regenerate",
        value: "regenerate"
      },
      {
        key: "t",
        name: "Tweak",
        value: "tweak"
      }
    ],
  })
  
  switch (answer) {
    case "execute":
      const child = exec(command);
      child.stdout?.pipe(process.stdout);
      child.stderr?.pipe(process.stderr);
  
      break;
    case "regenerate":
      main(query, history);
  
      break;
    case "tweak":
      const tweakMessage = (await input({
        message: "Tweak your command:",
      })).trim();
      
      main(query, history, tweakMessage);

      break;
  }
}

main(query);