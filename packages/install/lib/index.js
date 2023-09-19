import ora from "ora";
import Command from "@zcxiaobao/command";

import {
  log,
  Github,
  makeInput,
  makeList,
  printErrorLog,
} from "@zcxiaobao/utils";

const NEXT_PAGE = "${zcli_next_page}";
const PREV_PAGE = "${zcli_prev_page}";
const REPOSITORIES = "repositories";
const CODE = "code";
class InstallCommand extends Command {
  get command() {
    return "install";
  }

  get description() {
    return "install repository";
  }

  get options() {
    return [];
  }

  async action() {
    log.info("install指令启动");
    // 获取 git api
    this.gitAPI = await this.getGitAPI();
    // 搜索功能：获取仓库还是源码
    await this.searchGitAPI();
    // 搜索对应仓库的 tag
    await this.selectTags();
    // 下载对应库
    await this.downloadRepo();
    // 安装依赖
    await this.installDependencies();
    // 自动启动项目
    await this.runRepo();
  }
  async searchGitAPI() {
    const SEARCH_TYPE = [
      { name: "仓库", value: REPOSITORIES },
      { name: "源码", value: CODE },
    ];
    this.mode = await makeList({
      message: "请选择搜索模式",
      choices: SEARCH_TYPE,
    });
    this.q = await makeInput({
      message: "请输入搜索关键词",
      validate(value) {
        if (value.length > 0) {
          return true;
        } else {
          return "请输入搜索关键词";
        }
      },
    });

    this.language = await makeInput({
      message: "请输入开发语言",
    });

    this.per_page = 10;
    this.page = 1;

    await this.doSearch();
  }
  async selectTags() {
    this.tagPage = 1;
    await this.doSelectTag();
  }
  async getGitAPI() {
    const gitAPI = new Github();
    await gitAPI.init();
    return gitAPI;
  }

  async doSearch() {
    let searchRes,
      list = [],
      count = 0;
    const params = {
      // q: "jqery+in:file+language:js",
      q: this.q + (this.language ? `+language:${this.language}` : ""),
      per_page: this.per_page,
      page: this.page,
    };
    const spinner = ora("正在搜索中...").start();
    if (this.mode === REPOSITORIES) {
      try {
        searchRes = await this.gitAPI.searchRepositories(params);
        spinner.stop();
      } catch (error) {
        spinner.stop();
      }
      searchRes.items.forEach((i) => {
        list.push({
          name: `${i.full_name}(${i.description})`,
          value: i.full_name,
        });
      });
    } else {
      try {
        searchRes = await this.gitAPI.searchCode(params);
        spinner.stop();
      } catch (error) {
        spinner.stop();
      }
      searchRes.items.forEach((i) => {
        list.push({
          name: `${i.repository.full_name}(${i.repository.description})`,
          value: i.repository.full_name,
        });
      });
    }
    count = searchRes.total_count;
    if (this.per_page * this.page < count) {
      list.push({
        name: "下一页",
        value: NEXT_PAGE,
      });
    }
    if (this.page > 1) {
      list.unshift({
        name: "上一页",
        value: PREV_PAGE,
      });
    }
    if (count > 0) {
      const keyword = await makeList({
        message: `请选择你要下载的项目（共条${count}数据）`,
        choices: list,
      });
      if (keyword === NEXT_PAGE) {
        await this.nextPage();
      } else if (keyword === PREV_PAGE) {
        await this.prevPage();
      } else {
        this.keyword = keyword;
      }
    } else {
      log.info("未能查询到满足要求的仓库！！！");
      process.exit(0);
    }
  }
  async doSelectTag() {
    let tagList;
    const params = {
      page: this.tagPage,
    };
    const spinner = ora("正在加载tag...").start();
    try {
      tagList = await this.gitAPI.getTags(this.keyword, params);
      spinner.stop();
    } catch (e) {
      log.error(e);
      spinner.stop();
    }
    let tagListChoices = tagList.map((tag) => ({
      name: tag.name,
      value: tag.name,
    }));
    if (tagList.length > 0) {
      tagListChoices.push({
        name: "下一页",
        value: NEXT_PAGE,
      });
    }
    if (this.tagPage > 1) {
      tagListChoices.unshift({
        name: "上一页",
        value: PREV_PAGE,
      });
    }
    if (tagListChoices.length > 0) {
      const tag = await makeList({
        message: "请选择要下载的tag",
        choices: tagListChoices,
      });
      if (tag === NEXT_PAGE) {
        await this.nextTag();
      } else if (tag === PREV_PAGE) {
        await this.prevTag();
      } else {
        this.tag = tag;
        log.verbose("tag", this.tag);
      }
    } else {
      log.info("该项目并没有tag");
    }
  }
  async nextPage() {
    this.page++;
    return this.doSearch();
  }
  async prevPage() {
    this.page--;
    return this.doSearch();
  }

  async nextTag() {
    this.tagPage++;
    return this.doSelectTag();
  }
  async prevTag() {
    this.tagPage--;
    return this.doSelectTag();
  }

  async downloadRepo() {
    const spinner = ora(`正在下载：${this.keyword}(${this.tag})`).start();
    try {
      await this.gitAPI.cloneRepo(this.keyword, this.tag);
      spinner.stop();
    } catch (e) {
      spinner.stop();
      printErrorLog(e);
    }
  }

  async installDependencies() {
    const cwd = process.cwd();
    try {
      const ret = await this.gitAPI.installDependencies(cwd, this.keyword);
      if (!ret) {
        log.error(`依赖安装失败: ${this.keyword}(${this.selectedTag})`);
      } else {
        log.success(`依赖安装成功: ${this.keyword}(${this.selectedTag})`);
      }
    } catch (e) {
      printErrorLog(e);
    }
  }

  async runRepo() {
    await this.gitAPI.runRepo(process.cwd(), this.keyword);
  }
}

function Install(instance) {
  return new InstallCommand(instance);
}

export default Install;
