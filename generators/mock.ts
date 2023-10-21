import { sleep } from "bun";
import CommandGenerator from "../types/generator";

export default class MockGenerator implements CommandGenerator {
  async generateCommand(_: string) {
    await sleep(1000);
    return {
      command: 'git config user.name',
      history: [
        'git config user.name'
      ]
    };
  }
}