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

/**
 * @brief Logging function for debugging.
 * @param {*} name Name of the object.
 * @param {*} obj Object to be logged.
 * @param {*} mode What kind of object it is. Supported: wDif, wDifs, wHB.
 */
function dlog(name, obj, mode = 'default') {
  if (mode === 'default') {
    console.log(`${name}:`, JSON.stringify(obj));
    console.log();
  }
  else if (mode === 'wDif') {
    console.log(`${name}:`);
    obj.forEach((wrap) => console.log(JSON.stringify(wrap)));
    console.log();
  }
  else if (mode === 'wDifs') {
    console.log(`${name}:`);
    obj.forEach((wDif) => {
      wDif.forEach((wrap) => console.log(JSON.stringify(wrap)));
      console.log('-----------------------------');
    });
    console.log();
  }
  else if (mode === 'wHB') {
    console.log(`${name} (${obj.length}):`);
    obj.forEach((operation) => {
      console.log(JSON.stringify(operation[0]));
      const wDif = operation[1];
      wDif.forEach((wrap) => console.log(JSON.stringify(wrap)));
      console.log('-----------------------------');
    });
    console.log();
  }
  else if (mode === 'SO') {
    console.log(`${name} (${obj.length}):`);
    obj.forEach((metadata) => {
      console.log(JSON.stringify(metadata));
      console.log('-----------------------------');
    });
    console.log();
  }
}

module.exports = {
  deepCopy, dissolveArrays, deepEqual, dlog,
};
