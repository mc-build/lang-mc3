import {
  argument,
  CommandDispatcher,
  literal,
  string,
} from "@mc-build/brigadier";
import { MCLang3File } from "../MCLang3File";
import { jsx, ref, Raw, Func, Command } from "../jsx";
export const bind = ({
  get,
  file,
}: {
  get: (name: "top" | "generic") => CommandDispatcher<unknown>;
  file: MCLang3File;
}) => {
  get("generic").register(
    literal("dummy").then(
      argument("name", string()).executes(async (ctx) => {
        const a = ref();
        return (
          <Raw>
            function <Func ref={a}><Raw>function {a}</Raw></Func>
          </Raw>
        );
      })
    )
  );
};
