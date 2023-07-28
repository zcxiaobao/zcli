import fsExtra from "fs-extra";
import { pathExistsSync } from "path-exists";

function readFile(path, options = {}) {
  if (pathExistsSync(path)) {
    const buffer = fsExtra.readFileSync(path);
    if (buffer) {
      if (options.toJSON) {
        return buffer.toJSON();
      } else {
        return buffer.toString();
      }
    }
  }
}

function writeFile(path, data, { rewrite = true } = {}) {
  if (pathExistsSync(path)) {
    if (rewrite) {
      fsExtra.writeFileSync(path, data);
    } else {
      return false;
    }
  } else {
    fsExtra.writeFileSync(path, data);
  }
  return true;
}

function createFile(path, { force = false } = {}) {
  if (!pathExistsSync(path)) {
    fsExtra.ensureFile(path);
  } else {
    if (force) {
      fsExtra.removeSync(path);
      fsExtra.ensureFile(path);
    }
  }
}
export { readFile, writeFile, createFile };
