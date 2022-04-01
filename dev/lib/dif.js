/* eslint-disable object-property-newline */
/* eslint-disable object-curly-newline */
/**
 * @note Dif definition: A dif is an array of primitive operations called subdifs.
   A primitive operation can be adding newlines (called newline), removing empty lines (called
   remlines), adding text (called add) deleting text (called del) or moving text to
   a different location (called move).

    Subdif structure:
    - newline: x; where x is a positive integer or zero saying that a new row should be added at
      index x. Example: applying the subdif 1 means that row 0 will not be changed, rows 1, 2, ...
      will have their index incremented by one and the new row with index 1 will be empty.

    - remline: x; where x is a negative integer saying that the row with index -x should be
      deleted and all following rows should have their index decremented by one. The row with
      index -x must be empty.

    - add: [row, position, content]; where row and position are positive integers or zeroes and
      content is a string. Example: applying the subdif [2, 1, 'abc'] means that the string 'abc'
      will be inserted between the first and second character on the row with index 2

    - del: [row, position, count]; where all variables are positive integers or zeroes.
      Example: applying the subdif [3, 1, 4] where the content of row 3 is '123456789'
      will result in the new content of row 3 being '16789' (4 characters after
         the 1st will be removed).

    - move: [sourceRow, sourcePosition, targetRow, targetPosition, length]; where all
        variables are positive integers or zeroes.
      Example: let the content on row 0 be "1234" and content on row 1 be "abcd". Applying
      the subdif [0, 1, 1, 2, 2] will result in row 0 being "14" and row 1 being "ab23cd".
      For sake of implementation simplicity, it is assumed
      that the move instruction cannot move content on the same row.

    Example dif: [2, -3, [1, 2, 'abc'], [3, 3, 1]]

 *  @note Operation definition: An operation is an array with two elements. The first is an array
    containing user transaction metadata (userID, commitSerialNumber, preceding userID,
    preceding commitSerialNumber) and the second element is a dif describing the changes
    made by the author.

    Note that an operation contains enough information to determine its total ordering.

 *  @note Server ordering (SO): Server ordering is defined by the order the server relays
    operations to other users. The operation are received by all users in the same order,
    therefore server ordering stays the same for all users.

 *  @note Direct dependancy: An operation is directly dependant on the operation described by its
    preceding userID and preceding commitSerialNumber and all operations before that in server
    ordering.

 *  @note Local dependancy: An operation is locally dependant on all previous operations made by
    the same user. Note that local dependancy may contain operations not included in direct
    dependancy. This happens when a user sends multiple operations before receiving them from
    the server, as these operations may all have the same preceding userID and preceding
    commitSerialNumber.

 *  @note An operation is only dependant an all directly and locally dependant operations.
    All other operations are independant.

 *  @note Total ordering:
    Given the operations A and B: A => B (B directly follows A) if and only if:
    1) B is not part of a message chain and A is the last member of it's message chain.
    Or
    2) B is part of a message chain and A is the previous member of the message chain.

    Given the operations A and B: A *=> B (B follows A) if and only if:
    1) A => B
    OR
    2) There exist an operation C, such that A *=> C => B
*/

const { IT, ET } = require('./primitiveTransformations');
const { isAdd, isDel, isMove, isNewline, isRemline, wrapDif, unwrapSubdif } = require('./subdifOps');
const { checkRA, checkBO, convertAA } = require('./metaOps');
const { deepCopy, deepEqual } = require('./utils');

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

function changeCursorPosition(cursorPosition, wOperation) {
  if (cursorPosition === null) return;
  let { row } = cursorPosition;
  let position = cursorPosition.column;
  wOperation[1].forEach((wrap) => {
    if (isNewline(wrap) && wrap.sub <= row) {
      row++;
    }
    if (isRemline(wrap) && -wrap.sub <= row) {
      row--;
    }
    if (
      isMove(wrap)
      && row === wrap.sub[0]
      && position > wrap.sub[1]
      && position <= wrap.sub[1] + wrap.sub[4]
    ) {
      const cursorOffset = position - wrap.sub[1];
      row = wrap.sub[2];
      position = wrap.sub[3] + cursorOffset;
    }
  });
  cursorPosition.row = row;
}

/**
 * @brief Finds the server ordering index of an operation.
 * @param {*} operation The input operation.
 * @param {*} SO The server ordering.
 * @returns Returns the index.
 */
function SOIndex(operation, SO) {
  return SO.findIndex((entry) => entry[0] === operation[0][0] && entry[1] === operation[0][1]);
}

/**
 * @brief Finds the index in HB at which a non present operation should be placed.
 * @param {*} dMessage The operation whose TO index is being determined.
 * @param {*} HB The history buffer.
 * @param {*} SO The server ordering.
 * @returns Returns the index.
 */
function findTotalOrderingHBIndex(dMessage, HB, SO) {
  let totalOrderingIndex = 0;
  // handling the case when the message is part of a 'message chain'
  // if it is, it will be placed directly after the previous message in the chain (in HB)
  for (let i = 0; i < HB.length; i++) {
    const operation = HB[i];
    // message is part of a chain
    if (
      dMessage[0][0] === operation[0][0]
      && dMessage[0][2] === operation[0][2]
      && dMessage[0][3] === operation[0][3]
    ) {
      totalOrderingIndex = i + 1;
    }
  }

  // handling the case when the message is not part of a 'message chain'
  // in this case, the message is placed according to total ordering
  // the strategy is to take operations from HB from the back and determine their total ordering
  // if the operation in HB is part of a message chain, and it's first member is present in SO,
  //   then the received message will be placed after the last message chain member (the message
  //   chain effectively shares it's first member's SO)
  if (totalOrderingIndex === 0) {
    for (let i = HB.length - 1; i >= 0; i--) {
      const operation = HB[i];
      const operationSOIndex = SOIndex(operation, SO);
      let partOfChain = false;

      // the operation is not in SO, but it could be part of a chain
      if (operationSOIndex === -1) {
        // look from the beginning of HB to find the first member of the message chain, if any
        // if the first member is present in SO, than the message has to be
        //    placed after the last message chain member
        for (let j = 0; j < i; j++) {
          const chainMember = HB[j];
          if (
            chainMember[0][0] === operation[0][0]
            && chainMember[0][2] === operation[0][2]
            && chainMember[0][3] === operation[0][3]
          ) {
            // the operation is a part of a chain, but it could be a chain that has
            //    not yet arrived (not a single member)
            // in this case, the message chain will be placed after the message according
            //    to total ordering
            if (SOIndex(chainMember, SO) === -1) {
              break;
            }
            // the operation is a part of a chain that partially arrived
            partOfChain = true;
            break;
          }
        }
      }

      // the operation is not present in SO and is not part of a chain,
      //    therefore it will be ordered after the message
      if (!partOfChain && operationSOIndex === -1) {
        continue;
      }

      // the operation is present in SO or is part of a chain that at least partially arrived,
      //    therefore it has to be placed before the message because the HB is iterated over
      //    from the back and this is the first occurence of such an operation,
      //    the message must be placed directly after it
      totalOrderingIndex = i + 1;
      break;
    }
  }

  return totalOrderingIndex;
}

/**
 * @brief Finds the last HB index of an operation that is either locally or
 *  directly dependant on the input.
 * @param {*} operation The input operation.
 * @param {*} HB The history buffer.
 * @returns Returns the index.
 */
function findLastDependancyIndex(operation, HB) {
  const user = operation[0][0];
  // the user the operation is directly dependant on
  const directDependancyUser = operation[0][2];
  // the commitSerialNumber the operation is directly dependant on
  const directDependancyCSN = operation[0][3];

  let DDIndex = -1;
  let LDIndex = -1;

  // find the last locally dependant operation and the last directly dependant operation
  HB.forEach((op, i) => {
    if (op[0][0] === directDependancyUser && op[0][1] === directDependancyCSN) {
      DDIndex = i;
    }
    if (
      op[0][0] === user
      && op[0][2] === directDependancyUser
      && op[0][3] === directDependancyCSN
    ) {
      LDIndex = i;
    }
  });
  return Math.max(DDIndex, LDIndex);
}

/**
 * @brief Finds the first HB index of an operation that is locally dependant on the input.
 * @param {*} operation The input operation.
 * @param {*} HB The history buffer.
 * @returns Returns the index.
 */
function findFirstLocalDependancyIndex(operation, HB) {
  const userID = operation[0][0];
  // the user the operation is directly dependant on
  const directDependancyUser = operation[0][2];
  // the commitSerialNumber the operation is directly dependant on
  const directDependancyCSN = operation[0][3];

  for (let i = 0; i < HB.length; i++) {
    if (
      HB[i][0][0] === userID
      && HB[i][0][2] === directDependancyUser
      && HB[i][0][3] === directDependancyCSN
    ) {
      return i;
    }
  }
  return -1;
}

/**
 * @brief Finds the HB index of an operation.
 * @param {*} operation The input operation.
 * @param {*} HB The history buffer.
 * @returns Returns the index.
 */
/* TODO: is this used anywhere?
function HBIndex(operation, HB) {
  return HB.findIndex((entry) => (
    entry[0][0] === operation[0][0] && entry[0][1] === operation[0][1]
  ));
}
*/

/* TODO: is this used anywhere?
function identicalSubdifs(subdif1, subdif2) {
  if (typeof subdif1 === 'number' && typeof subdif2 === 'number') {
    return subdif1 === subdif2;
  }
  if (typeof subdif1 === 'number' || typeof subdif2 === 'number') {
    return false;
  }
  if (subdif1.length !== subdif2.length) {
    return false;
  }
  for (let i = 0; i < subdif2.length; i++) {
    if (subdif1[i] !== subdif2[i]) {
      return false;
    }
  }
  return true;
}
*/

function LIT(wDif, wTransformationDif, log = false) {
  if (wDif.length === 0) return [];
  if (wTransformationDif.length === 0) return wDif;
  const wTransformedSubdifs1 = LIT1(wDif[0], wTransformationDif, log);
  const wTransformedSubdifs2 = LIT(
    wDif.slice(1), [...wTransformationDif, ...wTransformedSubdifs1],
  );
  return [...wTransformedSubdifs1, ...wTransformedSubdifs2];
}
function LIT1(wrapOriginal, wTransformationDif, log = false) {
  let wTransformedSubdifs = [];
  const wrap = deepCopy(wrapOriginal);
  if (wTransformationDif.length === 0) {
    wTransformedSubdifs = [wrap];
  }
  // if the wrap is relatively addressed and the transformer is not the target, then skip it
  else if (checkRA(wrap) && !checkBO(wrap, wTransformationDif[0])) {
    wTransformedSubdifs = LIT1(wrap, wTransformationDif.slice(1), log);
  }
  else if (checkRA(wrap) && checkBO(wrap, wTransformationDif[0])) {
    convertAA(wrap, wTransformationDif[0]);
    wTransformedSubdifs = LIT1(wrap, wTransformationDif.slice(1));
  }
  else {
    wTransformedSubdifs = LIT(
      IT(wrap, wTransformationDif[0]), wTransformationDif.slice(1), log,
    );
  }
  return wTransformedSubdifs;
}

function LET(wDif, wTransformationDif, log) {
  if (wDif.length === 0) return [];
  if (wTransformationDif.length === 0) return wDif;
  const wTransformedSubdifs1 = LET1(wDif[0], wTransformationDif, log);
  const wTransformedSubdifs2 = LET(wDif.slice(1), wTransformationDif, log);
  return [...wTransformedSubdifs1, ...wTransformedSubdifs2];
}
function LET1(wrapOriginal, wTransformationDif, log) {
  let wTransformedSubdifs = [];
  const wrap = deepCopy(wrapOriginal);
  if (wTransformationDif.length === 0) {
    wTransformedSubdifs = [wrap];
  }
  else if (checkRA(wrap)) {
    wTransformedSubdifs = [wrap];
  }
  else {
    wTransformedSubdifs = LET(
      ET(wrap, wTransformationDif[0]), wTransformationDif.slice(1), log,
    );
  }
  return wTransformedSubdifs;
}

/**
 * @brief Takes a wDif of chronologically dependant subdifs and
 *    returns a new wDif of independant subdifs.
 */
function makeIndependant(wDif) {
  const wDifCopy = deepCopy(wDif);
  const wDifReversed = deepCopy(wDif).reverse();
  const wIndependantDif = [];
  for (let i = 0; i < wDif.length; i++) {
    const wrap = wDifCopy[i];
    const wdTransformedDif = LET(
      [wrap], wDifReversed.slice(wDifReversed.length - i),
    ); // LET can return multiple subdifs

    wIndependantDif.push(...wdTransformedDif);
  }
  return wIndependantDif;
}

/**
 * @brief Takes a wDif of independant subdifs and returns
 *   a new wDif of chronologically dependant subdifs.
 */
function makeDependant(wDif) {
  const wDifCopy = deepCopy(wDif);
  const wDependantSubdifs = LIT(wDifCopy.slice(1), [wDifCopy[0]]);
  return [wDifCopy[0], ...wDependantSubdifs];
}

function applyAdd(previousValue, subdif) {
  if (subdif[1] > previousValue.length) {
    console.log('applyAdd subdif position too large!');
    console.log(subdif);
    console.log(previousValue);
    return previousValue;
  }

  return (previousValue.substring(0, subdif[1]) + subdif[2] + previousValue.substring(subdif[1]));
}

function applyDel(previousValue, subdif) {
  if (subdif[1] + subdif[2] > previousValue.length) {
    console.log('applyDel subdif position too large!');
    console.log(previousValue);
    console.log(subdif);
    return previousValue;
  }

  return (previousValue.substring(0, subdif[1])) + previousValue.substring(subdif[1] + subdif[2]);
}

/**
 * @brief Converts text to a dif.
 *
 * @param targetRow The row where the text is being added.
 * @param targetPosition The position at which the text is being added.
 * @param content An array of lines to be converted.
 * @param trailingRowText The text after the cursor.
 *
 * @returns Returns the final dif.
 */
function textToDif(targetRow, targetPosition, content, trailingRowText) {
  const dif = [];

  // add all neccessary newlines
  for (let i = 0; i < content.length - 1; ++i) {
    dif.push(targetRow + 1);
  }

  // add the first line
  if (content[0]) {
    dif.push([targetRow, targetPosition, content[0]]);
  }

  // add the remaining lines
  for (let i = 1; i < content.length; ++i) {
    dif.push([targetRow + i, 0, content[i]]);
  }

  // move trailing row text
  if (trailingRowText) {
    dif.push([
      targetRow,
      targetPosition + content[0].length,
      targetRow + content.length - 1,
      content[content.length - 1].length,
      trailingRowText.length,
    ]);
  }

  return dif;
}

function applyDifAce(wDif, document) {
  wDif.forEach((wrap) => {
    const subdif = wrap.sub;
    if (isAdd(subdif)) {
      document.insert({ row: subdif[0], column: subdif[1] }, subdif[2]);
    }
    else if (isDel(subdif)) {
      document.removeInLine(subdif[0], subdif[1], subdif[1] + subdif[2]);
    }
    else if (isMove(subdif)) {
      /* // the move is a simple newline in the middle of a line
      if (subdif[0] === subdif[2] - 1 && subdif[3] === 0) {
        document.insertMergedLines({ row: subdif[0], column: subdif[1] }, ['', '']);
      } */
      /// TODO: this does not translate to a move instruction in ManagedSession.handleChange
      // else {
      const movedText = document.getLine(subdif[0]).substr(subdif[1], subdif[4]);
      document.insert({ row: subdif[2], column: subdif[3] }, movedText);
      document.removeInLine(subdif[0], subdif[1], subdif[1] + subdif[4]);
      // }
    }
    else if (isNewline(subdif)) {
      document.insertNewLine({ row: subdif, column: 0 });
    }
    else if (isRemline(subdif) && !wrap.meta.informationLost) {
      document.removeNewLine(-subdif - 1);
    }
    else if (isRemline(subdif) && wrap.meta.informationLost) {
      // do nothing
    }
    else {
      console.log('Received unknown subdif!', subdif);
    }
  });
  return document;
}

function undoDifAce(wDif, document) {
  const wDifCopy = deepCopy(wDif);
  wDifCopy.reverse(); // subdifs need to be undone in reverse order
  wDifCopy.forEach((wrap) => {
    const subdif = wrap.sub;
    if (isAdd(subdif)) {
      document.removeInLine(subdif[0], subdif[1], subdif[1] + subdif[2].length);
    }
    else if (isDel(subdif)) {
      document.insert({ row: subdif[0], column: subdif[1] }, '#'.repeat(subdif[2]));
    }
    else if (isMove(subdif)) {
      const movedText = document.getLine(subdif[2]).substr(subdif[3], subdif[4]);
      document.insert({ row: subdif[0], column: subdif[1] }, movedText);
      document.removeInLine(subdif[2], subdif[3], subdif[3] + subdif[4]);
    }
    else if (isNewline(subdif)) {
      document.removeNewLine(subdif - 1);
    }
    else if (isRemline(subdif)) {
      document.insertNewLine({ row: -subdif, column: 0 });
    }
    else {
      console.log('Received unknown dif!');
    }
  });
  return document;
}

function applyDifTest(wDif, document) {
  wDif.forEach((wrap) => {
    // console.log('applyDifTest:', JSON.stringify(document));
    const subdif = unwrapSubdif(wrap);
    // console.log('applyDifTestSubdif:', JSON.stringify(subdif));
    if (isAdd(subdif)) {
      const row = document[subdif[0]];
      document[subdif[0]] = row.substr(0, subdif[1]) + subdif[2] + row.substr(subdif[1]);
    }
    else if (isDel(subdif)) {
      const row = document[subdif[0]];
      document[subdif[0]] = row.substr(0, subdif[1]) + row.substr(subdif[1] + subdif[2]);
    }
    else if (isMove(subdif)) {
      const sourceRow = document[subdif[0]];
      const targetRow = document[subdif[2]];
      const movedText = sourceRow.substr(subdif[1], subdif[4]);

      document[subdif[0]] = sourceRow.substr(0, subdif[1])
        + sourceRow.substr(subdif[1] + subdif[4]);

      document[subdif[2]] = targetRow.substr(0, subdif[3])
        + movedText + targetRow.substr(subdif[3]);
    }
    else if (isNewline(subdif)) {
      document.splice(subdif, 0, '');
    }
    /// TODO: don't forget to implement the information lost bit in the live version
    else if (isRemline(subdif) && !wrap.meta.informationLost) {
      document.splice(-subdif, 1);
    }
    else if (isRemline(subdif) && wrap.meta.informationLost) {
      // do nothing
    }
    else {
      console.log('Received unknown subdif!', subdif);
    }
  });
  return document;
}

function undoDifTest(wDif, document) {
  const wDifCopy = deepCopy(wDif);
  wDifCopy.reverse(); // subdifs need to be undone in reverse order
  wDifCopy.forEach((wrap) => {
    const subdif = wrap.sub;
    if (isAdd(subdif)) {
      const row = document[subdif[0]];
      document[subdif[0]] = row.substr(0, subdif[1]) + row.substr(subdif[1] + subdif[2].length);
    }
    else if (isDel(subdif)) {
      const row = document[subdif[0]];
      document[subdif[0]] = row.substr(0, subdif[1]) + '#'.repeat(subdif[2]) + row.substr(subdif[1]);
    }
    else if (isMove(subdif)) {
      const sourceRow = document[subdif[2]];
      const targetRow = document[subdif[0]];
      const movedText = sourceRow.substr(subdif[3], subdif[4]);

      document[subdif[2]] = sourceRow.substr(0, subdif[3])
        + sourceRow.substr(subdif[3] + subdif[4]);

      document[subdif[0]] = targetRow.substr(0, subdif[1])
        + movedText + targetRow.substr(subdif[1]);
    }
    else if (isNewline(subdif)) {
      document.splice(subdif, 1);
    }
    else if (isRemline(subdif)) {
      document.splice(-subdif, 0, '');
    }
    else {
      console.log('Received unknown dif!');
    }
  });
  return document;
}

/**
 * @brief Applies a wDif to the document. The document can be an
 *  Ace document or an array of strings.
 * @param {*} wDif A wDif to be applied.
 * @param {*} document The document to which the wDif will be applied to.
 * @returns Returns the new document.
 */
function applyDif(wDif, document) {
  if (document.constructor === Array) {
    return applyDifTest(wDif, document);
  }

  return applyDifAce(wDif, document);
}

/**
 * @brief Undoes a wDif from the document. The document can be an
 *  Ace document or an array of strings.
 * @note Undoing Dels will result in the insertion of '#'s instead of the
 *  previously deleted characters.
 * @param {*} wDif A wDif to be undone.
 * @param {*} document The document from which the wDif will be undone.
 * @returns Returns the new document.
 */
function undoDif(wDif, document) {
  if (document.constructor === Array) {
    return undoDifTest(wDif, document);
  }

  return undoDifAce(wDif, document);
}

/**
 * @brief The General Operation Transformation Control Algorithm. Transforms an operation so that
 *        it is dependant on the last HB entry.
 * @param {*} wdMessage A wrapped operation to be transformed.
 * @param {*} wdHB The wrapped HB against which to transform.
 * @param {*} SO The serverOrdering agains which to transform.
 * @param {*} log Whether to print out debug messages to the console.
 * @returns Returns the wrapped transformed operation.
 */
function GOTCA(wdMessage, wdHB, SO, log = false) {
  /**
     *  @note Due to the fact that all operations are being received by all clients in the same
         order, the only independant operations from the received one can be those made by the
        local client after the received ones generation, as all others are present in the context
        of the received operation.
    */

  // array of difs of independant operations in HB
  const wdIndependantDifs = [];
  // causally preceding difs with an index higher than last_directly_dependant_index
  let wdLocallyDependantDifs = [];
  const locallyDependantIndices = [];

  const lastDirectlyDependantIndex = SO.findIndex((operation) => (
    operation[0] === wdMessage[0][2] && operation[1] === wdMessage[0][3]));

  let lastDirectlyDependantHBIndex = -1;

  // finding independant and locally dependant operations in HB
  for (let i = 0; i < wdHB.length; i++) {
    let directlyDependant = false;
    // filtering out directly dependant operations
    for (let j = 0; j <= lastDirectlyDependantIndex; j++) {
      // deep comparison between the HB operation metadata and SO operation metadata
      if (deepEqual(wdHB[i][0], SO[j])) {
        directlyDependant = true;
        lastDirectlyDependantHBIndex = i;
        break;
      }
    }
    if (directlyDependant) continue;

    // locally dependant operations have the same author
    if (wdHB[i][0][0] === wdMessage[0][0]) {
      locallyDependantIndices.push(i);
      wdLocallyDependantDifs.push(wdHB[i][1]);
      continue;
    }

    // the remainder must be independant
    wdIndependantDifs.push(wdHB[i][1]);
  }

  if (log) dlog('wdIndependantDifs', wdIndependantDifs, 'wDifs');

  if (log) dlog('wdLocallyDependantDifs', wdLocallyDependantDifs, 'wDifs');

  // there are no independant messages, therefore no transformation is needed
  if (wdIndependantDifs.length === 0) {
    if (log) console.log('GOTCA no independant messages');
    return wdMessage;
  }

  const wdMessageDif = wdMessage[1];
  const wiMessageDif = makeIndependant(wdMessageDif);

  // there are no locally dependant operations in HB, therefore all independant
  // operations can be included directly
  /// TODO: or if all locally dependant difs are empty
  if (wdLocallyDependantDifs.length === 0) {
    if (log) console.log('GOTCA no locally dependant ops');
    const wdTransformationDif = [];
    wdIndependantDifs.forEach((wdDif) => wdTransformationDif.push(...wdDif));
    const wTransformedMessageDif = LIT(wiMessageDif, wdTransformationDif);
    wdMessage[1] = wTransformedMessageDif;
    return wdMessage;
  }

  // preparing difs for transformation
  wdLocallyDependantDifs = deepCopy(wdLocallyDependantDifs);

  const dependantHBIndex = findLastDependancyIndex(wdMessage, wdHB);
  const wdReversedTransformerDifs = [];
  for (let i = dependantHBIndex; i > lastDirectlyDependantIndex; i--) {
    const wdDif = deepCopy(wdHB[i][1]);
    wdDif.reverse();
    wdReversedTransformerDifs.push(wdDif);
  }

  // if(log) console.log('wdLocallyDependantDifs:', JSON.stringify(wdLocallyDependantDifs));
  // if(log) console.log('wdReversedTransformerDifs:', JSON.stringify(wdReversedTransformerDifs));

  // [..., last_dep_index=20, indep1, indep2, loc_dep0=23, indep3, loc_dep1=25]

  // transformation
  const wdTransformedDifs = []; // EOL' in wrapped dif form
  let wdLETDif = dissolveArrays(wdReversedTransformerDifs.slice(
    wdReversedTransformerDifs.length
    - (locallyDependantIndices[0]
    - (lastDirectlyDependantIndex + 1)),
  ));
  const wdLITDif = [];
  if (log) dlog('wdLocallyDependantDifs[0]', wdLocallyDependantDifs[0], 'wDif');

  const wiFirstTransformedDif = LET(
    makeIndependant(wdLocallyDependantDifs[0]), wdLETDif,
  );

  // this now has mutually independant subdifs, they need to be made dependant
  const wdFirstTransformedDif = makeDependant(wiFirstTransformedDif);
  if (log) dlog('wdFirstTransformedDif', wdFirstTransformedDif, 'wDif');
  wdTransformedDifs.push(wdFirstTransformedDif);
  for (let i = 1; i < wdLocallyDependantDifs.length; i++) {
    wdLETDif = dissolveArrays(wdReversedTransformerDifs.slice(
      wdReversedTransformerDifs.length
      - (locallyDependantIndices[i]
      - (lastDirectlyDependantIndex + 1)),
    ));

    // this is also mutually independant
    const wiIndependantExcludedDif = LET(
      makeIndependant(wdLocallyDependantDifs[i]), wdLETDif,
    );
    wdLITDif.push(...wdTransformedDifs[i - 1]);
    const wdTransformedDif = LIT(wiIndependantExcludedDif, wdLITDif);
    wdTransformedDifs.push(wdTransformedDif);
  }
  const wdReversedTransformedDifs = deepCopy(wdTransformedDifs);
  wdReversedTransformedDifs.reverse();
  wdReversedTransformedDifs.forEach((wdDif) => wdDif.reverse());
  if (log) dlog('wdReversedTransformedDifs', wdReversedTransformedDifs, 'wDifs');
  if (log) dlog('wiMessageDif', wiMessageDif, 'wDif');

  const wiExcludedMessageDif = LET(
    wiMessageDif, dissolveArrays(wdReversedTransformedDifs),
  );

  if (log) dlog('wiExcludedMessageDif', wiExcludedMessageDif, 'wDif');

  // independant difs between the last directly and first locally dependant dif
  const prependingIndependantDifs = wdHB.slice(
    lastDirectlyDependantIndex + 1, findFirstLocalDependancyIndex(wdMessage, wdHB),
  );
  prependingIndependantDifs.forEach((operation, index) => {
    prependingIndependantDifs[index] = operation[1];
  });

  const wdHBLITDif = [];
  for (let i = lastDirectlyDependantHBIndex + 1; i < wdHB.length; i++) {
    wdHBLITDif.push(...wdHB[i][1]);
  }
  if (log) dlog('wdHBLITDif', wdHBLITDif, 'wDif');
  const wdTransformedMessageDif = LIT(wiExcludedMessageDif, wdHBLITDif);
  wdMessage[1] = wdTransformedMessageDif;
  if (log) console.log('GOTCA full run');
  return wdMessage;
}

/// TODO: remove HB = [...HB, operation], too slow
/**
 * @brief The undo/do/redo algorithm. Applies a message to a document.
 * @param {*} dMessage An operation to be applied.
 * @param {*} document The document which is about to be changed.
 * @param {*} wdInitialHB The wrapped HB corresponding to the current document.
 * @param {*} initialSO The serverOrdering corresponding to the current document.
 * @param {*} log Whether to print out debug messages to the console.
 * @returns Returns an object: { document, HB }, containing the new document and updated HB.
 */
function UDR(
  dMessage, document, wdInitialHB, initialSO, log = false, cursorPosition = null,
) {
  if (log) console.log('before:', document);
  let wdHB = deepCopy(wdInitialHB);
  const SO = [...initialSO, dMessage[0]];

  if (log) console.log('message:', dMessage);

  // find the total ordering of the message relative to the local HB and SO
  const undoIndex = findTotalOrderingHBIndex(dMessage, wdHB, SO);

  if (log) console.log('undoIndex:', undoIndex);
  if (log) dlog('wdHB', wdHB, 'wHB');
  if (log) dlog('SO', SO, 'SO');

  const wdMessage = [dMessage[0], wrapDif(dMessage[1])];

  // case when no operations need to be undone, only the message is transformed and directly applied
  if (undoIndex === wdHB.length) {
    if (log) console.log('UDR no ops need to be undone');
    const wdTransformedMessage = GOTCA(wdMessage, wdHB, SO, log);
    if (log) dlog('wdTransformedMessage', wdTransformedMessage[1], 'wDif');

    document = applyDif(wdTransformedMessage[1], document);
    changeCursorPosition(cursorPosition, wdTransformedMessage);

    if (log) console.log('after:', document);

    return {
      document,
      HB: [...wdHB, wdTransformedMessage],
    };
  }

  // undoing independant operations
  const wdUndoneHB = wdHB.slice(undoIndex);
  wdHB = wdHB.slice(0, undoIndex);
  for (let i = wdUndoneHB.length - 1; i >= 0; i--) {
    document = undoDif(wdUndoneHB[i][1], document);
  }

  if (log) console.log('undo independant ops:', document);
  if (log) dlog('wdUndoneHB', wdUndoneHB, 'wHB');

  // transforming and applying message

  // giving GOTCA only the relevant part of HB (from start to the last dependant operation)
  const wdTransformedMessage = GOTCA(wdMessage, wdHB, SO, log);
  document = applyDif(wdTransformedMessage[1], document);
  changeCursorPosition(cursorPosition, wdTransformedMessage);

  if (log) dlog('wdTransformedMessage', wdTransformedMessage[1], 'wDif');

  // creating a list of undone difs for transformation
  const wdUndoneDifs = [];
  for (let i = 0; i < wdUndoneHB.length; i++) {
    wdUndoneDifs.push(deepCopy(wdUndoneHB[i][1]));
  }

  if (log) dlog('wdUndoneDifs', wdUndoneDifs, 'wDifs');

  // creating a list of undone difs but reversed
  const wdReversedUndoneDifs = [];
  for (let i = wdUndoneHB.length - 1; i >= 0; i--) {
    const wdUndoneDif = deepCopy(wdUndoneHB[i][1]);
    wdUndoneDif.reverse();
    wdReversedUndoneDifs.push(wdUndoneDif);
  }

  // transforming undone difs
  const wdTransformedUndoneDifs = []; // undone difs that are transformed
  const wiFirstUndoneDif = makeIndependant(wdUndoneDifs[0]);
  if (log) dlog('wiFirstUndoneDif', wiFirstUndoneDif, 'wDif');

  // the first one is only transformed agains the message
  const wdFirstTransformedUndoneDif = LIT(wiFirstUndoneDif, wdTransformedMessage[1]);
  if (log) dlog('wdFirstTransformedUndoneDif', wdFirstTransformedUndoneDif, 'wDif');
  wdTransformedUndoneDifs.push(wdFirstTransformedUndoneDif);
  const wdLETDif = []; // chronologically reversed
  const wdLITDif = [...wdTransformedMessage[1]];
  for (let i = 1; i < wdUndoneDifs.length; i++) {
    // excluding the older undone difs so that the message
    // and all transformed older undone difs can be included
    wdLETDif.unshift(...wdReversedUndoneDifs[wdReversedUndoneDifs.length - i]);
    const wiUndoneDif = makeIndependant(wdUndoneDifs[i]);
    const wiExcludedDif = LET(wiUndoneDif, wdLETDif);

    // including the message and transformed older undone difs
    wdLITDif.push(...wdTransformedUndoneDifs[i - 1]);
    const wdTransformedUndoneDif = LIT(wiExcludedDif, wdLITDif, log);
    wdTransformedUndoneDifs.push(wdTransformedUndoneDif);
  }

  if (log) dlog('wdTransformedUndoneDifs', wdTransformedUndoneDifs, 'wDifs');

  // redoing transformed undone difs
  wdTransformedUndoneDifs.forEach((wdDif) => {
    document = applyDif(wdDif, document);
  });

  // creating operations from undone difs (for HB)
  const wdTransformedUndoneOperations = [];
  wdTransformedUndoneDifs.forEach((wDif, i) => {
    const wdTransformedOperation = [wdUndoneHB[i][0], wDif];
    wdTransformedUndoneOperations.push(wdTransformedOperation);
  });

  // pushing the message and transformed undone difs to HB
  wdHB.push(wdTransformedMessage);
  wdTransformedUndoneOperations.forEach((wdOperation) => wdHB.push(wdOperation));

  if (log) console.log('UDR full run');
  if (log) console.log('after:', document);
  if (log) console.log();

  return {
    document,
    HB: wdHB,
  };
}

module.exports = {
  changeCursorPosition, applyAdd, applyDel, textToDif, applyDifAce, UDR,
  makeDependant, makeIndependant, LIT, LET, // these are exported for tesing purposes only
};
