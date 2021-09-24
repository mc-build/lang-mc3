import * as B from "@mc-build/brigadier";
import { FileType, ILT, MCLang3File } from "../MCLang3File";

import { jsx, ref, Raw, Func, Command } from "../jsx";
import { asyncMap } from "../util/asyncMap";
export const bind = ({
  get,
  file,
}: {
  get: (name: "top" | "generic") => B.CommandDispatcher<unknown>;
  file: MCLang3File;
}) => {
  const Host = get("generic");
  Host.register(
    B.literal("block").then(
      B.literal("_block").then(
        B.argument("block", B.string()).executes(async (ctx) => {
          const block = ctx.getArgument("block");
          const src = ctx.getSource();
          let res = await (
            <Raw>
              function <Func>
                {asyncMap(file.getBlock(block),async (ilc: ILT) => {
                  let result = [];
                  result.push(await file.execute("generic", ilc, src,(item)=>{
                    result.push(item);
                  }) as Promise<string>);
                  return result;
                })}
              </Func>
            </Raw>
          );
          return res;
        })
      )
    )
  );
};
