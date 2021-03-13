const chalk = require("chalk");
const util = require("util");
const config = require("!config/mc");
const B = require("@jsprismarine/brigadier");
const path = require("path");
const { performance } = require("perf_hooks");
const { prependListener } = require("process");
const CacheableArgument = require("./CachableArgument");
const MCF = require("./Function");
const Logger = require("./logUtil");
const SRC_DIR = path.resolve(process.cwd(), "src");

let topLevelConsumer = new B.CommandDispatcher();
let genericConsumer = new B.CommandDispatcher();

function build({
  file,
  groups,
  target = "root",
  content = groups.root,
  pathBase = "",
  namespace = path.relative(SRC_DIR, filepath).replace(".mc", ""),
  generatedNamespace = path.relative(SRC_DIR, filepath).replace(".mc", "_g"),
}) {
  MCF.reset();
  content.forEach((line) => {
    const lineTracker = Logger.track(line);
    try {
      CacheableArgument.reset();
      topLevelConsumer.execute(line, {
        config,
        meta: {
          file,
          target,
          content,
          pathBase,
          func: {
            base: {
              namespace,
              dir: path
                .relative(SRC_DIR, path.parse(file).dir)
                .split(path.sep)
                .filter(Boolean),
            },
            generated: {
              namespace,
              dir: [
                "generated",
                ...path
                  .relative(SRC_DIR, path.parse(file).dir)
                  .split(path.sep)
                  .filter(Boolean),
              ],
            },
          },
          groups,
        },
      });
    } catch (e) {
      console.log(e.message, "\n", line, "\n", e.stack);
      throw e;
    }
    lineTracker();
  });

  MCF.all
    .flat(Infinity)
    .reverse()
    .forEach((item) => item.toFile().confirm());
  if (config.debug.dump) {
    const dumpTracker = Logger.track("[commands dump]");
    Logger.log(
      util.inspect(
        {
          top: topLevelConsumer,
          generic: genericConsumer,
        },
        false,
        Infinity,
        chalk.supportsColor
      )
    );
    dumpTracker();
  }
}

function populateRunTimeParticipants(participants = { top: [], generic: [] }) {
  topLevelConsumer = new B.CommandDispatcher();
  genericConsumer = new B.CommandDispatcher();
  participants.top.forEach((participant) => {
    try {
      participant.participant(topLevelConsumer);
    } catch (e) {
      console.log(
        "encountered an unexpected error loading participant '" +
          participant.name +
          "'"
      );
      console.log(e);
      throw e;
    }
  });
  participants.generic.forEach((participant) => {
    try {
      participant.participant(genericConsumer);
    } catch (e) {
      console.log(
        "encountered an unexpected error loading participant '" +
          participant.name +
          "'"
      );
      console.log(e);
      throw e;
    }
  });
}
let preProcessors = [];
function registerPreProcessor(fn) {
  preProcessors.push(fn);
}
function execute(type, command, source, reset) {
  if (reset) CacheableArgument.reset();
  const start = performance.now();
  const commandTimer = Logger.track(`[raw] ${command}`);
  command = preProcessors.reduce(
    (cmd, cb) => cb(cmd, { type, command, source, reset }),
    command
  );
  let res;
  try {
    if (type === "generic") {
      res = genericConsumer.execute(command, source);
    } else if (type === "top") {
      res = topLevelConsumer.execute(command, source);
    }
  } catch (e) {
    res = [command];
  }
  commandTimer(`[processed] ${command}`);
  return res;
}
module.exports = {
  build,
  populateRunTimeParticipants,
  execute,
  registerPreProcessor,
};
