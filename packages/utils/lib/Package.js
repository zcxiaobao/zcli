import { homedir } from "node:os";
import path from "node:path";
import { pathExistsSync } from "path-exists";
import fsExtra from "fs-extra";
import {
  DEFAULT_CLI_HOME,
  GIT_SERVER,
  CLI_TOKEN,
  GIT_OWNER,
  STORE_FILES,
} from "./constType.js";
import printErrorLog from "./printErrorLog.js";

//
export function getGitStroePath() {
  const store = {};
  for (let [file, filePath] of Object.entries(STORE_FILES)) {
    const fileName = file.match(/_([A-Z]+)_/)[1].toLowerCase();
    store[fileName] = path.resolve(getDefalutCliPath(), filePath);
  }
  return store;
}

export function getGitOwnerPath() {
  return path.resolve(getDefalutCliPath(), GIT_OWNER);
}

// 获取 git 平台缓存文件目录
export function getGitServerPath() {
  return path.resolve(getDefalutCliPath(), GIT_SERVER);
}
// 获取 token 缓存目录
export function getGitTokenPath() {
  return path.resolve(getDefalutCliPath(), CLI_TOKEN);
}
// 获取缓存目录
export function getDefalutCliPath() {
  return path.resolve(`${homedir()}/${DEFAULT_CLI_HOME}`);
}
// 获取缓存模板目录
export function getDefalutCliTemPath() {
  return path.resolve(`${homedir()}/${DEFAULT_CLI_HOME}`, "template");
}
// 获取模板的缓存路径
export function getTargetTemplatePath(npmName) {
  return path.resolve(getDefalutCliTemPath(), "node_modules", npmName);
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
