const B = require("@jsprismarine/brigadier");
const File = require("!io/File");
const MCF = require("../Function");
module.exports = (api) => {
  api.registerParticipant(api.participants.top, "dir", (Host) => {
    Host.register(
      B.literal("dir").then(
        B.argument("name", B.string()).then(
          B.literal("_call").then(
            B.argument("block", B.string()).executes((ctx) => {
              const name = ctx.getArgument("name");
              const block = ctx.getArgument("block");
              const context = ctx.getSource();
              const newctx = {
                ...context,
                meta: {
                  ...context.meta,
                  func: {
                    ...context.meta.func,
                    base: {
                      ...context.meta.func.base,
                      dir: [...context.meta.func.base.dir, name],
                    },
                  },
                },
              };
              context.meta.groups[block].forEach((command) => {
                try {
                  return api.dispatch("top", command, newctx, true);
                } catch (e) {
                  return command;
                }
              });
            })
          )
        )
      )
    );
  });
};
