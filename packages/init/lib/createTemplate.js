import { makeInput, log, makeList } from "@zcxiaobao-cli/utils";

const INIT_TEMPLATE = [
  // {
  //   name: "「慕课乐高」标准项目模板",
  //   npmName: "@imooc-cli/imooc-lego-standard-template",
  //   version: "1.0.0",
  //   type: "normal",
  //   installCommand: "npm install",
  //   startCommand: "npm run serve",
  //   ignore: ["**/public/**"],
  //   tag: ["project"],
  //   buildPath: "dist",
  // },
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
    name: "vue-admin-template项目模板",
    value: "template-vue-element-admin",
    npmName: "@zcxiaobao-cli/template-vue-element-admin",
    version: "1.0.0",
    forceInstallNew: true,
    tag: ["project"],
    startCommand: "npm run dev",
    ignore: ["**/public/**", "**/assets/**"],
  },
  // {
  //   name: "Vue3 标准组件模板",
  //   npmName: "@imooc-cli/vue3-component",
  //   version: "1.0.0",
  //   type: "normal",
  //   tag: ["component"],
  //   startCommand: "npm run dev",
  //   buildPath: "dist",
  //   examplePath: "examples",
  // },
  // {
  //   name: "慕课乐高组件库模板",
  //   npmName: "imooc-cli-dev-lego-components",
  //   version: "1.0.0",
  //   type: "normal",
  //   tag: ["component"],
  //   startCommand: "npm run serve",
  //   buildPath: "dist",
  //   examplePath: "examples",
  //   ignore: ["**/public/**", "**.png"],
  // },
];

// [
//   {
//     name: "vue3项目模板",
//     value: "template-vue3",
//     npmName: "@zcxiaobao-cli/template-vue3",
//     version: "1.0.0",
//     forceInstallNew: true, // 是否默认下载最新版本
//   },
//   {
//     name: "react18项目模板",
//     value: "template-react18",
//     npmName: "@zcxiaobao-cli/template-react18",
//     version: "1.0.0",
//     forceInstallNew: true,
//   },
//   {
//     name: "vue-admin-template项目模板",
//     value: "template-vue-element-admin",
//     npmName: "@zcxiaobao-cli/template-vue-element-admin",
//     version: "1.0.0",
//     forceInstallNew: true,
//     ignore: ["**/public/**", "**/assets/**"],
//   },
// ];

const INIT_TYPE = {
  COMPONENT: "component",
  PROJECT: "project",
};

const INIT_TYPE_LIST = [
  { name: "项目", value: INIT_TYPE.PROJECT },
  { name: "组件", value: INIT_TYPE.COMPONENT },
];

function getInitType() {
  return makeList({
    choices: INIT_TYPE_LIST,
    defaultValue: INIT_TYPE.PROJECT,
    message: "请选择初始化类型",
  });
}

function getProjectName(initType) {
  return makeInput({
    type: "input",
    message:
      initType === INIT_TYPE.PROJECT ? "请选择项目名称" : "请选择组件名称",
  });
}

function getTemplate(initType, templateList) {
  return makeList({
    message:
      initType === INIT_TYPE.PROJECT ? "请选择项目模板" : "请选择组件模板",
    choices: templateList,
  });
}

function getProjectVersion(initType) {
  return makeInput({
    message:
      initType === INIT_TYPE.PROJECT ? "请选择项目版本号" : "请选择组件版本号",
    defaultValue: "1.0.0",
  });
}

export default async function createTeplate() {
  // 获取创建类型
  const initType = await getInitType();
  log.verbose("initType", initType);
  // 获取创建名称
  const projectName = await getProjectName(initType);
  // 获取创建版号
  const version = await getProjectVersion(initType);
  log.verbose("projectName/version", projectName, version);
  let templateList;
  if (initType === INIT_TYPE.PROJECT) {
    templateList = INIT_TEMPLATE.filter((item) =>
      item.tag.includes(INIT_TYPE.PROJECT)
    ).map((item) => ({ name: item.name, value: item.npmName }));
  } else {
    templateList = INIT_TEMPLATE.filter((item) =>
      item.tag.includes(INIT_TYPE.COMPONENT)
    );
  }
  const initTemplate = await getTemplate(initType, templateList);
  log.verbose("initTemplate", initTemplate);

  const template = INIT_TEMPLATE.find((_) => _.npmName === initTemplate);
  log.verbose("template", template);
  return {
    template,
    project: { name: projectName, version },
  };
}
