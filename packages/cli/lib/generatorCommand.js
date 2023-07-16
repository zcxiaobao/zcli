import { program } from "commander";
export default function generatorCommand() {
  program.name("zcli").usage("<command> [options]").version("1.0.0");
  return program;
}
