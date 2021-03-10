const B = require("@jsprismarine/brigadier");
const { ScriptArgument } = require("../ScriptArgument");
const { BlockArgument } = require("../BlockArgument");
module.exports = (api) => {
  api.registerParticipant(
    api.participants.generic,
    "compile time if",
    (Host) => {
      const compileTimeIfStatement = (ctx) => {
        let h2;
        try {
          h2 = ctx.getArgument("block2")?.getHistory();
        } catch (e) {}
        const block = [...ctx.getArgument("block").getHistory(), ...(h2 || [])];
        const conditions = ctx.getArgument("script").getHistory();
        for (let i = 0; i < block.length; i++) {
          if (
            i >= conditions.length ||
            api.script.evaluateValueWithEnv(
              conditions[i].script,
              ctx.getSource()
            )
          ) {
            return block[i].block.map((command) => {
              let res = api.dispatch("generic", command, ctx.getSource(), true);
              return res || command;
            });
          }
        }
        return [];
      };
      const IF = Host.register(B.literal("IF"));
      Host.register(
        B.literal("IF").then(
          B.argument("script", new ScriptArgument()).then(
            B.argument("block", new BlockArgument(api))
              .executes(compileTimeIfStatement)
              .then(
                B.literal("ELSE")
                  .then(
                    B.literal("_call").then(
                      B.argument(
                        "block2",
                        new BlockArgument(api, true)
                      ).executes(compileTimeIfStatement)
                    )
                  )
                  .then(B.literal("IF").forward(IF))
              )
          )
        )
      );
    }
  );
};
