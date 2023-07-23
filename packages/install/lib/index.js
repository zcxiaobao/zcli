import Command from "@zcxiaobao/command";
import { log, Github } from "@zcxiaobao/utils";

class InstallCommand extends Command {
  get command() {
    return "install";
  }

  get description() {
    return "install repository";
  }

  get options() {
    return [];
  }

  async action() {
    log.info("install指令启动");
    const github = new Github();
    github.init();
  }
}

function Install(instance) {
  return new InstallCommand(instance);
}

export default Install;
