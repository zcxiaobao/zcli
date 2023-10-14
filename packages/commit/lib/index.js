import Command from "@zcxiaobao-cli/command";
import { log, Git } from "@zcxiaobao-cli/utils";

class CommitCommand extends Command {
  get command() {
    return "commit";
  }

  get description() {
    return "commit repository";
  }

  get options() {
    return [["-m, --merge", "是否发起合并请求", false]];
  }

  async action([options]) {
    log.info("commit指令启动");
    const projectPath = process.cwd();
    this.git = new Git(projectPath, options);
    await this.git.init();
    await this.git.prepare();
    await this.git.commit();
  }
}

function Commit(instance) {
  return new CommitCommand(instance);
}

export default Commit;
