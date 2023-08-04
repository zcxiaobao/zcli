import path from "node:path";

import { pathExistsSync } from "path-exists";
import fsExtra from "fs-extra";
import semver from "semver";
import ora from "ora";
import { execa } from "execa";
import SimpleGit from "simple-git";
import {
  makeList,
  makePassword,
  makeConfirm,
  makeInput,
  makeCheckbox,
} from "../inquirer.js";
import { writeFile, readFile, createFile } from "../file.js";
import log from "../log.js";
import { getDefalutCliPath, getGitStroePath } from "../Package.js";
import Github from "./Github.js";
import printErrorLog from "../printErrorLog.js";
import sleep from "../sleep.js";
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
  constructor(projectPath, options) {
    this.projectPath = projectPath;
    this.options = options;
    this.pkgPath = path.resolve(this.projectPath, "package.json");
    this.branchRule = {};
    this.git = SimpleGit(projectPath);
  }
  async init() {
    // 初始化缓存目录
    this.checkCliHomePath();
    // 初始化配置的缓存文件
    await this.initGitDefault();
  }
  async prepare() {
    // 确定 git 托管平台信息
    await this.checkGitServer();
    // git 所需 token 信息
    await this.checkGitToken();
    // 确定当前操作对象
    await this.checkGitOwn();
    // 确定各分支命名规则
    await this.checkGitBranchRule();
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
  async publish() {
    await this.checkoutBranch(this.branchRule.dev);
    await this.mergeBranchToDev();
    if (this.options.release) {
      await this.generatorTag();
      await this.iteratorVersion();
      await this.mergeBranch(this.branchRule.dev, this.branchRule.master);
      await this.pullRemoteRepo(this.branchRule.master);
      await this.pushRemoteRepo(this.branchRule.master);
    }
    await this.pullRemoteRepo(this.branchRule.dev);
    await this.pushRemoteRepo(this.branchRule.dev);
    await this.deleteLocalBranch();
    await this.deleteRemoteBranch();
  }
  checkCliHomePath() {
    this.homeCliPath = getDefalutCliPath();
    if (pathExistsSync(this.homeCliPath)) {
      fsExtra.ensureDirSync(this.homeCliPath);
    }
  }
  async initGitDefault() {
    const spinner = ora("检查 git 缓存目录...").start();
    this.store = getGitStroePath();
    for (let filePath of Object.values(this.store)) {
      createFile(filePath);
    }
    spinner.stop();
    await sleep(0);
    log.success("git 缓存目录检查完成");
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
    log.success("当前托管平台: ", gitServer);
    this.gitServer = createGitServer(gitServer);
  }
  //   async checkGitUserAndOrgs() {
  //     const spinner = ora("获取用户和组织信息中...").start();
  //     try {
  //       this.user = await this.gitServer.getUser();
  //       this.orgs = await this.gitServer.getOrgs();
  //     } catch (e) {
  //       printErrorLog(e);
  //     } finally {
  //       spinner.stop();
  //       log.verbose("用户和组织信息获取成功");
  //     }
  //   }
  async checkGitOwn() {
    const gitOwnPath = this.store.owner;
    const gitLoginPath = this.store.login;
    let gitOwn = readFile(gitOwnPath);
    let gitLogin = readFile(gitLoginPath);
    if (!gitLogin || !gitOwn) {
      const spinner = ora("获取用户和组织信息中...").start();
      try {
        this.user = await this.gitServer.getUser();
        this.orgs = await this.gitServer.getOrgs();
      } catch (e) {
        printErrorLog(e);
      } finally {
        spinner.stop();
      }
      if (!gitOwn) {
        gitOwn = await makeList({
          message: "请选择远程仓库类型",
          choices: this.orgs.length > 0 ? GIT_OWNER_TYPE : GIT_OWNER_TYPE_ONLY,
        });
      }

      if (gitOwn === REPO_OWNER.USER) {
        gitLogin = this.user?.login;
      } else {
        gitLogin = await makeList({
          message: "请选择组织",
          choices: this.orgs.map((i) => ({
            name: i.login || i.name,
            value: i.login,
          })),
        });
      }
      writeFile(gitOwnPath, gitOwn);
      writeFile(gitLoginPath, gitLogin);
    }
    this.gitLogin = gitLogin;
    this.gitOwn = gitOwn;
    log.success("成功获取 owner 和 login 信息", gitOwn, gitLogin);
  }
  async checkGitBranchRule() {
    const gitBranchRulePath = this.store.branch;
    let branchRule = readFile(gitBranchRulePath, { toJSON: true });
    if (branchRule) {
      branchRule = JSON.parse(branchRule);
      console.log(typeof branchRule);
      this.branchRule.master = branchRule.master;
      this.branchRule.dev = branchRule.dev;
      this.branchRule.feature = branchRule.feature;
    } else {
      this.branchRule.master = await makeInput({
        message: "请输入主分支名称",
        validata(val) {
          return val > 0;
        },
        defaultValue: "master",
      });
      this.branchRule.dev = await makeInput({
        message: "请输入开发主分支名称",
        validata(val) {
          return val > 0;
        },
        defaultValue: "dev",
      });
      this.branchRule.feature = await makeInput({
        message: "请输入开发分支前缀名",
        validata(val) {
          return val > 0;
        },
        defaultValue: "feature",
      });
      fsExtra.writeJSONSync(gitBranchRulePath, JSON.stringify(this.branchRule));
    }
    log.success(
      `\n当前 git 中，\n主分支: ${this.branchRule.master}\n开发分支: ${this.branchRule.dev} \n子开发分支: ${this.branchRule.feature}`
    );
  }
  async checkProjectInfo() {
    const pkgPath = path.resolve(this.projectPath, "package.json");
    const pkg = readFile(pkgPath, { toJSON: true });
    if (!pkg) {
      log.warn("当前文件夹中不存在 package.json ");
      const isInit = await makeConfirm({
        message: "是否进行项目初始化(npm init -y)",
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
      await sleep(0);
      if (remoteRepo) {
        log.success(`创建远程仓库 ${this.projectInfo.name} 成功`);
      } else {
        throw new Error("远程仓库创建失败");
      }
    }
    this.remoteRepo = remoteRepo;
    this.remoteRepoUrl = remoteRepo.ssh_url || remoteRepo.http_url;
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
      log.success("自动写入 .gitignore 文件");
    }
  }

  async linkRemoteRepo() {
    const gitPath = path.resolve(this.projectPath, ".git");
    if (!pathExistsSync(gitPath)) {
      log.verbose("执行 git 初始化");
      await this.git.init(this.projectPath);
      log.success("git 初始化完成");
      const remotes = await this.git.getRemotes();
      if (!remotes.find((r) => r.name === "origin")) {
        await this.git.addRemote("origin", this.remoteRepoUrl);
      }
      // 检查本地未提交代码
      await this.checkNotCommited();

      const branches = await this.git.listRemote(["--heads"]);
      log.verbose("branches", branches);
      if (branches?.includes(`refs/heads/${this.branchRule.master}`)) {
        log.info(`远程存在 ${this.branchRule.master}  分支，强制合并`);
        await this.pullRemoteRepo(this.branchRule.master, {
          "--allow-unrelated-histories": null,
        });
      } else {
        if (this.branchRule.master !== "master")
          await this.git.checkout(["-b", this.branchRule.master]);
        await this.pushRemoteRepo(this.branchRule.master);
      }

      if (
        !branches ||
        !branches.includes(`refs/heads/${this.branchRule.dev}`)
      ) {
        await this.git.checkout(["-b", this.branchRule.dev]);
        await this.pushRemoteRepo(this.branchRule.dev);
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
      throw new Error("当前工作分支错误，请手动切换分支再试!");
    }
  }
  async checkConficted() {
    const spinner = ora("代码冲突检查...").start();
    const { conflicted } = await this.git.status();
    if (conflicted.length > 0) {
      throw new Error("当前代码存在冲突，请手动合并后再试！");
    }
    spinner.stop();
    await sleep(0);
    log.success("代码冲突检查通过");
  }
  async checkStash() {
    const spinner = ora("检查 stash 记录...").start();
    // log.info("检查 stash 记录");
    let stashList = await this.git.stashList();

    if (stashList.all.length > 0) {
      const stashPop = await makeConfirm({
        message: "stash 中存有部分代码，是否pop？",
      });
      if (stashPop) {
        await this.git.stash(["pop"]);
        spinner.stop();
        await sleep(0);
        log.success("stash pop 成功");
      }
    } else {
      spinner.stop();
      await sleep(0);
    }
  }
  async checkNotCommited(message, loginfo = "本地 commit 提交成功") {
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
      if (!message) {
        message = await makeInput({
          message: "请输入 commit 信息",
          validate(val) {
            return val.length > 0;
          },
        });
      }
      await this.git.commit(message);
      log.verbose(loginfo);
    } else {
      log.info("本地代码没有改变，无需 commit");
      process.exit(0);
    }
  }
  async pullRemoteDevAndBranch() {
    await this.pullRemoteRepo(this.branchRule.dev);
    const spinner = ora(`检查远程 [${this.branch}] 分支是否存在`).start();
    // log.info(`检查远程 [${this.branch}] 分支`);
    const remoteList = await this.git.listRemote(["--heads"]);
    if (remoteList.includes(this.branch)) {
      await this.pullRemoteRepo(this.branch);
      spinner.stop();
      await sleep(0);
      log.success(`远程 [${this.branch}] 分支存在，pull 其代码`);
    } else {
      spinner.stop();
      await sleep(0);
      log.warn(`远程不存在 [${this.branch}] 分支，已创建`);
    }
  }
  async pushRemoteRepo(branchName) {
    const spinner = ora(`推送代码到远程 [${branchName}] 分支`).start();
    try {
      await this.git.push("origin", branchName);
      spinner.stop();
      await sleep(0);
      log.success(`推送代码到远程 [${branchName}] 分支成功`);
    } catch (e) {
      printErrorLog(e);
      spinner.stop();
    }
  }

  async pullRemoteRepo(branchName, options) {
    const spinner = ora(`同步远程 [${branchName}] 分支代码...`).start();
    try {
      await this.git.pull("origin", branchName, options);
      spinner.stop();
      await sleep(0);
      log.success(`同步远程分支 [${branchName}] 代码成功`);
      spinner.stop();
    } catch (e) {
      log.error("git pull origin " + branchName);
      printErrorLog(e);
      if (e.message.indexOf("Couldn't find remote ref master") >= 0) {
        log.warn("获取远程[master]分支失败");
      }
      process.exit(0);
    }
  }

  /**
   * publish 部分
   */
  async checkoutBranch(branchName) {
    const localBranchList = await this.git.branchLocal();
    if (localBranchList?.all?.includes(branchName)) {
      await this.git.checkout(branchName);
    } else {
      await this.git.checkoutLocalBranch(branchName);
    }
    log.verbose(`本地分支切换到 [${branchName}] 分支`);
  }
  async getRemoteBranchList(type) {
    const remotes = await this.git.listRemote(["--refs"]);
    let reg;
    if (type === "tag") {
      reg = /.+?refs\/tags\/([\w\.]+)/g;
    } else {
      reg = new RegExp(
        `.+?refs\/heads\/(${this.branchRule.feature}\/\\S+)`,
        "g"
      );
    }
    return remotes
      .split("\n")
      .map((b) => {
        const match = reg.exec(b);
        reg.lastIndex = 0;
        if (match) {
          return match[1];
        }
      })
      .filter((_) => _);
  }
  async mergeBranchToDev() {
    let spinner = ora("获取所有分支...").start();
    const mergeBranchList = await this.getRemoteBranchList("head");
    spinner.stop();
    if (!mergeBranchList || mergeBranchList.length === 0) {
      log.warn("没有开发分支等待合并!!!");
      process.exit(0);
    }
    const needMerged = await makeCheckbox({
      message: "请选择要合并的分支",
      choices: mergeBranchList.map((_) => ({ name: _, value: _ })),
    });

    spinner = ora("开始合并代码").start();
    if (needMerged?.length > 0) {
      this.needMerged = needMerged;
      for (let branch of needMerged) {
        spinner.text = `开始合并代码 [${branch}] -> [${this.branchRule.dev}]`;
        await this.git.mergeFromTo(branch, this.branchRule.dev);
      }
    }
    spinner.stop();
    await sleep(0);
    log.success("代码合并完成");
  }
  async generatorTag() {
    let spinner = ora("检查远程仓库 tag ...").start();
    const reomoteTagList = await this.getRemoteBranchList("tag");
    const tag = this.projectInfo.version;
    if (reomoteTagList?.includes(tag)) {
      log.verbose(`远程 tag 已存在`, tag);
      await this.git.push(["origin", `:refs/tags/${tag}`]);
      log.verbose(`远程 tag 已删除`, tag);
    }
    spinner.stop();
    await sleep(0);
    spinner = ora("检查本地仓库 tag ...").start();
    const localTagList = await this.git.tags();
    if (localTagList?.all?.includes(tag)) {
      log.verbose(`本地 tag 已存在`, tag);
      await this.git.tag(["-d", tag]);
      log.verbose(`本地 tag 已删除`, tag);
    }
    spinner.stop();

    await sleep(0);

    spinner = ora("创建 tag，并推到远程仓库...");
    await this.git.addTag(tag);
    log.verbose(`本地 tag 创建成功`, tag);
    await this.git.pushTags("origin");
    log.verbose(`远程 tag 推送成功`, tag);
    spinner.stop();
    await sleep(0);
    log.success("tag 创建成功", tag);
  }

  async iteratorVersion() {
    const devVersion = this.projectInfo.version;
    const incType = await makeList({
      message: "下一轮版本迭代为？",
      choices: [
        {
          name: `小版本 (${devVersion} -> ${semver.inc(devVersion, "patch")})`,
          value: "patch",
        },
        {
          name: `中版本 (${devVersion} -> ${semver.inc(devVersion, "minor")})`,
          value: "minor",
        },
        {
          name: `大版本 (${devVersion} -> ${semver.inc(devVersion, "major")})`,
          value: "major",
        },
      ],
    });
    const incVersion = semver.inc(devVersion, incType);
    await this.iteratorLocalPackageVersion(incVersion);
    await this.iteratorRemotePackageVersion(incVersion);
  }
  async iteratorLocalPackageVersion(incVersion) {
    const pkgPath = path.resolve(this.projectPath, "package.json");
    const pkg = readFile(pkgPath, { toJSON: true });
    if (pkg?.version !== incVersion) {
      pkg.version = incVersion;
      fsExtra.writeJsonSync(pkgPath, pkg, { spaces: 2 });
    }
  }
  async iteratorRemotePackageVersion(incVersion) {
    // const nowBranch = await this.git.status().current;
    // if (nowBranch !== this.branchRule.master) {
    //   await this.checkoutBranch(this.branchRule.master);
    // }
    await this.checkNotCommited(incVersion, `版本迭代至${incVersion}`);
  }
  async mergeBranch(from, to) {
    await this.checkoutBranch(to);
    await this.git.mergeFromTo(from, to);
  }
  async deleteLocalBranch() {
    log.info("开始删除本地分支");
    if (this.needMerged?.length > 0) {
      for (let branch of this.needMerged) {
        await this.git.deleteLocalBranch(branch);
      }
    }
    log.success("删除本地分支开发成功: ", this.needMerged?.join(" || "));
  }

  async deleteRemoteBranch() {
    log.info("开始删除远程分支");
    if (this.needMerged?.length > 0) {
      for (let branch of this.needMerged) {
        await this.git.push(["origin", "--delete", branch]);
      }
    }
    log.success("删除远程分支成功: ", this.needMerged?.join(" || "));
  }
}

export default Git;
