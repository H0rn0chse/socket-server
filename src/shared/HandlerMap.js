import { equalKeyObjects } from "./utils.js";

export class HandlerMap {
    constructor (signature) {
        this.signature = signature;
        this.handler = new Map();
    }

    _buildKey (valueList) {
        return this.signature.reduce((key, name, index) => {
            key[name] = valueList[index]
            return key;
        }, {});
    }

    _getKey (searchKey) {
        return Array.from(this.handler.keys()).find((key) => {
            return equalKeyObjects(key, searchKey);
        })
    }

    add (...values) {
        const searchKey = this._buildKey(values);
        if (!this._getKey(searchKey)) {
            this.handler.set(searchKey, true);
        }
    }

    set (...values) {
        const searchKey = this._buildKey(values);
        const key = this._getKey(searchKey);
        this.handler.set(key || searchKey, true);
    }

    forEach (callback) {
        Array.from(this.handler.keys()).forEach((key) => {
            const args = this.signature.map((keyName) => {
                return key[keyName];
            });
            callback(...args);
        });
    }

    map (callback) {
        return Array.from(this.handler.keys()).map((key) => {
            const args = this.signature.map((keyName) => {
                return key[keyName];
            });
            return callback(...args);
        });
    }

    delete (...values) {
        const searchKey = this._buildKey(values);
        const key = this._getKey(searchKey);
        if (key) {
            this.handler.delete(key);
        }
    }
}
