const B = require("@jsprismarine/brigadier");
const File = require("!io/File");
const MCF = require("../Function");
module.exports = (api) => {
  api.registerParticipant(api.participants.top, "function", (Host) => {
    Host.register(
      B.literal("function").then(
        B.argument("name", B.string()).then(
          B.literal("_call").then(
            B.argument("block", B.string()).executes((ctx) => {
              const name = ctx.getArgument("name");
              const block = ctx.getArgument("block");
              const context = ctx.getSource();
              const children = [];
              return new MCF(
                context.meta.groups[block].map((command) => {
                  try {
                    return api.dispatch(
                      "generic",
                      command,
                      {
                        ...context,
                        context: children,
                      },
                      true
                    );
                  } catch (e) {
                    return command;
                  }
                }),
                context.meta.func.base,
                name
              );
            })
          )
        )
      )
    );
  });
};
