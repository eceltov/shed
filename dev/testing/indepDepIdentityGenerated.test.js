const { add, del, newline, remline } = require('../lib/subdifOps');
const { testIndepDepArray } = require('./primTestingLib');
const seedrandom = require('seedrandom');

const seed = 'seed';
const testCount = 69420;
const subdifCountLower = 2;
const subdifCountUpper = 10;

const rng = seedrandom(seed);
let testNumber = 1;

function randomInt(lower, upper) {
  if (upper <= lower) {
    return lower;
  }
  const dif = Math.abs(upper - lower);
  return Math.abs(rng.int32() % (dif + 1)) + lower;
}



function createTest() {
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
        minLengths[row] += content.length;
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
        minLengths[row + 1] = 2; // the number here does not have a higher meaning, it should just be small
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
        if (row + 1 < lengths.length && lengths[row + 1] !== undefined) {
          minLengths[row] += lengths[row + 1];
        }
        else if (row + 1 >= lengths.length) {
          minLengths[row] += minLengths[row + 1];
        }
      }
      else {
        position = length;
        if (row + 1 < lengths.length && lengths[row + 1] !== undefined) {
          lengths[row] = length + lengths[row + 1];
        }
        else if (row + 1 >= lengths.length) {
          lengths[row] = undefined;
          minLengths[row] = minLengths[row + 1];
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

const tests = [];

for (let i = 0; i < testCount; i++) {
  tests.push(createTest());
}

testIndepDepArray(tests);
