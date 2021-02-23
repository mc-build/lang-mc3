const B = require("@jsprismarine/brigadier");
const { ScriptArgument } = require("../ScriptArgument");
module.exports = api => {
    api.registerParticipant(api.participants.compiler, 'compile time loop', (Host) => {
        Host.register(
            B.literal("IF").then(
                B.argument("cond",new ScriptArgument()).executes((ctx)=>{
                    const cond = ctx.getArgument("cond");
                    if(api.script.evaluateValueWithEnv(cond,api.context.getAll())){
                        console.log("remove");
                    }else{
                        console.log("add");
                    }
                })
            )
        );
    });
}