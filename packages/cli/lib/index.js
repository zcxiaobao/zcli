import CreateInitCommand from "@zcxiaobao/init";
import CreateInstallCommand from "@zcxiaobao/install";

import generatorCommand from "./generatorCommand.js";
import "./errorHander.js";
export default function () {
  const program = generatorCommand();
  CreateInitCommand(program);
  CreateInstallCommand(program);
  program.parse(process.argv);
}
