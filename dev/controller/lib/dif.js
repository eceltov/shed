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
    if (op[0][0] === user) {
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

  for (let i = 0; i < HB.length; i++) {
    if (HB[i][0][0] === userID) {
      return i;
    }
  }
  return -1;
}

function LIT(wDif, wTransformationDif, log = false) {
  if (wDif.length === 0) return [];
  if (wTransformationDif.length === 0) return makeDependant(wDif);
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
    // the originalWrap may fall apart, therefore an array is used
    let wraps = [originalWrap];
    // apply each transformer one by one
    wTransformationDif.forEach((wTransformer) => {
      // proxy array of wraps, so that newly fragmented wraps are not pushed immediately to @wraps
      const newWraps = [];
      // transform each wrap that originated from the @originalWrap
      wraps.forEach((wrap) => {
        if (checkRA(wrap)) {
          newWraps.push(wrap);
        }
        else {
          newWraps.push(...ET(wrap, wTransformer));
        }
      });
      // update wraps
      wraps = newWraps;
    });
    // push the transformed @originalWrap
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
      dif.push(add(targetRow + i, 0, content[i]));
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
    else if (isDel(subdif) && subdif[2] > 0) {
      document.removeInLine(subdif[0], subdif[1], subdif[1] + subdif[2]);
    }
    else if (isNewline(subdif)) {
      document.insertMergedLines({ row: subdif[0], column: subdif[1] }, ['', '']);
    }
    else if (isRemline(subdif) && !wrap.meta.informationLost) {
      document.removeNewLine(subdif[0]);
    }
    else if (isDel(subdif) && subdif[2] <= 0) {
      // do nothing
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
    else if (isDel(subdif) && subdif[2] > 0) {
      document.insert({ row: subdif[0], column: subdif[1] }, '#'.repeat(subdif[2]));
    }
    else if (isNewline(subdif)) {
      document.removeNewLine(subdif[0]);
    }
    else if (isRemline(subdif) && !wrap.meta.informationLost) {
      document.insertMergedLines({ row: subdif[0], column: subdif[1] }, ['', '']);
    }
    else if (isDel(subdif) && subdif[2] <= 0) {
      // do nothing
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
    else if (isDel(subdif) && subdif[2] > 0) {
      const row = document[subdif[0]];
      document[subdif[0]] = row.substr(0, subdif[1]) + row.substr(subdif[1] + subdif[2]);
    }
    else if (isNewline(subdif)) {
      const prefix = document[subdif[0]].substring(0, subdif[1]);
      const trailingText = document[subdif[0]].substring(subdif[1]);
      document[subdif[0]] = prefix;
      document.splice(subdif[0] + 1, 0, trailingText);
    }
    else if (isRemline(subdif) && !wrap.meta.informationLost) {
      document[subdif[0]] += document[subdif[0] + 1];
      document.splice(subdif[0] + 1, 1);
    }
    else if (isDel(subdif) && subdif[2] <= 0) {
      // do nothing
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
    else if (isDel(subdif) && subdif[2] > 0) {
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
    else if (isDel(subdif) && subdif[2] <= 0) {
      // do nothing
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

function documentIsAce(document) {
  return document.constructor !== Array;
}

/**
 * @brief Applies a wDif to the document. The document can be an
 *  Ace document or an array of strings.
 * @param {*} wDif A wDif to be applied.
 * @param {*} document The document to which the wDif will be applied to.
 * @returns Returns the new document.
 */
function applyDif(wDif, document) {
  if (documentIsAce(document)) {
    return applyDifAce(wDif, document);
  }
  return applyDifServer(wDif, document);
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
  if (documentIsAce(document)) {
    return undoDifAce(wDif, document);
  }
  return undoDifServer(wDif, document);
}

function partOfSameChain(meta1, meta2) {
  return meta1[0] === meta2[0]
    && meta1[2] === meta2[2]
    && meta1[3] === meta2[3];
}

/**
 * @brief The General Operation Transformation Control Algorithm. Transforms an operation so that
 *        it is dependant on the last HB entry.
 * @param {*} wdMessage A wrapped operation to be transformed.
 * @param {*} wdHB The wrapped HB against which to transform.
 * @param {*} SO The serverOrdering agains which to transform.
 * @returns Returns the wrapped transformed operation.
 */
function GOTCA(wdMessage, wdHB, SO, log = false) {
  // the last index in SO to look for dependent operations
  const DDIndex = SO.findIndex((meta) => (
    meta[0] === wdMessage[0][2] && meta[1] === wdMessage[0][3]));

  // the index of the last dependent operation unpreceded by an independent message
  let dependentSectionEndIdx = -1;
  let dependentSection = true;

  const postDependentSectionDependentIndices = [];

  for (let i = 0; i < wdHB.length; i++) {
    let dependent = false;
    // handle local dependency
    if (wdHB[i][0][0] === wdMessage[0][0])
      dependent = true;
    else {
      // filtering out directly dependent operations
      for (let j = 0; j <= DDIndex; j++) {
        // deep comparison between the HB operation metadata and SO operation metadata
        if (deepEqual(wdHB[i][0], SO[j])) {
          dependent = true;
          break;
        }
      }
    }

      if (dependent) {
        if (dependentSection)
          dependentSectionEndIdx = i;
        else
          postDependentSectionDependentIndices.push(i);
      }
      else {   
        // handle message chains
        if (dependentSection && partOfSameChain(wdMessage[0], wdHB[i][0]))
          dependentSectionEndIdx = i;
        // message chains can be present after the dependent section as well
        else if (!dependentSection && partOfSameChain(wdMessage[0], wdHB[i][0]))
          postDependentSectionDependentIndices.push(i);
        else
          dependentSection = false;
      }
  }

  // there are no independent messages, therefore no transformation is needed
  if (dependentSection)
    return wdMessage;

  // the operations in the dependent section are not needed by the algorithm
  const wdReducedHB = wdHB.slice(dependentSectionEndIdx + 1);
  // reduce the indices by the number of elements omitted
  for (let i = 0; i < postDependentSectionDependentIndices.length; i++)
      postDependentSectionDependentIndices[i] -= dependentSectionEndIdx + 1;

  const wdReversedHBDifs = [];
  for (let i = wdReducedHB.length - 1; i >= 0; i--) {
      const wdDif = deepCopy(wdReducedHB[i][1]);
      wdDif.reverse();
      wdReversedHBDifs.push(wdDif);
  }

  const wiExcludedDependentOps = [];

  // the difs in the reduced HB will be aggregated one by one from the oldest to the newest and used in
  // a LET on remaining dependent operations
  postDependentSectionDependentIndices.forEach(i => {
      const wdLETDif = dissolveArrays(wdReversedHBDifs.slice(
          wdReversedHBDifs.length - i));

      const wiExcludedDependentOp = LET(makeIndependant(wdReducedHB[i][1]), wdLETDif);
      wiExcludedDependentOps.push(wiExcludedDependentOp);
  });

  // make the dependent ops be in the same form as they were when the message was created
  // they are all joined into a single dif for easier application
  const wdJoinedIncludedDependentOps = [];
  wiExcludedDependentOps.forEach(wiExcludedDependentOp => {
    wdJoinedIncludedDependentOps.push(...LIT(wiExcludedDependentOp, wdJoinedIncludedDependentOps));
  });

  // reverse the dependent operations so they can be excluded
  wdJoinedIncludedDependentOps.reverse();
  // exclude the dependent ops from the message so that it has the same context as wdReducedHB[0].wDif
  const wiExcludedMessage = LET(makeIndependant(wdMessage[1]), wdJoinedIncludedDependentOps);

  // include all operations in the reduced HB
  const wdMergedHB = [];
  wdReducedHB.forEach(operation => {
    wdMergedHB.push(...operation[1]);
  });

  wdMessage[1] = LIT(wiExcludedMessage, wdMergedHB);
  return wdMessage;
}

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
  if (log) {
    if (documentIsAce(document)) {
      console.log('before', JSON.stringify(document.$lines));
    }
    else {
      console.log('before:', document);
    }
  }
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
  if (log) {
    if (documentIsAce(document)) {
      console.log('after:', JSON.stringify(document.$lines));
    }
    else {
      console.log('after:', document);
    }
  }
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
