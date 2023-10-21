export default interface CommandGenerator {
  generateCommand: (request: string, options?: any) => Promise<{ command: string } & {[key: string]: any}>;
}