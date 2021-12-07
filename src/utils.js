/* eslint-disable no-underscore-dangle */
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const __root = path.join(__dirname, "../");

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