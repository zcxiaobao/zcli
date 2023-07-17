import path from "node:path";
import fsExtra from "fs-extra";
import { dirname } from "dirname-filename-esm";
import chalk from "chalk";
import semver from "semver";
import { program } from "commander";
import { log } from "@zc-clis/utils";

const LOWEST_NODE_VERSION = "18.0.0";

const __dirname = dirname(import.meta);
const pkgPath = path.join(__dirname, "../package.json");
const pkg = fsExtra.readJSONSync(pkgPath);

function checkNodeVersion() {
  log.verbose("node version", process.version);
  if (!semver.gte(process.version, LOWEST_NODE_VERSION)) {
    throw new Error(
      chalk.red(`zcli 需要安装在${LOWEST_NODE_VERSION}以上的node版本之上`)
    );
  }
}

export default function generatorCommand() {
  const pkg = fsExtra.readJSONSync(pkgPath);
  log.info("version", pkg.version);
  program
    .name(Object.keys(pkg.bin)[0])
    .usage("<command> [options]")
    .version(pkg.version)
    .option("-d, --debug", "是否开启调试模式", false)
    .hook("preAction", () => {
      checkNodeVersion();
    });

  return program;
}
