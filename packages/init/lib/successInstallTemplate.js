import { installDependencies, makeConfirm, runProject } from "@zcxiaobao/utils";
import path from "node:path";
import boxen from "boxen";
import chalk from "chalk";
export default async function successInstallTemplate(
  selectedTemplate,
  installPath
) {
  const { template, project } = selectedTemplate;
  const isNeedInstallDep = await makeConfirm({
    message: "模板下载完成，是否执行模板依赖安装及项目启动？",
    defaultValue: false,
  });

  if (isNeedInstallDep) {
    const temInstallPath = path.resolve(installPath, project.name);
    await installDependencies(temInstallPath);
    await runNewProject(template, temInstallPath);
  } else {
    createSuccessInfo(project.name, "npm");
  }
}

async function runNewProject(template, temInstallPath) {
  console.log(template.startCommand);
  const execaCom = template.startCommand.split(" ");
  await runProject(execaCom[0], execaCom.slice(1), temInstallPath);
}

function createSuccessInfo(name, tool) {
  const END_MSG = `${chalk.blue(
    "🎉 created project " + chalk.greenBright(name) + " Successfully"
  )}\n\n 🙏 Thanks for using @zcxiaobao/zcli !`;

  const BOXEN_CONFIG = {
    padding: 1,
    margin: { top: 1, bottom: 1 },
    borderColor: "cyan",
    align: "center",
    borderStyle: "double",
    title: "🚀 Congratulations",
    titleAlignment: "center",
  };

  process.stdout.write(boxen(END_MSG, BOXEN_CONFIG));

  console.log("👉 Get started with the following commands:");
  console.log(`\n\r\r cd ${chalk.cyan(name)}`);
  console.log(`\r\r ${template.startCommand} \r\n`);
}
