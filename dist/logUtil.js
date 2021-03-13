const config = require("!config/mc");
const { createWriteStream, WriteStream } = require("fs");
const { resolve } = require("path");
const { performance } = require("perf_hooks");
const util = require("util");

class Logger {
  static output = null;
  static groups = [];
  static level = 0;
  static track(name = "unknown") {
    const start = performance.now();
    Logger.log(`Start: ${name}`);
    Logger.level++;
    let cleanup = (nameOverride) => {
      Logger.level--;
      Logger.log(
        `End : ${nameOverride || name} : ${performance.now() - start}ms`
      );
      Logger.groups.splice(Logger.groups.indexOf(cleanup, 1));
    };
    Logger.groups.push(cleanup);
    return cleanup;
  }
  static clean() {
    Logger.groups.forEach((Cb) => Cb());
  }
  static log(...message) {
    Logger.output.write(
      "  ".repeat(Logger.level) + Logger.format(message) + "\n"
    );
  }
  static format(items) {
    return items.map((item) => {
      if (typeof item === "string") {
        return item;
      }
      return util.inspect(items, false, Infinity);
    });
  }
  static update() {
    Logger.useColor = require("supports-color").supportsColor(Logger.output);
  }
}
class DummyLogger {
  static track(name) {
    return () => {};
  }
  static clean() {}
  static log() {}
}

if (config.debug.logging) {
  module.exports = Logger;
  if (typeof config.debug.logFile === "string") {
    Logger.output = createWriteStream(
      resolve(process.cwd(), config.debug.logFile)
    );
  } else if (config.debug.logFile === null) {
    Logger.output = process.stdout;
  }
} else {
  module.exports = DummyLogger;
}
