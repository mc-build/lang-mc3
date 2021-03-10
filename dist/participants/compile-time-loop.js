const B = require("@jsprismarine/brigadier");
const { BlockArgument } = require("../BlockArgument");
const { ScriptArgument } = require("../ScriptArgument");
module.exports = (api) => {
  const Loop = (Host) => {
    Host.register(
      B.literal("LOOP").then(
        B.argument("var_name", B.string())
          .then(
            B.literal("value").then(
              B.argument("count", B.string()).then(
                B.argument("block", new BlockArgument(api)).executes((ctx) => {
                  let min = 0;
                  let max = ctx.getArgument("count");
                  let value = max;
                  if (max.includes("..")) {
                    [min, max] = max.split("..").map((_) => parseInt(_));
                  }
                  if (min >= max) {
                    throw new CompilerError(`Invalid loop value(s) (${value}`);
                  }
                  const var_name = ctx.getArgument("var_name");
                  const block = ctx.getArgument("block");
                  const result = [];
                  for (let i = min; i < max; i++) {
                    for (let command of block.block) {
                      result.push(
                        api.dispatch(
                          "generic",
                          command,
                          {
                            ...ctx.getSource(),
                            [var_name]: i,
                          },
                          true
                        )
                      );
                    }
                  }

                  return result;
                })
              )
            )
          )
          .then(
            B.literal("script").then(
              B.argument("value", new ScriptArgument()).then(
                B.argument("block", new BlockArgument(api)).executes((ctx) => {
                  const in_value = api.script.evaluateValueWithEnv(
                    ctx.getArgument("value").script,
                    ctx.getSource()
                  );
                  const var_name = ctx.getArgument("var_name");
                  const block = ctx.getArgument("block");
                  const result = [];
                  if (Array.isArray(in_value)) {
                    for (const item of in_value) {
                      for (let command of block.block) {
                        result.push(
                          api.dispatch(
                            "generic",
                            command,
                            {
                              ...ctx.getSource(),
                              [var_name]: item,
                            },
                            true
                          )
                        );
                      }
                    }
                  } else if (typeof in_value === "object") {
                    for (const key in in_value) {
                      const value = in_value[key];
                      for (let command of block.block) {
                        result.push(
                          api.dispatch(
                            "generic",
                            command,
                            {
                              ...ctx.getSource(),
                              [var_name]: { key, value },
                            },
                            true
                          )
                        );
                      }
                    }
                  }

                  return result;
                })
              )
            )
          )
      )
    );
  };
  api.registerParticipant(
    api.participants.generic,
    "compile time loop",
    (Host) => {
      Loop(Host);
    }
  );
  api.registerParticipant(api.participants.top, "compile-time-loop", (Host) => {
    Loop(Host);
  });
};
