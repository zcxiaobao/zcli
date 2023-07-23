import ora from "ora";
import Command from "@zcxiaobao/command";
import { log, Github, makeInput, makeList } from "@zcxiaobao/utils";

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
    // 输入关键词
    // 输入语言
    // 输出结果
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
      // q: "addClass+in:file+language:js",
      q: this.q + (this.language ? `+language:${this.language}` : ""),
      per_page: this.per_page,
      page: this.page,
    };
    if (this.mode === REPOSITORIES) {
      searchRes = await this.gitAPI.searchRepositories(params);
      list = searchRes.items.map((item) => ({
        name: `${item.full_name}(${item.description})`,
        value: item.full_name,
      }));
    } else {
      searchRes = await this.gitAPI.searchCode(params);
      console.log(searchRes);
      list = searchRes.items.map((item) => ({
        name:
          item.repository.full_name +
          (item.repository.description
            ? `(${item.repository.description})`
            : ""),
        value: item.repository.full_name,
      }));
    }
    // const spinner = ora("正在搜索中...").start();
    // if (this.mode === REPOSITORIES) {
    //   try {
    //     searchRes = await this.gitAPI.searchRepositories(params);
    //     spinner.stop();
    //   } catch (error) {
    //     spinner.stop();
    //   }
    //   searchRes.items.forEach((i) => {
    //     list.push({
    //       name: `${i.full_name}(${i.description})`,
    //       value: i.full_name,
    //     });
    //   });
    // } else {
    //   try {
    //     searchRes = await this.gitAPI.searchCode(params);
    //     spinner.stop();
    //   } catch (error) {
    //     spinner.stop();
    //   }
    //   searchRes.items.forEach((i) => {
    //     list.push({
    //       name: `${i.repository.full_name}(${i.repository.description})`,
    //       value: i.repository.full_name,
    //     });
    //   });
    // }

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
}

function Install(instance) {
  return new InstallCommand(instance);
}

export default Install;
