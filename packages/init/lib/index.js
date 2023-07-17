import Command from "@zcxiaobao/command";
import { log } from "@zcxiaobao/utils";
class InitCommand extends Command {
  get command() {
    return "init [name]";
  }

  get description() {
    return "init project";
  }

  get options() {
    return [["-f, --force", "是否强制更新", false]];
  }

  action([name, opts]) {
    log.verbose("init", name, opts);
  }
}

function Init(instance) {
  return new InitCommand(instance);
}

export default Init;
