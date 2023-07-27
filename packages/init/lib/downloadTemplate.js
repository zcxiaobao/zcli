import path from "node:path";
import fsExtra from "fs-extra";
import { execa } from "execa";
import ora from "ora";
import { pathExistsSync } from "path-exists";
import { printErrorLog, log } from "@zcxiaobao/utils";
function getCacheDir(targetPath) {
  return path.resolve(targetPath, "node_modules");
}

function makeCacheDir(targetPath) {
  const cacheDir = getCacheDir(targetPath);
  if (!pathExistsSync(cacheDir)) {
    fsExtra.mkdirpSync(cacheDir);
  }
}

async function downloadAddTemplate({ npmName, version }, targetPath) {
  const installCommand = "npm";
  const installArgs = ["install", `${npmName}@${version}`];
  const cwd = targetPath;
  log.verbose("cwd", cwd);
  log.verbose("installArgs", installArgs);
  await execa(installCommand, installArgs, { cwd });
}
export default async function downloadTemplate({ template, targetPath }) {
  makeCacheDir(targetPath);
  const spinner = ora("正在下载模板...").start();
  try {
    await downloadAddTemplate(template.template, targetPath);
    spinner.stop();
    log.success("下载模板成功");
  } catch (e) {
    spinner.stop();
    printErrorLog(e);
  }
}
