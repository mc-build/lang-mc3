import {
  argument,
  CommandDispatcher,
  literal,
  string,
} from "@mc-build/brigadier";
import { FileType, MCLang3File } from "../MCLang3File";

import { jsx, ref, Raw, Func, Command } from "../jsx";
import { asyncMap } from "../util/asyncMap";
export const bind = ({
  get,
  file,
}: {
  get: (name: "top" | "generic") => CommandDispatcher<unknown>;
  file: MCLang3File;
}) => {
  if (file.type === FileType.MC) {
    get("top").register(
      literal("function").then(
        argument("name", string()).then(
          literal("_block").then(
            argument("block", string()).executes(async (ctx) => {
              const name = ctx.getArgument("name");
              const block = ctx.getArgument("block");
              const src = ctx.getSource();
              let res: any[] = [];
              asyncMap(file.getBlock(block),async (ilc:any) => {
                return file.execute("generic", ilc, src,v=>res.push(v)) as Promise<string>;
              })
              return (
                <Func name={name}>
                  {res}
                </Func>
              );
            })
          )
        )
      )
    );
  }
};
