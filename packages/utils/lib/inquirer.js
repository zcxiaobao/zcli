import inquirer from "inquirer";

function make({
  type = "list",
  message = "请选择",
  require = true,
  mask = "*",
  defaultValue,
  choices,
  validate,
  pageSize,
  loop = false,
}) {
  const options = {
    type,
    name: "name",
    message,
    require,
    mask,
    default: defaultValue,
    validate,
    pageSize,
    loop,
  };

  if (type === "list") {
    options.choices = choices;
  }
  // 注意: 由于此处封装了 .name，后续获取都是 name 属性值
  return inquirer.prompt(options).then((answer) => answer.name);
}

export function makeList(params) {
  return make({ ...params });
}

export function makeInput(params) {
  return make({ type: "input", ...params });
}
export function makePassword(params) {
  return make({ type: "password", ...params });
}
export function makeConfirm(params) {
  return make({ type: "confirm", default: false, ...params });
}
