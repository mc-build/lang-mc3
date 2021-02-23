const B = require("@jsprismarine/brigadier");
const path = require("path");

const SRC_DIR = path.resolve(process.cwd(),'src');

let topLevelConsumer = new B.CommandDispatcher();
let genericConsumer = new B.CommandDispatcher();


function build({
    file,
    groups,
    target='root',
    content=groups.root,
    pathBase='',
    namespace=path.relative(SRC_DIR,filepath).replace(".mc",""),
    generatedNamespace=path.relative(SRC_DIR,filepath).replace(".mc","")
}){
    content.forEach((line)=>{
        try{
            topLevelConsumer.execute(line,{
                file,groups,target,content,pathBase,namespace,generatedNamespace
            });
        }catch(e){
            console.log(e.message,"\n",line);
            throw e;
        }
    });
}

function populateRunTimeParticipants(participants={top:[],generic:[]}){
    topLevelConsumer = new B.CommandDispatcher();
    genericConsumer = new B.CommandDispatcher();
    participants.top.forEach((participant)=>{
        try{
            participant.participant(topLevelConsumer);
        }catch(e){
            console.log("encountered an unexpected error loading participant '"+participant.name+"'");
            console.log(e);
        }
    });
    participants.generic.forEach((participant)=>{
        try{
            participant.participant(genericConsumer);
        }catch(e){
            console.log("encountered an unexpected error loading participant '"+participant.name+"'");
            console.log(e);
        }
    });
}
function execute(type,command,source){
    if(type==="generic"){
        return genericConsumer.execute(command,source);
    }else if(type==="top"){
        return topLevelConsumer.execute(command,source);
    }
}
module.exports = {build,populateRunTimeParticipants,execute};