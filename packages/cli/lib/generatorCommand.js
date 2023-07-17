import path from "node:path";
import fsExtra from "fs-extra";
import { dirname } from "dirname-filename-esm";

import { program } from "commander";
import { log } from "@zc-clis/utils";

const __dirname = dirname(import.meta);
const pkgPath = path.join(__dirname, "../package.json");
const pkg = fsExtra.readJSONSync(pkgPath);
export default function generatorCommand() {
  const pkg = fsExtra.readJSONSync(pkgPath);
  log.info("version", pkg.version);
  program
    .name(Object.keys(pkg.bin)[0])
    .usage("<command> [options]")
    .version(pkg.version)
    .option("-d, --debug", "是否开启调试模式", false);

  return program;
}
