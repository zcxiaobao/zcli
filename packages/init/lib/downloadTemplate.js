import path from "node:path";
import fsExtra from "fs-extra";
import { execa } from "execa";
import ora from "ora";
import { pathExistsSync } from "path-exists";
import {
  printErrorLog,
  log,
  getTargetTemplatePath,
  makeConfirm,
} from "@zcxiaobao/utils";

async function downloadAddTemplate({ npmName, version }, targetPath) {
  const installCommand = "npm";
  const installArgs = ["install", `${npmName}@${version}`];
  const cwd = targetPath;
  log.verbose("cwd", cwd);
  log.verbose("installArgs", installArgs);
  await execa(installCommand, installArgs, { cwd });
}
export default async function downloadTemplate({ template, targetPath }) {
  const { version, npmName } = template.template;
  // 1.检查模板是否存在
  const targetTemPath = getTargetTemplatePath(npmName);
  const targetTemPathExits = pathExistsSync(targetTemPath);
  log.verbose("targetTemPathExits", targetTemPathExits);
  // 2. 如果存在，询问是否更新模板
  if (!targetTemPathExits) {
    const spinner = ora("正在下载模板...").start();
    try {
      await downloadAddTemplate(template.template, targetPath);
      spinner.stop();
      log.success("下载模板成功");
    } catch (e) {
      spinner.stop();
      printErrorLog(e);
    }
  } else {
    log.info("模板已存在", `${npmName}@${version}`);
    log.info("模板路径", `${targetTemPath}`);
    const isUpdateTemplate = await makeConfirm({
      message: "是否更新模板",
    });
    if (isUpdateTemplate) {
      const spinner = ora("正在更新模板...").start();
      try {
        await downloadAddTemplate(template.template, targetPath);
        spinner.stop();
        log.success("更新模板成功");
      } catch (e) {
        spinner.stop();
        printErrorLog(e);
      }
    }
  }
}
