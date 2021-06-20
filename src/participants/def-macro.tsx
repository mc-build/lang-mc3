import {
  argument,
  CommandDispatcher,
  literal,
  string,
  CommandContext
} from "@mc-build/brigadier";
import { FileType, ILT, MCLang3File } from "../MCLang3File";

import { jsx, ref, Raw, Func, Command } from "../jsx";
import { asyncMap } from "../util/asyncMap";
import { IGatherApi } from "../Consumer";
export const bind = (a: IGatherApi) => {
  const { get, file, expose } = a;
  if (file.type === FileType.MCM) {
    get("top").register(
      literal("macro").then(
        argument("name", string()).then(
          literal("_block").then(
            //@ts-ignore
            argument("block", string()).executes((ctx) => {
              const name = ctx.getArgument("name");
              const block = ctx.getArgument("block");

              expose(name, {
                type: "macro",
                execute: async (ctx2:CommandContext<any>) => {
                  let args = [];
                  try{
                    args = ctx2.getArgument("args").split(" ");
                  }catch(e){

                  }
                  const src: Record<any, any> = ctx2.getSource() as any;

                  const replacements: string[][] = [];
                  for (let i = 0; i < args.length; i++) {
                    if (args[i] === "_block") {
                      args[i] += " " + args[i] + 1;
                      args.splice(i + 1, 1);
                      replacements.push([new RegExp("\\$\\$" + i, "g"), args[i]]);
                    } else {
                      replacements.push([new RegExp("\\$\\$" + i, "g"), args[i]]);
                    }
                  }
                  return asyncMap(file.getBlock(block), async (ILCMD: ILT) => {
                    return file.execute("generic", ILCMD, {
                      ...src,
                      replacements: replacements.reverse(),
                    });
                  });
                },
              });
            })
          )
        )
      )
    );
  }
};
