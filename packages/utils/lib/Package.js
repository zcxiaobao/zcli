import { homedir } from "node:os";
import path from "node:path";
import { pathExistsSync } from "path-exists";
import fsExtra from "fs-extra";
import { TEMP_HOME } from "./constType.js";
import printErrorLog from "./printErrorLog.js";

// 获取缓存目录
export function makeTargetPath() {
  return path.resolve(`${homedir()}/${TEMP_HOME}`, "template");
}
// 获取模板的缓存路径
export function getTargetTemplatePath(npmName) {
  return path.resolve(makeTargetPath(), "node_modules", npmName);
}

export function getTargetTemplatePathExits(npmName) {
  return pathExistsSync(getTargetTemplatePath(npmName));
}

export function pathExists(path) {
  return pathExistsSync(path);
}
// 确保缓存目录和安装目录存在
export async function ensureNeedDir(targetPath, installPath) {
  const temTargetPath = path.resolve(targetPath, "node_modules");
  try {
    await fsExtra.ensureDir(temTargetPath);
    await fsExtra.ensureDir(installPath);
  } catch (e) {
    printErrorLog(e);
  }
}
