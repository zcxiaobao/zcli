import { homedir } from "node:os";
import path from "node:path";
import fsExtra from "fs-extra";
import { log, makeConfirm } from "@zcxiaobao/utils";
import createTeplate from "./createTemplate.js";

const TEMP_HOME = ".zcli";
export default async function perpare(options) {
  let fileList = fsExtra.readdirSync(process.cwd());
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
  if (options.force) {
    const confirmForceInit = makeConfirm({
      message: "是否确认清空当前目录下的文件？",
    });
    if (confirmForceInit) {
      fsExtra.emptyDirSync(options.installPath);
    }
  }
  const targetPath = makeTargetPath();
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
