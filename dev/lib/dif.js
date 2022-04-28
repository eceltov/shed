/* eslint-disable object-property-newline */
/* eslint-disable object-curly-newline */

const { IT, ET } = require('./primitiveTransformations');
const { isAdd, isDel, isNewline, isRemline, wrapDif, unwrapSubdif, add, newline } = require('./subdifOps');
const { checkRA, checkBO, convertAA } = require('./metaOps');
const { deepCopy, deepEqual, dissolveArrays, dlog } = require('./utils');

function changeCursorPosition(cursorPosition, wOperation) {
  if (cursorPosition === null) return;
  let row = cursorPosition.row;
  let position = cursorPosition.column;
  wOperation[1].forEach((wrap) => {
    if (isNewline(wrap)) {
      if (wrap.sub[0] < row) {
        row++;
      }
      else if (wrap.sub[0] === row && position >= wrap.sub[1]) {
        row++;
        position += wrap.sub[1];
      }
    }
    if (isRemline(wrap)) {
      if (wrap.sub[0] < row - 1) {
        row--;
      }
      else if (wrap.sub[0] === row - 1) {
        row--;
        position += wrap.sub[1];
      }
    }
  });
  cursorPosition.row = row;
  cursorPosition.column = position;
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
  const wdTransformedDif = [];
  // array of wraps, updated after each applied transformer, because transformed wraps
  // may fall apart
  let wraps = [...wDif];
  // LIT makes dependent wraps, therefore finished wraps made in the previous steps are
  // added to the transformer. A shallow copy of the original transformer is made.
  const wNewTransformationDif = [...wTransformationDif];
  // the number of completed transformations (how many elements of the transformer have been
  // applied)
  let transformations = 0;
  while (wraps.length > 0) {
    for (let i = transformations; i < wNewTransformationDif.length; i++, transformations++) {
      // proxy wrap array so that one transformation step always works with the same data
      const newWraps = [];
      // apply a transformer to each wrap
      wraps.forEach((wrap) => {
        if (checkRA(wrap) && !checkBO(wrap, wNewTransformationDif[i])) {
          newWraps.push(wrap);
        }
        else if (checkRA(wrap) && checkBO(wrap, wNewTransformationDif[i])) {
          convertAA(wrap, wNewTransformationDif[i]);
          newWraps.push(wrap);
        }
        else {
          newWraps.push(...IT(wrap, wNewTransformationDif[i]));
        }
      });
      // update wraps
      wraps = newWraps;
    }
    // the end of the for cycle signals that the first wrap of @wraps was fully transformed,
    // however, more wraps might have spawned. The new wraps need to be transformed against the
    // first one, so it is pushed to the respective arrays and is removed from @wraps.
    // In order to not transform the wraps agains a transformer multiple times, the for cycle
    // will start at the first transformer not yet applied (the first wrap).
    wNewTransformationDif.push(wraps[0]);
    wdTransformedDif.push(wraps[0]);
    wraps.splice(0, 1);
  }
  return wdTransformedDif;
}

/**
 * @brief Excludes a dif from another dif.
 * @param {*} wDif The dif to be transformed.
 * @param {*} wTransformationDif The dif to be excluded. This dif should be chronologically
 *  reversed, so that the application of the first subdif of this dif resulted in the final document
 *  state from which the dif to be transformed was generated.
 * @param {*} log Whether this function should log.
 * @returns Returns the transformed dif.
 */
function LET(wDif, wTransformationDif, log) {
  if (wDif.length === 0) return [];
  if (wTransformationDif.length === 0) return wDif;
  const wiTransformedDif = [];
  wDif.forEach((originalWrap) => {
    let wraps = [originalWrap];
    for (let i = 0; i < wTransformationDif.length; i++) {
      const newWraps = [];
      wraps.forEach((wrap) => {
        if (checkRA(wrap)) {
          newWraps.push(wrap);
        }
        else {
          newWraps.push(...ET(wrap, wTransformationDif[i]));
        }
      });
      wraps = newWraps;
    }
    wiTransformedDif.push(...wraps);
  });
  return wiTransformedDif;
}

/**
 * @brief Takes a wDif of chronologically dependant subdifs and
 *    returns a new wDif of independant subdifs.
 */
function makeIndependant(wDif) {
  const wDifCopy = deepCopy(wDif);
  let wIndependantDif = [];

  for (let i = wDif.length - 1; i >= 1; i--) {
    wIndependantDif.unshift(wDifCopy[i]);
    wIndependantDif = LET(wIndependantDif, [wDif[i - 1]]);
  }
  wIndependantDif.unshift(wDifCopy[0]);

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

/**
 * @brief Converts text to a dif.
 *
 * @param targetRow The row where the text is being added.
 * @param targetPosition The position at which the text is being added.
 * @param content An array of lines to be converted.
 *
 * @returns Returns the final dif.
 */
function textToDif(targetRow, targetPosition, content) {
  const dif = [];

  if (content.length === 1) {
    dif.push(add(targetRow, targetPosition, content[0]));
  }
  else if (content.length > 1) {
    // first newline, pushes text after cursor to a new line
    dif.push(newline(targetRow, targetPosition));

    // add other newlines
    for (let i = 0; i < content.length - 2; i++) {
      dif.push(newline(targetRow, targetPosition));
    }

    // add first line of text
    if (content[0].length > 0) {
      dif.push(add(targetRow, targetPosition, content[0]));
    }

    // add remaining lines
    for (let i = 1; i < content.length; i++) {
      dif.push(add(targetRow + i, 0, content[1]));
    }
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
    else if (isNewline(subdif)) {
      document.insertMergedLines({ row: subdif[0], column: subdif[1] }, ['', '']);
    }
    else if (isRemline(subdif) && !wrap.meta.informationLost) {
      document.removeNewLine(subdif[0]);
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
    else if (isNewline(subdif)) {
      document.removeNewLine(subdif[0]);
    }
    else if (isRemline(subdif) && !wrap.meta.informationLost) {
      document.insertMergedLines({ row: subdif[0], column: subdif[1] }, ['', '']);
    }
    else if (isRemline(subdif) && wrap.meta.informationLost) {
      // do nothing
    }
    else {
      console.log('Received unknown dif!');
    }
  });
  return document;
}

function applyDifServer(wDif, document) {
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
    else if (isNewline(subdif)) {
      const prefix = document[subdif[0]].substring(0, subdif[1]);
      const trailingText = document[subdif[0]].substring(subdif[1]);
      document[subdif[0]] = prefix;
      document.splice(subdif[0] + 1, 0, trailingText);
    }
    /// TODO: don't forget to implement the information lost bit in the live version
    else if (isRemline(subdif) && !wrap.meta.informationLost) {
      document[subdif[0]] += document[subdif[0] + 1];
      document.splice(subdif[0] + 1, 1);
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

function undoDifServer(wDif, document) {
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
    else if (isNewline(subdif)) {
      document[subdif[0]] += document[subdif[0] + 1];
      document.splice(subdif[0] + 1, 1);
    }
    else if (isRemline(subdif) && !wrap.meta.informationLost) {
      const prefix = document[subdif[0]].substring(0, subdif[1]);
      const trailingText = document[subdif[0]].substring(subdif[1]);
      document[subdif[0]] = prefix;
      document.splice(subdif[0] + 1, 0, trailingText);
    }
    else if (isRemline(subdif) && wrap.meta.informationLost) {
      // do nothing
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
    return applyDifServer(wDif, document);
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
    return undoDifServer(wDif, document);
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
  const wdLocallyDependantDifs = [];
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
  // if (log) console.log('applied GOTCA operation:', document);

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
  changeCursorPosition, textToDif, applyDifAce, UDR,
  makeDependant, makeIndependant, LIT, LET,
};
