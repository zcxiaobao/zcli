import Command from "@zcxiaobao/command";
import { log, Git } from "@zcxiaobao/utils";

class CommitCommand extends Command {
  get command() {
    return "commit";
  }

  get description() {
    return "commit repository";
  }

  get options() {
    return [];
  }

  async action() {
    log.info("commit指令启动");
    const projectPath = process.cwd();
    this.git = new Git(projectPath);
    await this.git.prepare();
  }
}

function Commit(instance) {
  return new CommitCommand(instance);
}

export default Commit;
