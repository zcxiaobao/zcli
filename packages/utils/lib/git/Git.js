import path from "node:path";

import { pathExistsSync } from "path-exists";
import fsExtra from "fs-extra";
import ora from "ora";
import { execa } from "execa";
import SimpleGit from "simple-git";
import { makeList, makePassword, makeConfirm, makeInput } from "../inquirer.js";
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
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.git = SimpleGit(projectPath);
  }
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
    // 获取本地项目信息
    this.projectInfo = await this.checkProjectInfo(this.projectPath);
    log.verbose("成功获取本地项目信息", this.projectInfo);
    if (!this.projectInfo) {
      log.warn("请手动创建项目");
      return;
    }
    // 检查远程仓库
    await this.checkRemoteRepo();
    // 检查是否存在 gitignore
    await this.checkGitIgnore();

    // 链接远程仓库
    await this.linkRemoteRepo();
    // 创建 dev 分支，同时创建一个默认 dev 分支
    //
    // commit 提交
    await this.commit();
  }
  async commit() {
    await this.checkCurrentBranch();
    // 1. 检查是否有冲突
    await this.checkConficted();
    // 2. 检查是否有 stash
    await this.checkStash();
    // 3. 检查是否有未提交部分
    await this.checkNotCommited();
    // 4. 拉取远程 dev 和当前分支代码
    await this.pullRemoteDevAndBranch();
    // 5. 推到远程对应分支
    await this.pushRemoteRepo(this.branch);
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
  async checkProjectInfo() {
    const pkgPath = path.resolve(this.projectPath, "package.json");
    const pkg = readFile(pkgPath, { toJSON: true });
    console.log(pkg);
    if (!pkg) {
      log.warn("当前文件夹中不存在package.json");
      const isInit = await makeConfirm({
        message: "是否进行项目初始化(npm init)",
      });
      if (isInit) {
        await execa("npm", ["init", "-y"], { stdout: "inherit" });
        const { name, version } = readFile(pkgPath, { toJSON: true });
        return { name, version, pkgPath };
      } else {
        return false;
      }
    } else {
      const { name, version } = pkg;
      return { name, version, pkgPath };
    }
  }
  async checkRemoteRepo() {
    let remoteRepo = await this.gitServer.getRepo(
      this.gitLogin,
      this.projectInfo.name
    );
    if (!remoteRepo) {
      const spinner = ora("开始创建远程仓库...").start();
      try {
        if (this.gitOwn === REPO_OWNER.USER) {
          remoteRepo = await this.gitServer.createRepo({
            name: this.projectInfo.name,
          });
        } else {
          remoteRepo = await this.gitServer.createOrgRepo(this.gitLogin, {
            name: this.projectInfo.name,
          });
        }
      } catch (e) {
        printErrorLog(e);
      } finally {
        spinner.stop();
      }
      if (remoteRepo) {
        log.success(`创建远程仓库${this.projectInfo.name}成功`);
      } else {
        throw new Error("远程仓库创建失败");
      }
    }
    this.remoteRepo = remoteRepo;
    this.remoteRepoUrl = remoteRepo.ssh_url;
  }
  async checkGitIgnore() {
    const ignorePath = path.resolve(this.projectPath, ".gitignore");
    const ignore = readFile(ignorePath);
    if (!ignore) {
      writeFile(
        ignorePath,
        `.DS_Store
        node_modules
        
        
        # local env files
        .env.local
        .env.*.local
        
        # Log files
        npm-debug.log*
        yarn-debug.log*
        yarn-error.log*
        pnpm-debug.log*
        
        # Editor directories and files
        .idea
        .vscode
        *.suo
        *.ntvs*
        *.njsproj
        *.sln
        *.sw?`
      );
    }
    log.success("自动写入 .gitignore 文件");
  }

  async linkRemoteRepo() {
    const gitPath = path.resolve(this.projectPath, ".git");
    if (!pathExistsSync(gitPath)) {
      log.info("执行git初始化");
      await this.git.init(this.projectPath);
      log.info("git初始化完成");
      const remotes = await this.git.getRemotes();
      if (!remotes.find((r) => r.name === "origin")) {
        await this.git.addRemote("origin", this.remoteRepoUrl);
      }
      // 检查本地未提交代码
      await this.checkNotCommited();

      const branches = await this.git.listRemote(["--heads"]);
      log.verbose("branches", branches);
      if (branches?.includes("refs/heads/master")) {
        log.info("远程存在 master 分支，强制合并");
        await this.pullRemoteRepo("master", {
          "--allow-unrelated-histories": null,
        });
      } else {
        await this.pushRemoteRepo("master");
      }

      if (!branches || !branches.includes("refs/heads/dev")) {
        await this.git.checkout(["-b", "dev"]);
        await this.pushRemoteRepo("dev");
      }
    }
  }
  async checkCurrentBranch() {
    const status = await this.git.status();
    this.branch = status.current;
    const isCommit = await makeConfirm({
      message: `当前分支为 ${this.branch}，是否继续执行 commit 指令？`,
    });
    if (!isCommit) {
      throw new Error("当前工作分支错误，请手动切换分支");
    }
  }
  async checkConficted() {
    log.info("代码冲突检查");
    const { conflicted } = await this.git.status();
    if (conflicted.length > 0) {
      throw new Error("当前代码存在冲突，请手动合并后再试！");
    }
    log.success("代码冲突检查通过");
  }
  async checkStash() {
    log.info("检查 stash 记录");
    let stashList = await this.git.stashList();

    if (stashList.all.length > 0) {
      const stashPop = await makeConfirm({
        message: "stash 中存有部分代码，是否pop？",
      });
      if (stashPop) {
        await this.git.stash(["pop"]);
        log.success("stash pop 成功");
      }
    }
  }
  async checkNotCommited() {
    const status = await this.git.status();
    const { not_added, created, deleted, modified, renamed } = status;
    if (
      not_added.length > 0 ||
      created.length > 0 ||
      deleted.length > 0 ||
      modified.length > 0 ||
      renamed.length > 0
    ) {
      log.verbose("status", status);
      await this.git.add(not_added);
      await this.git.add(created);
      await this.git.add(deleted);
      await this.git.add(modified);
      await this.git.add(renamed.map((_) => i.to));
      const message = await makeInput({
        message: "请输入 commit 信息",
        validate(val) {
          return val.length > 0;
        },
      });
      await this.git.commit(message);
      log.success("本地 commit 提交成功");
    } else {
      log.info("本地代码没有改变，无需 commit");
      process.exit(0);
    }
  }
  async pullRemoteDevAndBranch() {
    log.info(`合并[origin dev] -> [${this.branch}]`);
    await this.pullRemoteRepo("dev");
    log.success("合并远程 [dev] 分支成功");

    log.info(`检查远程 [${this.branch}] 分支`);
    const remoteList = await this.git.listRemote(["--heads"]);
    if (remoteList.includes(this.branch)) {
      await this.pullRemoteRepo(this.branch);
      log.success(`合并远程 [${this.branch}] 分支`);
    } else {
      log.warn(`不存在远程 [${this.branch}] 分支`);
    }
  }
  async pushRemoteRepo(branchName) {
    const spinner = ora(`推送代码到远程 ${branchName} 分支`).start();
    try {
      await this.git.push("origin", branchName);
      log.success(`推送代码成功`);
    } catch (e) {
      printErrorLog(e);
    } finally {
      spinner.stop();
    }
  }

  async pullRemoteRepo(branchName, options) {
    const spinner = ora(`同步远程 ${branchName} 分支代码...`).start();
    try {
      await this.git.pull("origin", branchName, options);
      log.success("同步远程分支代码成功");
    } catch (e) {
      log.error("git pull origin " + branchName);
      printErrorLog(e);
      if (e.message.indexOf("Couldn't find remote ref master") >= 0) {
        log.warn("获取远程[master]分支失败");
      }
      process.exit(0);
    } finally {
      spinner.stop();
    }
  }
}

export default Git;
