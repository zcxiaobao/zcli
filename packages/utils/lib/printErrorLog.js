import isDebug from "./isDebug.js";
import log from "./log.js";

export default function printErrorLog(e, type) {
  if (isDebug()) {
    log.error(type, e);
  } else {
    log.error(type, e.message);
  }
}
