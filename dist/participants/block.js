const B = require("@jsprismarine/brigadier");
const File = require("!io/File");
module.exports = api => {
    api.registerParticipant(api.participants.generic, 'inline-block', (Host) => {
        Host.register(B.literal("block").then(
            B.literal("_call").then(
                B.argument("block", B.string()).executes((ctx) => {
                    const block = ctx.getArgument("block");
                    const context = ctx.getSource();
                    const children = [];
                    context.groups[block].map(command => {
                        try {
                            api.dispatch("generic", command, {
                                ...context,
                                context: children
                            });
                        } catch (e) {
                            children.push(command);
                        }
                    });
                    const outputPath = api.getGeneratedOutputPath(context.generatedNamespace, 'functions', block + ".mcfunction");
                    const file = new File();
                    file.setContents(children.join("\n"));
                    file.setPath(outputPath);
                    file.confirm();
                    context.context.push(`function ${context.generatedNamespace}:${block}`);
                })
            )
        ))
    });
}