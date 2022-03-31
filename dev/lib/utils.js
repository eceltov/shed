function deepCopy(object) {
  return JSON.parse(JSON.stringify(object));
}

/**
 * @brief Takes an array of arrays and returns an array containing all nested elements
 */
function dissolveArrays(arrays) {
  const a = [];
  arrays.forEach((array) => a.push(...array));
  return a;
}

function deepEqual(x, y) {
  if (x === y) {
    return true;
  }
  if ((typeof x === 'object' && x != null) && (typeof y === 'object' && y != null)) {
    if (Object.keys(x).length !== Object.keys(y).length) return false;

    // eslint-disable-next-line no-restricted-syntax
    for (const prop in x) {
      if (y[prop] !== undefined) {
        if (!deepEqual(x[prop], y[prop])) return false;
      }
      else return false;
    }

    return true;
  }
  return false;
}

module.exports = {
  deepCopy, dissolveArrays, deepEqual,
};
