"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gather = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const B = __importStar(require("@mc-build/brigadier"));
const consumer_paths = new Set([
    path_1.default.resolve(__dirname, "participants"),
]);
const modules = new Map();
function bindMacros({ get, file }) {
    const macros = file.getMacros();
    const consumer = get("generic");
    const macro_root = B.literal("macro");
    Object.entries(macros).forEach(([key, value]) => {
        macro_root.then(B.literal(key).then(B.argument("args", B.greedyString()).executes(value)).executes(value));
        consumer.register(B.literal(key).then(B.argument("args", B.greedyString()).executes(value)).executes(value));
    });
    consumer.register(macro_root);
}
const paths = [];
let loaded = false;
function populateConsumers() {
    consumer_paths.forEach((dir) => {
        const items = fs_1.default.readdirSync(dir);
        paths.push(...items.map((item) => path_1.default.join(dir, item)));
    });
    loaded = true;
}
function gather(file) {
    if (!loaded)
        populateConsumers();
    const consumers = new Map();
    function get(name) {
        if (!consumers.has(name)) {
            consumers.set(name, new B.CommandDispatcher());
        }
        return consumers.get(name);
    }
    get("top");
    get("generic");
    bindMacros({
        get,
        file,
        expose: () => { }
    });
    for (let i = 0; i < paths.length; i++) {
        if (!modules.has(paths[i]))
            modules.set(paths[i], require(paths[i]));
        modules.get(paths[i]).bind({
            get,
            file,
            expose(name, callable) {
                file.addExport(name, callable);
            },
        });
    }
    return consumers;
}
exports.gather = gather;
