const {Suggestions} = require("@jsprismarine/brigadier");
module.exports.ScriptArgument = class ScriptArgument {
	constructor() {
		this.script = "";
	}
	parse(reader) {
        let script = reader.read();
        let indent = 1;
        while(reader.canRead() && indent != 0){
            const char = reader.read();
            switch(char){
                case "(":indent++;break;
                case ")":indent++;break;
            }
            script+=char;
        }
        this.script = script;
		return this;
	}
	listSuggestions(context, builder) {
		return Suggestions.empty();
	}
	getExamples() {
		return [
			"1 2 3"
		]
	}
}