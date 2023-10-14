import path from "node:path";
import fsExtra from "fs-extra";
import { pathExistsSync } from "path-exists";
import ora from "ora";
import { glob } from "glob";
import ejs from "ejs";
import { log } from "@zcxiaobao-cli/utils";

function getCacheFilePath(targetPath, template) {
  return path.resolve(targetPath, "node_modules", template.npmName, "template");
}
function copyFile(targetPath, installDir, template) {
  const originFile = getCacheFilePath(targetPath, template);
  const fileList = fsExtra.readdirSync(originFile);
  const spinner = ora("正在拷贝模板文件...").start();
  fileList.map((file) => {
    fsExtra.copySync(`${originFile}/${file}`, `${installDir}/${file}`);
  });
  spinner.stop();
  log.success("模板下载成功");
}

async function ejsRender(installDir, template, project) {
  const ejsData = {
    data: {
      ...project, // 项目名称
    },
  };
  const ejsIgnoreFiles = [
    "**/node_modules/**",
    "**/.git/**",
    "**/.vscode/**",
    "**/.DS_Store",
  ];
  if (template.ignore) {
    ejsIgnoreFiles.push(...template.ignore);
  }
  const files = await glob("**", {
    cwd: installDir,
    nodir: true,
    ignore: [...ejsIgnoreFiles],
  });
  files.forEach((file) => {
    const filePath = path.resolve(installDir, file);
    ejs.renderFile(filePath, ejsData, (err, res) => {
      if (!err) {
        fsExtra.writeFileSync(filePath, res);
      } else {
        log.error(err, file);
        process.exit(0);
      }
    });
  });
}

export default function installTemplate(selectedTemplate, opts) {
  const { targetPath, project, template } = selectedTemplate;
  const rootDir = process.cwd();
  const installDir = path.resolve(`${rootDir}/${project.name}`);
  fsExtra.ensureDir(targetPath);
  fsExtra.ensureDir(installDir);
  copyFile(targetPath, installDir, template, project.name);
  ejsRender(installDir, template, project);
}
