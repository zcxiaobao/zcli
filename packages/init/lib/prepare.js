import { homedir } from "node:os";
import path from "node:path";
import fsExtra from "fs-extra";
import { log, makeConfirm, printErrorLog } from "@zcxiaobao/utils";
import createTeplate from "./createTemplate.js";

const TEMP_HOME = ".zcli";
export default async function perpare(options) {
  // 1. 确保 targetPath 与 installPath 存在
  const targetPath = makeTargetPath();
  await ensureNeedDir(targetPath, options.installPath);
  // 2. 检测下载路径是否为空
  let fileList = fsExtra.readdirSync(options.installPath);
  fileList = fileList.filter(
    (file) => !["node_modules", ".git", ".DS_Store", ""].includes(file)
  );
  log.verbose("fileList", fileList);
  let contineWhenDirNotEmpty = true;
  if (fileList && fileList.length > 0) {
    contineWhenDirNotEmpty = await makeConfirm({
      message: "当前文件夹不为空，是否继续创建项目？",
    });
  }
  if (!contineWhenDirNotEmpty) {
    return false;
  }
  // 3. 检测是否存在强制覆盖
  if (options.force) {
    const confirmForceInit = makeConfirm({
      message: "是否确认清空当前目录下的文件？",
    });
    if (confirmForceInit) {
      fsExtra.emptyDirSync(options.installPath);
    }
  }
  // 4. 交互式获取待下载模板信息
  let template = await createTeplate();
  return {
    targetPath,
    template,
  };
}

// 安装缓存目录
function makeTargetPath() {
  return path.resolve(`${homedir()}/${TEMP_HOME}`, "template");
}

// 确保缓存目录和安装目录存在
async function ensureNeedDir(targetPath, installPath) {
  const temTargetPath = path.resolve(targetPath, "node_modules");
  try {
    await fsExtra.ensureDir(temTargetPath);
    await fsExtra.ensureDir(installPath);
  } catch (e) {
    printErrorLog(e);
  }
}
