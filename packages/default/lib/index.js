import Command from "@zcxiaobao-cli/command";
import { makeList, log } from "@zcxiaobao-cli/utils";
const INIT_TEMPLATE = [
  {
    name: "「慕课乐高」标准项目模板",
    npmName: "@imooc-cli/imooc-lego-standard-template",
    version: "1.0.0",
    type: "normal",
    installCommand: "npm install",
    startCommand: "npm run serve",
    ignore: ["**/public/**"],
    tag: ["project"],
    buildPath: "dist",
  },
  {
    name: "Vue2 标准项目模板",
    npmName: "@imooc-cli/vue2-standard-template",
    version: "1.0.0",
    type: "normal",
    startCommand: "npm run serve",
    ignore: ["**/public/**"],
    tag: ["project"],
    buildPath: "dist",
  },
  {
    name: "React 标准项目模板",
    npmName: "@imooc-cli/react-standard-template",
    version: "1.0.0",
    type: "normal",
    startCommand: "npm start",
    tag: ["project"],
    buildPath: "build",
  },
  {
    name: "Vue3 标准项目模板",
    npmName: "@imooc-cli/vue3-standard-template",
    version: "1.0.0",
    type: "normal",
    startCommand: "npm run serve",
    ignore: ["**/public/**"],
    tag: ["project"],
    buildPath: "dist",
  },
  {
    name: "慕课网前端标准项目模板（Vue3.0）",
    npmName: "@imooc-cli/imooc-standard-template",
    version: "1.0.0",
    type: "custom",
    tag: ["project"],
    buildPath: "dist",
  },
  {
    name: "Vue3 标准组件模板",
    npmName: "@imooc-cli/vue3-component",
    version: "1.0.0",
    type: "normal",
    tag: ["component"],
    startCommand: "npm run dev",
    buildPath: "dist",
    examplePath: "examples",
  },
  {
    name: "慕课乐高组件库模板",
    npmName: "imooc-cli-dev-lego-components",
    version: "1.0.0",
    type: "normal",
    tag: ["component"],
    startCommand: "npm run serve",
    buildPath: "dist",
    examplePath: "examples",
    ignore: ["**/public/**", "**.png"],
  },
];
const OPERATOR_TYPE = {
  TEMPLATE: "template",
  CACHE: "cache",
  DEL_CACHE: "del_cache",
};
const OPERATOR_LIST = [
  { name: "获取模板信息", value: OPERATOR_TYPE.TEMPLATE },
  { name: "获取缓存信息", value: OPERATOR_TYPE.CACHE },
  { name: "清空缓存信息", value: OPERATOR_TYPE.DEL_CACHE },
];
class DefaultCommand extends Command {
  get command() {
    return "default [name]";
  }

  get description() {
    return "get zcli default info";
  }

  get options() {
    return [];
  }

  async action() {
    const operator = await makeList({
      message: "请选择要进行的操作",
      choices: OPERATOR_LIST,
    });
    switch (operator) {
      case OPERATOR_TYPE.TEMPLATE:
        await makeList({
          message: "当前项目包含模板如下:",
          choices: INIT_TEMPLATE.map((item) => ({
            name: item.name,
            value: item.value,
          })),
        });
        break;
      case OPERATOR_TYPE.CACHE:
        log.info();
        break;
    }
    // 1. 查看模板信息
    // 2. 查看缓存信息
    // 3. 清空缓存信息
  }
}

function Default(instance) {
  return new DefaultCommand(instance);
}

export default Default;
