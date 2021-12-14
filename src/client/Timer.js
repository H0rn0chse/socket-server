/* General idea:
    The timeout runs to its end and does not get canceled
    But it can be reset in while it's running
    After the timeout is done the handler is called and
    a new timeout is started with the remaining length since the last reset

    e.g. a timer is supposed to run 10 seconds but is reset after 8
    Then the handler is called after 10 seconds and 18 seconds
*/
export class Timer {
    constructor (timeout, callback) {
        this.timeout = timeout * 1000;
        this.callback = callback;
        this.timer = null;

        this.startTime = Date.now();
        this.resetTime = Date.now();
        this.wasReset = false;
    }

    /**
     * Starts the timer
     */
    start () {
        clearTimeout(this.timer);

        const delta = this.resetTime - this.startTime;
        let timeDiff = Math.abs(delta - this.timeout);
        if (timeDiff < 1000) {
            timeDiff = this.timeout;
        }

        this.timer = setTimeout(() => {
            this._handleTimeout();
        }, timeDiff);

        this.startTime = Date.now();
        this.resetTime = this.startTime;
    }

    _handleTimeout () {
        const { wasReset } = this;
        if (this.wasReset) {
            this.wasReset = false;
            this.start();
        }
        this.callback(wasReset);
    }

    /**
     * Resets the remaininng time of the timer
     */
    reset () {
        this.wasReset = true;
        this.resetTime = Date.now();
    }

    /**
     * Stops the timer
     */
    clear () {
        clearTimeout(this.timer);
        this.wasReset = false;
    }
}
