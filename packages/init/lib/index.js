import Command from "@zcxiaobao/command";
import { log } from "@zcxiaobao/utils";
import createTeplate from "./createTemplate.js";
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
    // 1. 选择项目模板，生成项目信息
    createTeplate(name, opts);
    // 2. 下载项目模板至缓存目录
    // 3. 安装项目模板至项目目录
  }
}

function Init(instance) {
  return new InitCommand(instance);
}

export default Init;
