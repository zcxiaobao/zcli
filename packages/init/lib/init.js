import Command from "@zc-clis/command";

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

  action() {
    console.log("创建项目");
  }
}

function Init(instance) {
  return new InitCommand(instance);
}

export default Init;
