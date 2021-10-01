class StatusChecker {
    constructor(count) {
        this.check = this.check.bind(this);
        this.checkCount = 1;
        this.status = new Array(count).fill(0);
        this.readyCallback = null;
    }

    /**
     * @brief Sets the amount of checks each element has to have.
     */
    setCheckCount(count) {
        this.checkCount = count;
    }

    /**
     * @brief Sets a callback that will be invoked after the last unchecked element is checked
              and the check count is satisfied.
     */
    setReadyCallback(callback) {
        this.readyCallback = callback;
    }

    /**
     * @brief Sets the check count of all elements to 0.
     */
    reset() {
        this.status.fill(0);
    }

    /**
     * @returns Returns true if all elements are check the correct amount of times,
     *          otherwise returns false.
     */
    ready() {
        for (let check of this.status) {
            if (check !== this.checkCount) return false;
        }
        return true;
    }

    /**
     * @brief Checks an element.
     * @param index The index of an element to be checked.
     */
    check(index) {
        this.status[index]++;
        if (this.readyCallback !== null && this.ready()) {
            this.reset();
            this.readyCallback();
        }
    }
}

module.exports = StatusChecker;
