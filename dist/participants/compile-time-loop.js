const B = require("@jsprismarine/brigadier");
const { ScriptArgument } = require("../ScriptArgument");
module.exports = api => {
    api.registerParticipant(api.participants.compiler, 'compile time loop', (Host) => {
        Host.register(B.literal("LOOP")
            .then(B.argument("var_name", B.string())
                .then(B.literal("value")
                    .then(B.argument("count", B.integer(0))
                        .executes((ctx) => {
                            const min = 0;
                            const max = ctx.getArgument("count");
                            const var_name = ctx.getArgument("var_name");
                            const block = api.getBlock(api.tokens);
                            // const code = block.slice(1,-1).map(_=>_.value).join("\n");
                            let code = "";
                            let localTokens = block.slice(1, -1);
                            while (localTokens.length) {
                                code += api.getSingleLineFromTokenList(localTokens) + "\n";
                            }
                            for (let i = max - 1; i >= min - 1; i--) {
                                api.TempEnv[var_name] = i;
                                const edit = api.edit.get();
                                edit.push(code);
                                api.edit.finish();
                                api.edit.init();
                            }
                        })
                    )
                )
                .then(B.literal("script")
                    .then(B.argument("script", new ScriptArgument())
                        .executes((ctx) => {
                            const { script } = ctx.getArgument("script");
                            const min = 0;
                            const max = api.scriptevaluateValueWithEnv(script, getCompleteContext());
                            const var_name = ctx.getArgument("var_name");
                            const block = api.getBlock(api.tokens);
                            // const code = block.slice(1,-1).map(_=>_.value).join("\n");
                            let code = "";
                            let localTokens = block.slice(1, -1);
                            while (localTokens.length) {
                                code += api.getSingleLineFromTokenList(localTokens) + "\n";
                            }
                            for (let i = max; i >= min - 1; i--) {
                                api.TempEnv[var_name] = i;
                                const edit = api.edit.get();
                                edit.push(code);
                                api.edit.finish();
                                api.edit.init();
                            }
                        })
                    )
                )
            )
        );
    });
}