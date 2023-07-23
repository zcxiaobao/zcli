import path from "node:path";
import { homedir } from "node:os";
import { pathExistsSync } from "path-exists";
import fsExtra from "fs-extra";
import fs from "node:fs";
import { makePassword } from "../inquirer.js";
import log from "../log.js";

const TEMP_HOME = ".zcli";
const TEMP_TOKEN = ".token";
function createTokenPath() {
  return path.resolve(homedir(), TEMP_HOME, TEMP_TOKEN);
}

function getToken() {
  return makePassword({
    message: "请输入token信息",
  });
}
class GitCommon {
  constructor() {}
  async init() {
    const tokenPath = createTokenPath();
    if (pathExistsSync(tokenPath)) {
      this.token = fsExtra.readFileSync(tokenPath).toString();
    } else {
      this.token = await getToken();
      fs.writeFileSync(tokenPath, this.token);
    }
    log.verbose("token", this.token);
  }
}
export { GitCommon };
