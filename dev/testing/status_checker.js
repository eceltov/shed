class StatusChecker {
    constructor(count) {
        this.check = this.check.bind(this);
        this.status = new Array(count).fill(false);
        this.readyCallback = null;
    }

    /**
     * @brief Sets a callback that will be invoked after the last unchecked element is checked.
     */
    setReadyCallback(callback) {
        this.readyCallback = callback;
    }

    /**
     * @brief Unchecks all elements.
     */
    reset() {
        this.status.fill(false);
    }

    /**
     * @returns Returns true if all elements are checked, otherwise returns false.
     */
    ready() {
        for (let check of this.status) {
            if (!check) return false;
        }
        return true;
    }

    /**
     * @brief Checks an element.
     * @param index The index of an element to be checked.
     */
    check(index) {
        this.status[index] = true;
        if (this.readyCallback !== null && this.ready()) {
            this.readyCallback();
        }
    }
}

module.exports = StatusChecker;
