import path from "path";
import { fileURLToPath } from "url";

export function equalKeyObjects (key1, key2) {
    const keyNames = Object.keys(key1);

    if (JSON.stringify(keyNames) !== JSON.stringify(Object.keys(key2))) {
        return false;
    }

    return keyNames.reduce((acc, key) => {
        if (!acc) {
            return acc;
        }

        return key1[key] === key2[key];
    }, true);
}

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// projectRoot\node_modules\@h0rn0chse\[socket-server]\src
export const root = path.join(dirname, "../");

// [projectRoot]\node_modules\@h0rn0chse\socket-server\src
export const projectRoot = path.join(dirname, "../../../../");
