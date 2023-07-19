import path from "node:path";
import fsExtra from "fs-extra";
import { pathExistsSync } from "path-exists";
import ora from "ora";
import { log } from "@zcxiaobao/utils";

function getCacheFilePath(targetPath, template) {
  return path.resolve(targetPath, "node_modules", template.npmName, "template");
}
function copyFile(targetPath, installDir, template, name) {
  const originFile = getCacheFilePath(targetPath, template);
  const fileList = fsExtra.readdirSync(originFile);
  const spinner = ora("正在拷贝模板文件...").start();
  fileList.map((file) => {
    fsExtra.copySync(`${originFile}/${file}`, `${installDir}/${file}`);
  });
  spinner.stop();
  log.success("模板拷贝成功");
}

export default function installTemplate(selectedTemplate, opts) {
  const { force = false } = opts;
  const { targetPath, name, template } = selectedTemplate;
  const rootDir = process.cwd();
  const installDir = path.resolve(`${rootDir}/${name}`);
  log.info(installDir);
  fsExtra.ensureDir(targetPath);

  if (pathExistsSync(installDir)) {
    if (!force) {
      log.error(`当前目录中已经存在${installDir}文件夹`);
    } else {
      fsExtra.removeSync(installDir);
      fsExtra.ensureDir(installDir);
    }
  } else {
    fsExtra.ensureDir(installDir);
  }
  copyFile(targetPath, installDir, template, name);
}
