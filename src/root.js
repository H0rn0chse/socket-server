import path from "path";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// projectRoot\node_modules\@h0rn0chse\[socket-server]\src
export const root = path.join(dirname, "../");

// [projectRoot]\node_modules\@h0rn0chse\socket-server\src
export const projectRoot = path.join(dirname, "../../../../");