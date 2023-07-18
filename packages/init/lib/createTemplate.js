import { makeInput, log, makeList, getLatestVersion } from "@zcxiaobao/utils";

const ADD_TEMPLATE = [
  {
    name: "vue3项目模板",
    value: "template-vue3",
    npmName: "@zcxiaobao/template-vue3",
    version: "1.0.0",
    forceInstallNew: true, // 是否默认下载最新版本
  },
  {
    name: "react18项目模板",
    value: "template-react18",
    npmName: "@zcxiaobao/template-react18",
    version: "1.0.0",
    forceInstallNew: true,
  },
];

const ADD_TYPE = {
  PAGE: "PAGE",
  PROJECT: "PROJECT",
};

const ADD_TYPE_LIST = [
  { name: "项目", value: ADD_TYPE.PROJECT },
  { name: "页面", value: ADD_TYPE.PAGE },
];

function getAddType() {
  return makeList({
    choices: ADD_TYPE_LIST,
    defaultValue: ADD_TYPE.PROJECT,
    message: "请选择初始化类型",
  });
}

function getAddName() {
  return makeInput({
    type: "input",
    message: "请选择项目名称",
  });
}

function getTemplate() {
  return makeList({
    message: "请选择项目模板",
    choices: ADD_TEMPLATE,
  });
}
export default async function createTeplate(name, opts) {
  // 获取创建类型
  const addType = await getAddType();
  log.verbose("addType", addType);
  if (addType === ADD_TYPE.PROJECT) {
    const addName = await getAddName();
    log.verbose("addName", addName);
    const addTemplate = await getTemplate();
    log.verbose("addTemplate", addTemplate);

    const needLoadTemplateDetails = ADD_TEMPLATE.find(
      (_) => _.value === addTemplate
    );
    log.verbose("needLoadTemplateDetails", needLoadTemplateDetails);
    const addTemplateLatest = await getLatestVersion(
      needLoadTemplateDetails.npmName
    );
    log.verbose("addTemplateLatest", addTemplateLatest);
    return {
      addName,
      addType,
      template: needLoadTemplateDetails,
    };
  }
}
