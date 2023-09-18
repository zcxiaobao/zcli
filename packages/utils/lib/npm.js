import axios from "axios";
import urlJoin from "url-join";
import log from "./log.js";
import { execa } from "execa";

function getNpmLatestInfo(npmName) {
  const registry = "https://registry.npmjs.org/";
  const npmUrl = urlJoin(registry, npmName);

  return axios.get(npmUrl).then((response) => {
    try {
      return response.data;
    } catch (error) {
      return Promise.reject(error);
    }
  });
}
export function getLatestVersion(npmName) {
  return getNpmLatestInfo(npmName).then((data) => {
    if (!data["dist-tags"] || !data["dist-tags"].latest) {
      log.error("没有 latest 版本号");
      return Promise.reject(new Error("没有 latest 版本号"));
    } else {
      return data["dist-tags"].latest;
    }
  });
}

export function installDependencies(projectPath, packageManager = "npm") {
  return new Promise(async (resolve, reject) => {
    try {
      await execa(
        packageManager,
        ["install", "--registry=https://registry.npm.taobao.org"],
        {
          cwd: projectPath,
          stdio: "inherit",
        }
      );
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

export function runProject(packageManager, command, projectPath) {
  return new Promise(async (resolve, reject) => {
    try {
      await execa(packageManager, command, {
        cwd: projectPath,
        stdio: "inherit",
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}
