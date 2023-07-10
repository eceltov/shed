const { add, del, newline, remline } = require('../../../controller/lib/subdifOps');
const seedrandom = require('seedrandom');
const fs = require('fs');

const configString = fs.readFileSync(__dirname + '/config.json');
const config = JSON.parse(configString);

const seed = config.seed;
const subdifCountLower = config.subdifCountLower;
const subdifCountUpper = config.subdifCountUpper;

const rng = seedrandom(seed);
let testNumber = 0;

function randomInt(lower, upper) {
  if (upper <= lower) {
    return lower;
  }
  const dif = Math.abs(upper - lower);
  return Math.abs(rng.int32() % (dif + 1)) + lower;
}

function generateTest() {
  const subdifCount = randomInt(subdifCountLower, subdifCountUpper);

  // row of the next subdif added, 2 because 0 is a special case
  let row = 2; 
  
  // Lengths of the document rows. It is assumed that there are only as many rows as subdifs + the start row.
  // Undefined length means that the length can be any number. This can change by newlining and remlining
  const lengths = Array(subdifCount + row).fill(undefined);

  // Minimal lengths of undefined rows. Used when adding and deleting.
  const minLengths = Array(subdifCount + row).fill(0);

  const dif = [];
  let description = '#' + testNumber++ + ' [';

  for (let i = 0; i < subdifCount; i++) {
    if (testNumber === 93) {
      let a = 5;
    }
    const length = lengths[row];
    const minLength = minLengths[row];
    // determine what subdif will be added (do not consider del when the row is empty)
    const subdifType = (length === 0 ? randomInt(1, 3) : randomInt(0, 3));
    let subdif;
    
    // del
    if (subdifType === 0) {
      let position;
      let delLength;
      if (length === undefined) {
        position = randomInt(0, minLength + 1);
        delLength = randomInt(1, 2);
      }
      else {
        position = randomInt(0, length - 1);
        delLength = randomInt(1, length - position);
        lengths[row] -= delLength;
      }
      description += 'del, ';
      subdif = del(row, position, delLength);
      // no need to worry about minLength
    }
    // add
    else if (subdifType === 1) {
      const content = 'a'.repeat(randomInt(1, 2));
      let position;
      if (length === undefined) {
        // the add will be somewhere of the certain range + 1
        position = randomInt(0, minLength + 1);
        minLengths[row] += content.length + 1;
        // the + 1 is from the line above, the minLength does not need to be exact, just not shorter
      }
      else {
        position = randomInt(0, length);
        lengths[row] += content.length;
      }
      description += 'add, ';
      subdif = add(row, position, content);
    }
    // newline
    else if (subdifType === 2) {
      // reorder lengths and minLengths
      for (let j = lengths.length - 1; j > row + 1; j --) {
        lengths[j] = lengths[j - 1];
        minLengths[j] = minLengths[j - 1];
      }
      let position;
      if (length === undefined) {
        position = randomInt(0, minLength + 1);
        // set the min length of the next row based on the current row
        minLengths[row + 1] = (position > minLength ? 0 : minLength - position);
        lengths[row + 1] = undefined;
      }
      else {
        position = randomInt(0, length);
        lengths[row + 1] = length - position;
      }
      lengths[row] = position;
      description += 'newline, ';
      subdif = newline(row, position);
    }
    // remline
    else if (subdifType === 3) {
      let position;
      if (length === undefined) {
        position = randomInt(minLength, minLength + 1);
        lengths[row] = position; // position pre remline
        if (row + 1 < lengths.length && lengths[row + 1] !== undefined) {
          lengths[row] += lengths[row + 1];
        }
        else if (row + 1 < lengths.length && lengths[row + 1] === undefined) {
          minLengths[row] = minLengths[row + 1] + lengths[row];
          lengths[row] = undefined;
        }
        else if (row + 1 >= lengths.length) {
          minLengths[row] = minLengths[row + 1] + lengths[row];
          lengths[row] = undefined;
        }
      }
      else {
        position = length;
        if (row + 1 < lengths.length && lengths[row + 1] !== undefined) {
          lengths[row] = length + lengths[row + 1];
        }
        else if (row + 1 < lengths.length && lengths[row + 1] === undefined) {
          minLengths[row] = minLengths[row + 1] + lengths[row];
          lengths[row] = undefined;
        }
        else if (row + 1 >= lengths.length) {
          minLengths[row] = minLengths[row + 1] + lengths[row];
          lengths[row] = undefined;
        }
      }
      for (let j = row + 1; j < lengths.length - 1; j++) {
        lengths[j] = lengths[j + 1];
        minLengths[j] = minLengths[j + 1];
      }
      description += 'remline, ';
      subdif = remline(row, position);
    }

    if (row > 0) {
      // increase the row by -1, 0 or 1
      row += randomInt(-1, 1);
    }
    else {
      row += randomInt(0, 1);
    }
    dif.push(subdif);
  }

  description = description.substring(0, description.length - 2);
  description += ']';

  return [
    description,
    dif,
  ];
}

function generateTests(testCount) {
  const tests = [];
  for (let i = 0; i < testCount; i++) {
    tests.push(generateTest());
  }
  return tests;
}

module.exports = { generateTests };
