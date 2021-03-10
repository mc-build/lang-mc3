const B = require("@jsprismarine/brigadier");
const File = require("!io/File");
const MCF = require("../Function");
module.exports = (api) => {
  api.registerParticipant(api.participants.generic, "inline-block", (Host) => {
    Host.register(
      B.literal("block").then(
        B.literal("_call").then(
          B.argument("block", B.string()).executes((ctx) => {
            const block = ctx.getArgument("block");
            const context = ctx.getSource();
            const children = [];
            context.meta.groups[block].map((command) => {
              try {
                children.push(
                  ...api.dispatch("generic", command, {
                    ...context,
                    context: children,
                  })
                );
              } catch (e) {
                children.push(command);
              }
            });
            return MCF.join(
              "function ",
              new MCF(children, context.meta.func.generated)
            );
          })
        )
      )
    );
  });
};
