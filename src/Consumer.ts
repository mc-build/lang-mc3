import { MCLang3File } from "./MCLang3File";
import path from "path";
import fs from "fs";
import * as B from "@mc-build/brigadier";
const consumer_paths: Set<string> = new Set([
  path.resolve(__dirname, "participants"),
]);
const modules = new Map();
export interface IGatherApi {
  get(name: string): B.CommandDispatcher<unknown>;
  file: MCLang3File;
  expose(name: string, callable: {type:string,execute:Function}): void;
}
function bindMacros({ get, file }: IGatherApi) {
  const macros = file.getMacros();
  const consumer = get("generic");
  const macro_root = B.literal("macro");
  Object.entries(macros).forEach(([key, value]) => {
    macro_root.then(
      B.literal(key).then(
        B.argument("args", B.greedyString()).executes(value as any)
      ).executes(value as any)
    );
    consumer.register(
      B.literal(key).then(
        B.argument("args", B.greedyString()).executes(value as any)
      ).executes(value as any)
    );
  });
  consumer.register(macro_root);
}
const paths: string[] = [];
let loaded = false;
function populateConsumers() {
  consumer_paths.forEach((dir) => {
    const items = fs.readdirSync(dir);
    paths.push(...items.map((item) => path.join(dir, item)));
  });
  loaded = true;
}
export function gather(file: MCLang3File) {
  if (!loaded) populateConsumers();
  const consumers = new Map();
  function get(name: string): B.CommandDispatcher<unknown> {
    if (!consumers.has(name)) {
      consumers.set(name, new B.CommandDispatcher<unknown>());
    }
    return consumers.get(name);
  }
  get("top");
  get("generic");
  bindMacros({
    get,
    file,
    expose:()=>{}
  });
  for (let i = 0; i < paths.length; i++) {
    if (!modules.has(paths[i])) modules.set(paths[i], require(paths[i]));
    modules.get(paths[i]).bind({
      get,
      file,
      expose(name: string, callable: any): void {
        file.addExport(name, callable);
      },
    });
  }
  return consumers;
}
