import { Timer } from "./Timer.js";

export class KeepAlive {
    constructor (ping, pingTimeout, timeout) {
        this.ping = ping;
        this.shouldLogoff = false;
        this.logoffDone = false;

        this.logoffTimer = new Timer(timeout, this._checkTimeout.bind(this));
        this.logoffTimer.start();
        this.pingTimer = new Timer(pingTimeout, this._doPing.bind(this));
        this.pingTimer.start();

        this.boundHandler = this._handleActivity.bind(this);
        this.eventList = ["mousemove", "click", "keydown"];
        this.eventList.forEach((event) => {
            document.body.addEventListener(event, this.boundHandler);
        });
    }

    _handleActivity (evt) {
        if (this.logoffDone) {
            return;
        }
        // pings has stopped and should be started again
        if (this.shouldLogoff) {
            this.shouldLogoff = false;
            this.pingTimer.start();
            this.logoffTimer.start();
        } else {
            this.logoffTimer.reset();
        }
    }

    _checkTimeout (wasReset) {
        if (wasReset) {
            // extending logoff
            return;
        }
        // should now logoff
        this.pingTimer.clear();
        this.logoffTimer.clear();
        this.shouldLogoff = true;
    }

    _doPing (wasReset) {
        if (this.shouldLogoff) {
            return;
        }
        this.ping();
        this.pingTimer.start();
    }

    doLogoff () {
        this.pingTimer.clear();
        this.logoffTimer.clear();
        this.eventList.forEach((event) => {
            document.body.removeEventListener(event, this.boundHandler);
        });
    }
}
