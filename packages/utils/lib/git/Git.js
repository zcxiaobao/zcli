import { pathExistsSync } from "path-exists";
import fsExtra from "fs-extra";
import ora from "ora";
import { makeList, makePassword } from "../inquirer.js";
import { writeFile, readFile, createFile } from "../file.js";
import log from "../log.js";
import { getDefalutCliPath, getGitStroePath } from "../Package.js";
import Github from "./Github.js";
import printErrorLog from "../printErrorLog.js";
import {
  GIT_OWNER_TYPE,
  REPO_OWNER,
  GIT_OWNER_TYPE_ONLY,
} from "../constType.js";

function getToken() {
  return makePassword({
    message: "请输入token信息",
  });
}
function createGitServer(gitServer) {
  return new Github();
  //   if (gitServer === GITHUB) {
  //     return new Github();
  //   } else if (gitServer === GITEE) {
  //     return new Gitee();
  //   }
  //   return null;
}
class Git {
  constructor() {}
  async prepare() {
    // 初始化缓存目录
    this.checkCliHomePath();
    // 初始化配置的缓存文件
    this.initGitDefault();
    // 确定 git 托管平台信息
    await this.checkGitServer();
    // git 所需 token 信息
    await this.checkGitToken();
    // 获取个人和组织信息
    await this.checkGitUserAndOrgs();
    // 确定当前操作对象
    await this.checkGitOwn();
  }
  checkCliHomePath() {
    this.homeCliPath = getDefalutCliPath();
    if (pathExistsSync(this.homeCliPath)) {
      fsExtra.ensureDirSync(this.homeCliPath);
    }
  }
  initGitDefault() {
    const spinner = ora("初始化git...").stop();
    this.store = getGitStroePath();
    for (let filePath of Object.values(this.store)) {
      createFile(filePath);
    }
    log.success("git 初始化完成");
    spinner.stop();
  }
  async checkGitToken() {
    const tokenPath = this.store.token;
    this.token = readFile(tokenPath);
    if (!this.token) {
      this.token = await getToken();
      writeFile(tokenPath, this.token);
    }
    this.gitServer.setToken(this.token);
    log.verbose("token", this.token);
  }
  async checkGitServer() {
    const gitServerPath = this.store.server;
    let gitServer = readFile(gitServerPath);
    if (!gitServer) {
      gitServer = await makeList({
        message: "请选择你要托管的Git平台",
        choices: [
          {
            name: "github",
            value: "github",
          },
          {
            name: "gitee",
            value: "gitee",
          },
        ],
      });
      writeFile(gitServerPath, gitServer);
      this.gitServer = createGitServer(gitServer);
    }
    // log.success("成功获取gitServer", gitServer);
    this.gitServer = createGitServer(gitServer);
  }
  async checkGitUserAndOrgs() {
    const spinner = ora("获取用户和组织信息中...").start();
    try {
      this.user = await this.gitServer.getUser();
      this.orgs = await this.gitServer.getOrgs();
      console.log(this.user, this.orgs);
    } catch (e) {
      printErrorLog(e);
    } finally {
      spinner.stop();
      log.success("用户和组织信息获取成功");
    }
  }
  async checkGitOwn() {
    const gitOwnPath = this.store.owner;
    const gitLoginPath = this.store.login;
    let gitOwn = readFile(gitOwnPath);
    let gitLogin = readFile(gitLoginPath);
    if (!gitLogin || !gitOwn) {
      gitOwn = await makeList({
        message: "请选择远程仓库类型",
        choices: this.orgs.length > 0 ? GIT_OWNER_TYPE : GIT_OWNER_TYPE_ONLY,
      });
      if (gitOwn === REPO_OWNER.USER) {
        gitLogin = this.user.login;
      } else {
        gitLogin = await makeList({
          message: "请选择",
          choices: this.orgs.map((i) => ({
            name: i.login,
            value: i.login,
          })),
        });
      }
      writeFile(gitOwnPath, gitOwn);
      writeFile(gitLoginPath, gitLogin);
    }
    this.gitLogin = gitLogin;
    this.gitOwn = gitOwn;
    log.success("成功获取owner和login信息", gitOwn, gitLogin);
  }
}

export default Git;
