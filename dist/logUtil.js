const config = require("!config/mc");
const { performance } = require("perf_hooks");

class Logger {
  static groups = [];
  static track(name) {
    const start = performance.now();
    console.group(name);
    let cleanup = (nameOverride) => {
      console.groupEnd();
      console.log(`${nameOverride || name} : ${performance.now() - start}ms`);
      Logger.groups.splice(Logger.groups.indexOf(cleanup, 1));
    };
    Logger.groups.push(cleanup);
    return cleanup;
  }
  clean() {
    Logger.groups.forEach((Cb) => Cb());
  }
}
class DummyLogger {
  static track(name) {
    return () => {};
  }
  static clean() {}
}

if (config.debug.logging) {
  module.exports = Logger;
} else {
  module.exports = DummyLogger;
}
