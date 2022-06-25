class StatusChecker {
  constructor(count) {
    this.check = this.check.bind(this);
    this.checkCount = 1;
    this.status = new Array(count).fill(0);
    this.readyCallback = null;

    this.debugging = false;
    this.debugOrder = [];
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
    let ready = true;
    this.status.forEach((check) => {
      if (check !== this.checkCount) ready = false;
    });
    return ready;
  }

  /**
     * @brief Checks an element.
     * @param index The index of an element to be checked.
     */
  check(index) {
    this.debugOrder.push(index);
    this.status[index]++;
    if (this.readyCallback !== null && this.ready()) {
      if (this.debugging) {
        console.log('DEBUG order:', this.debugOrder);
        this.debugOrder = [];
      }
      this.reset();
      this.readyCallback();
    }
  }
}

module.exports = StatusChecker;
