import {
  argument,
  CommandDispatcher,
  literal,
  string,
} from "@mc-build/brigadier";
import { FileType, ILT, MCLang3File } from "../MCLang3File";

import { jsx, ref, Raw, Func, Command, Dir } from "../jsx";
import { asyncMap } from "../util/asyncMap";
export const bind = ({
  get,
  file,
}: {
  get: (name: "top" | "generic") => CommandDispatcher<unknown>;
  file: MCLang3File;
}) => {
  get("top").register(
    literal("dir").then(
      argument("name", string()).then(
        literal("_block").then(
          argument("block", string()).executes(async (ctx) => {
            const name = ctx.getArgument("name");
            const block = ctx.getArgument("block");
            const src = ctx.getSource();
            return (
              <Dir name={name}>
                {asyncMap(file.getBlock(block),async (ilc: ILT) => {
                  return file.execute("top", ilc, src) as Promise<string>;
                })}
              </Dir>
            );
          })
        )
      )
    )
  );
};
