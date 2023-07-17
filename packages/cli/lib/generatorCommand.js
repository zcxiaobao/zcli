import { program } from "commander";
export default function generatorCommand() {
  program
    .name("zcli")
    .usage("<command> [options]")
    .version("1.0.0")
    .option("-d, --debug", "是否开启调试模式", false);

  program.on("option:debug", function () {
    console.log(program.opts());
    if (program.opts().debug) {
      //   log.verbose("debug", "launch debug mode");
    }
  });

  return program;
}
