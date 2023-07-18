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
  loop,
}) {
  const options = {
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
