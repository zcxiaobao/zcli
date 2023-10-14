import CreateDefaultCommand from "@zcxiaobao-cli/default";
import CreateInitCommand from "@zcxiaobao-cli/init";
import CreateInstallCommand from "@zcxiaobao-cli/install";
import CreateCommitCommand from "@zcxiaobao-cli/commit";
import CreatePublishCommand from "@zcxiaobao-cli/publish";
import generatorCommand from "./generatorCommand.js";
import "./errorHander.js";
export default function () {
  const program = generatorCommand();
  CreateDefaultCommand(program);
  CreateInitCommand(program);
  CreateInstallCommand(program);
  CreateCommitCommand(program);
  CreatePublishCommand(program);
  program.parse(process.argv);
}
