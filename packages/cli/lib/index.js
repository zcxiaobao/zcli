import CreateInitCommand from "@zcxiaobao/init";
import CreateInstallCommand from "@zcxiaobao/install";
import CreateCommitCommand from "@zcxiaobao/commit";
import CreatePublishCommand from "@zcxiaobao/publish";
import generatorCommand from "./generatorCommand.js";
import "./errorHander.js";
export default function () {
  const program = generatorCommand();
  CreateInitCommand(program);
  CreateInstallCommand(program);
  CreateCommitCommand(program);
  CreatePublishCommand(program);
  program.parse(process.argv);
}
