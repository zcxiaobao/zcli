import Command from "@zcxiaobao/command";
import { log, Git } from "@zcxiaobao/utils";

class PublishCommand extends Command {
  get command() {
    return "publish";
  }

  get description() {
    return "publish repository";
  }

  get options() {
    return [];
  }

  async action() {
    log.info("publish指令启动");
    const projectPath = process.cwd();
    this.git = new Git(projectPath);
    await this.git.init();
    await this.git.prepare();
    await this.git.publish();
  }
}

function Publish(instance) {
  return new PublishCommand(instance);
}

export default Publish;
