import CreateInitCommand from "@zc-clis/init";
import generatorCommand from "./generatorCommand.js";

export default function () {
  const program = generatorCommand();
  CreateInitCommand(program);
  program.parse(process.argv);
}
