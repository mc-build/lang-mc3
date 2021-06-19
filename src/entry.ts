import { CompileTimeError } from "./CompileTimeError";
import { fileCache } from "./fileCache";
import { MCLang3File } from "./MCLang3File";
import "./languages/JavaScript";
import "./participants/dummy";
import "./participants/def-function";
export default (
  registry: Map<String, (filepath: string) => Promise<void> | void>
) => {
  const file_handler = async (file_path: string) => {
    try {
      if (!fileCache.has(file_path)) {
        fileCache.set(file_path, new MCLang3File(file_path));
      }
      await fileCache.get(file_path)?.update();
    } catch (e) {
      CompileTimeError.reset();
      if (e instanceof CompileTimeError) {
        console.log(e.toString());
      } else {
        throw e;
      }
    }
  };
  registry.set(".mc", file_handler);
  registry.set(".mcm", file_handler);
  return { exported: {} };
};
