import path from "node:path";
import { homedir } from "node:os";
import { execa } from "execa";
import { pathExistsSync } from "path-exists";
import fsExtra from "fs-extra";
import fs from "node:fs";
import { makePassword } from "../inquirer.js";
import log from "../log.js";
import { getDefalutCliPath } from "../Package.js";

const DEFAULT_CLI_HOME = ".zcli";
const TEMP_TOKEN = ".token";
function createTokenPath() {
  return path.resolve(homedir(), DEFAULT_CLI_HOME, TEMP_TOKEN);
}

function getToken() {
  return makePassword({
    message: "请输入token信息",
  });
}
class GitCommon {
  constructor() {}
  async prepare() {
    this.checkCliHomePath();
    await this.checkGitToken();
    await this.checkGitUserAndOrgs();
  }
  checkCliHomePath() {
    this.homeCliPath = getDefalutCliPath();
    if (pathExistsSync(this.homeCliPath)) {
      fsExtra.ensureDirSync(this.homeCliPath);
    }
  }
  async checkGitToken() {
    const tokenPath = createTokenPath();
    if (pathExistsSync(tokenPath)) {
      this.token = fsExtra.readFileSync(tokenPath).toString();
    } else {
      this.token = await getToken();
      fs.writeFileSync(tokenPath, this.token);
    }
    log.verbose("token", this.token);
  }
  async init() {
    const tokenPath = createTokenPath();
    if (pathExistsSync(tokenPath)) {
      this.token = fsExtra.readFileSync(tokenPath).toString();
    } else {
      this.token = await getToken();
      fs.writeFileSync(tokenPath, this.token);
    }
    log.verbose("token", this.token);
  }
  setToken(token) {
    this.token = token;
  }
  cloneRepo(fullName, tag) {
    console.log(tag);
    if (tag) {
      return execa("git", ["clone", this.getRepoUrl(fullName), "-b", tag], {
        stdout: "inherit",
      });
    } else {
      return execa("git", ["clone", this.getRepoUrl(fullName)], {
        stdout: "inherit",
      });
    }
  }
  async runRepo(cwd, fullName) {
    const projectPath = getProjectPath(cwd, fullName);
    const pkg = getPackageJson(cwd, fullName);
    if (pkg) {
      const { scripts, bin, name } = pkg;
      // 自动安装 bin 到全局
      if (bin) {
        await execa(
          "npm",
          ["install", "-g", name, "--registry=https://registry.npmmirror.com"],
          { cwd: projectPath, stdout: "inherit" }
        );
      }
      console.log(scripts);
      if (scripts && scripts.dev) {
        return execa("npm", ["run", "dev"], {
          cwd: projectPath,
          stdout: "inherit",
        });
      } else if (scripts && scripts.start) {
        return execa("npm", ["run", "start"], {
          cwd: projectPath,
          stdout: "inherit",
        });
      } else if (scripts && scripts.serve) {
        return execa("npm", ["run", "serve"], {
          cwd: projectPath,
          stdout: "inherit",
        });
      } else {
        log.warn("没有找到启动命令");
      }
    }
  }
  installDependencies(cwd, fullName) {
    const projectPath = getProjectPath(cwd, fullName);
    if (pathExistsSync(projectPath)) {
      return execa("npm", ["install"], {
        cwd: projectPath,
        stdout: "inherit",
      });
    }
    return null;
  }
}
function getPackageJson(cwd, fullName) {
  const projectPath = getProjectPath(cwd, fullName);
  const pkgPath = path.resolve(projectPath, "package.json");
  if (pathExistsSync(pkgPath)) {
    return fsExtra.readJsonSync(pkgPath);
  }
  return null;
}
function getProjectPath(cwd, fullName) {
  const projectName = fullName.split("/")[1];
  return path.resolve(cwd, projectName);
}
export { GitCommon };
