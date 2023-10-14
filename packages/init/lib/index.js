import Command from "@zcxiaobao-cli/command";
import downloadTemplate from "./downloadTemplate.js";
import installTemplate from "./installTemplate.js";
import successInstallTemplate from "./successInstallTemplate.js";
import prepare from "./prepare.js";
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

  async action([projectName, options]) {
    // 1. 项目创建前的预备工作
    let installPath = process.cwd();
    if (!options.installPath) {
      options.installPath = installPath;
    }
    let selectedTemplate = await prepare(options);
    if (!selectedTemplate) {
      log.info("创建项目终止");
      return;
    }
    // 2. 下载项目模板至缓存目录
    await downloadTemplate(selectedTemplate);
    // 3. 安装项目模板至项目目录
    await installTemplate(selectedTemplate, options);
    // 4. 完成模板下载，后续是否进行依赖安装及自启动
    await successInstallTemplate(selectedTemplate, installPath);
  }
}

function Init(instance) {
  return new InitCommand(instance);
}

export default Init;
