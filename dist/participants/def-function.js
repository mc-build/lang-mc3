const B = require("@jsprismarine/brigadier");
const File = require("!io/File");
module.exports = api => {
    api.registerParticipant(api.participants.top, 'function', (Host) => {
        Host.register(B.literal("function").then(
            B.argument("name", B.string()).then(
                B.literal("_call").then(
                    B.argument("block",B.string()).executes((ctx)=>{
                        const name = ctx.getArgument("name");
                        const block = ctx.getArgument("block");
                        const context = ctx.getSource();
                        const children = [];
                        context.groups[block].map(command => {
                            try{
                                api.dispatch("generic",command,{
                                    ...context,
                                    context:children
                                });
                            }catch(e){
                                children.push(command);
                            }
                        });
                        const outputPath = api.getOutputFilePath(context.namespace,'functions',name+".mcfunction");
                        const file = new File();
                        file.setContents(children.join("\n"));
                        file.setPath(outputPath);
                        file.confirm();
                    })
                )
            )
        ))
    });
}