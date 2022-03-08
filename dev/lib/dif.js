/* eslint-disable function-call-argument-newline */
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

const to = {};
to.prim = {};

// functions for dif creation
to.add = function add(row, position, content) {
  return [row, position, content];
};
to.del = function del(row, position, count) {
  return [row, position, count];
};
to.move = function move(sourceRow, sourcePosition, targetRow, targetPosition, length) {
  return [sourceRow, sourcePosition, targetRow, targetPosition, length];
};
to.newline = function newline(row) {
  return row;
};
to.remline = function remline(row) {
  if (row === 0) console.log('Creating remline with row = 0!');
  return -row;
};

to.isAdd = function isAdd(subdif) {
  const s = to.prim.unwrapSubdif(subdif);
  return (s.constructor === Array && s.length === 3 && typeof s[2] === 'string');
};
to.isDel = function isDel(subdif) {
  const s = to.prim.unwrapSubdif(subdif);
  return (s.constructor === Array && s.length === 3 && typeof s[2] === 'number');
};
to.isNewline = function isNewline(subdif) {
  const s = to.prim.unwrapSubdif(subdif);
  return (typeof s === 'number' && s >= 0);
};
to.isRemline = function isRemline(subdif) {
  const s = to.prim.unwrapSubdif(subdif);
  return (typeof s === 'number' && s < 0); // line 0 cannot be deleted
};
to.isMove = function isMove(subdif) {
  const s = to.prim.unwrapSubdif(subdif);
  return (s.constructor === Array && s.length === 5);
};

/**
 * @brief Applies a wDif to the document. The document can be an
 *  Ace document or an array of strings.
 * @param {*} wDif A wDif to be applied.
 * @param {*} document The document to which the wDif will be applied to.
 * @returns Returns the new document.
 */
to.applyDif = function applyDif(wDif, document) {
  if (document.constructor === Array) {
    return to.applyDifTest(wDif, document);
  }

  return to.applyDifAce(wDif, document);
};

/**
 * @brief Undoes a wDif from the document. The document can be an
 *  Ace document or an array of strings.
 * @note Undoing Dels will result in the insertion of '#'s instead of the
 *  previously deleted characters.
 * @param {*} wDif A wDif to be undone.
 * @param {*} document The document from which the wDif will be undone.
 * @returns Returns the new document.
 */
to.undoDif = function undoDif(wDif, document) {
  if (document.constructor === Array) {
    return to.undoDifTest(wDif, document);
  }

  return to.undoDifAce(wDif, document);
};

to.applyDifAce = function applyDifAce(wDif, document) {
  wDif.forEach((wrap) => {
    const subdif = wrap.sub;
    if (to.isAdd(subdif)) {
      document.insert({ row: subdif[0], column: subdif[1] }, subdif[2]);
    }
    else if (to.isDel(subdif)) {
      document.removeInLine(subdif[0], subdif[1], subdif[1] + subdif[2]);
    }
    else if (to.isMove(subdif)) {
      // the move is a simple newline in the middle of a line
      if (subdif[0] === subdif[2] - 1 && subdif[3] === 0) {
        document.insertMergedLines({ row: subdif[0], column: subdif[1] }, ['', '']);
      }
      /// TODO: this does not translate to a move instruction in ManagedSession.handleChange
      else {
        const movedText = document.getLine(subdif[0]).substr(subdif[1], subdif[4]);
        document.insert({ row: subdif[2], column: subdif[3] }, movedText);
        document.removeInLine(subdif[0], subdif[1], subdif[1] + subdif[4]);
      }
    }
    else if (to.isNewline(subdif)) {
      document.insertNewLine({ row: subdif, column: 0 });
    }
    else if (to.isRemline(subdif) && !wrap.meta.informationLost) {
      document.removeNewLine(-subdif - 1);
    }
    else if (to.isRemline(subdif) && wrap.meta.informationLost) {
      // do nothing
    }
    else {
      console.log('Received unknown subdif!', subdif);
    }
  });
  return document;
};

to.undoDifAce = function undoDifAce(wDif, document) {
  const wDifCopy = to.prim.deepCopy(wDif);
  wDifCopy.reverse(); // subdifs need to be undone in reverse order
  wDifCopy.forEach((wrap) => {
    const subdif = wrap.sub;
    if (to.isAdd(subdif)) {
      document.removeInLine(subdif[0], subdif[1], subdif[1] + subdif[2].length);
    }
    else if (to.isDel(subdif)) {
      document.insert({ row: subdif[0], column: subdif[1] }, '#'.repeat(subdif[2]));
    }
    else if (to.isMove(subdif)) {
      const movedText = document.getLine(subdif[2]).substr(subdif[3], subdif[4]);
      document.insert({ row: subdif[0], column: subdif[1] }, movedText);
      document.removeInLine(subdif[2], subdif[3], subdif[3] + subdif[4]);
    }
    else if (to.isNewline(subdif)) {
      document.removeNewLine(subdif - 1);
    }
    else if (to.isRemline(subdif)) {
      document.insertNewLine({ row: -subdif, column: 0 });
    }
    else {
      console.log('Received unknown dif!');
    }
  });
  return document;
};

to.applyDifTest = function applyDifTest(wDif, document) {
  wDif.forEach((wrap) => {
    //console.log('applyDifTest:', JSON.stringify(document));
    const subdif = to.prim.unwrapSubdif(wrap);
    //console.log('applyDifTestSubdif:', JSON.stringify(subdif));
    if (to.isAdd(subdif)) {
      const row = document[subdif[0]];
      document[subdif[0]] = row.substr(0, subdif[1]) + subdif[2] + row.substr(subdif[1]);
    }
    else if (to.isDel(subdif)) {
      const row = document[subdif[0]];
      document[subdif[0]] = row.substr(0, subdif[1]) + row.substr(subdif[1] + subdif[2]);
    }
    else if (to.isMove(subdif)) {
      const sourceRow = document[subdif[0]];
      const targetRow = document[subdif[2]];
      const movedText = sourceRow.substr(subdif[1], subdif[4]);

      document[subdif[0]] = sourceRow.substr(0, subdif[1])
        + sourceRow.substr(subdif[1] + subdif[4]);

      document[subdif[2]] = targetRow.substr(0, subdif[3])
        + movedText + targetRow.substr(subdif[3]);
    }
    else if (to.isNewline(subdif)) {
      document.splice(subdif, 0, '');
    }
    /// TODO: don't forget to implement the information lost bit in the live version
    else if (to.isRemline(subdif) && !wrap.meta.informationLost) {
      document.splice(-subdif, 1);
    }
    else if (to.isRemline(subdif) && wrap.meta.informationLost) {
      // do nothing
    }
    else {
      console.log('Received unknown subdif!', subdif);
    }
  });
  return document;
};

to.undoDifTest = function undoDifTest(wDif, document) {
  const wDifCopy = to.prim.deepCopy(wDif);
  wDifCopy.reverse(); // subdifs need to be undone in reverse order
  wDifCopy.forEach((wrap) => {
    const subdif = wrap.sub;
    if (to.isAdd(subdif)) {
      const row = document[subdif[0]];
      document[subdif[0]] = row.substr(0, subdif[1]) + row.substr(subdif[1] + subdif[2].length);
    }
    else if (to.isDel(subdif)) {
      const row = document[subdif[0]];
      document[subdif[0]] = row.substr(0, subdif[1]) + '#'.repeat(subdif[2]) + row.substr(subdif[1]);
    }
    else if (to.isMove(subdif)) {
      const sourceRow = document[subdif[2]];
      const targetRow = document[subdif[0]];
      const movedText = sourceRow.substr(subdif[3], subdif[4]);

      document[subdif[2]] = sourceRow.substr(0, subdif[3])
        + sourceRow.substr(subdif[3] + subdif[4]);

      document[subdif[0]] = targetRow.substr(0, subdif[1])
        + movedText + targetRow.substr(subdif[1]);
    }
    else if (to.isNewline(subdif)) {
      document.splice(subdif, 1);
    }
    else if (to.isRemline(subdif)) {
      document.splice(-subdif, 0, '');
    }
    else {
      console.log('Received unknown dif!');
    }
  });
  return document;
};

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
to.UDR = function UDR(
  dMessage, document, wdInitialHB, initialSO, log = false, cursorPosition = null,
) {
  if (log) console.log('before:', document);
  let wdHB = to.prim.deepCopy(wdInitialHB);
  const SO = [...initialSO, dMessage[0]];

  if (log) console.log('message:', dMessage);

  // find the total ordering of the message relative to the local HB and SO
  const undoIndex = to.prim.findTotalOrderingHBIndex(dMessage, wdHB, SO);

  if (log) console.log('undoIndex:', undoIndex);
  if (log) dlog('wdHB', wdHB, 'wHB');
  if (log) dlog('SO', SO, 'SO');

  const wdMessage = [dMessage[0], to.prim.wrapDif(dMessage[1])];

  // case when no operations need to be undone, only the message is transformed and directly applied
  if (undoIndex === wdHB.length) {
    if (log) console.log('UDR no ops need to be undone');
    const wdTransformedMessage = to.GOTCA(wdMessage, wdHB, SO, log);
    if (log) dlog('wdTransformedMessage', wdTransformedMessage[1], 'wDif');

    document = to.applyDif(wdTransformedMessage[1], document);
    to.prim.changeCursorPosition(cursorPosition, wdTransformedMessage);

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
    document = to.undoDif(wdUndoneHB[i][1], document);
  }

  if (log) console.log('undo independant ops:', document);
  if (log) dlog('wdUndoneHB', wdUndoneHB, 'wHB');

  // transforming and applying message

  // giving GOTCA only the relevant part of HB (from start to the last dependant operation)
  const wdTransformedMessage = to.GOTCA(wdMessage, wdHB, SO, log);
  document = to.applyDif(wdTransformedMessage[1], document);
  to.prim.changeCursorPosition(cursorPosition, wdTransformedMessage);

  if (log) dlog('wdTransformedMessage', wdTransformedMessage[1], 'wDif');

  // creating a list of undone difs for transformation
  const wdUndoneDifs = [];
  for (let i = 0; i < wdUndoneHB.length; i++) {
    wdUndoneDifs.push(to.prim.deepCopy(wdUndoneHB[i][1]));
  }

  if (log) dlog('wdUndoneDifs', wdUndoneDifs, 'wDifs');

  // creating a list of undone difs but reversed
  const wdReversedUndoneDifs = [];
  for (let i = wdUndoneHB.length - 1; i >= 0; i--) {
    const wdUndoneDif = to.prim.deepCopy(wdUndoneHB[i][1]);
    wdUndoneDif.reverse();
    wdReversedUndoneDifs.push(wdUndoneDif);
  }

  // transforming undone difs
  const wdTransformedUndoneDifs = []; // undone difs that are transformed
  const wiFirstUndoneDif = to.prim.makeIndependant(wdUndoneDifs[0]);
  if (log) dlog('wiFirstUndoneDif', wiFirstUndoneDif, 'wDif');

  // the first one is only transformed agains the message
  const wdFirstTransformedUndoneDif = to.prim.LIT(wiFirstUndoneDif, wdTransformedMessage[1]);
  if (log) dlog('wdFirstTransformedUndoneDif', wdFirstTransformedUndoneDif, 'wDif');
  wdTransformedUndoneDifs.push(wdFirstTransformedUndoneDif);
  const wdLETDif = []; // chronologically reversed
  const wdLITDif = [...wdTransformedMessage[1]];
  for (let i = 1; i < wdUndoneDifs.length; i++) {
    // excluding the older undone difs so that the message
    // and all transformed older undone difs can be included
    wdLETDif.unshift(...wdReversedUndoneDifs[wdReversedUndoneDifs.length - i]);
    const wiUndoneDif = to.prim.makeIndependant(wdUndoneDifs[i]);
    const wiExcludedDif = to.prim.LET(wiUndoneDif, wdLETDif);

    // including the message and transformed older undone difs
    wdLITDif.push(...wdTransformedUndoneDifs[i - 1]);
    const wdTransformedUndoneDif = to.prim.LIT(wiExcludedDif, wdLITDif, log);
    wdTransformedUndoneDifs.push(wdTransformedUndoneDif);
  }

  if (log) dlog('wdTransformedUndoneDifs', wdTransformedUndoneDifs, 'wDifs');

  // redoing transformed undone difs
  wdTransformedUndoneDifs.forEach((wdDif) => {
    document = to.applyDif(wdDif, document);
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
};

/**
 * @brief The General Operation Transformation Control Algorithm. Transforms an operation so that
 *        it is dependant on the last HB entry.
 * @param {*} wdMessage A wrapped operation to be transformed.
 * @param {*} wdHB The wrapped HB against which to transform.
 * @param {*} SO The serverOrdering agains which to transform.
 * @param {*} log Whether to print out debug messages to the console.
 * @returns Returns the wrapped transformed operation.
 */
to.GOTCA = function GOTCA(wdMessage, wdHB, SO, log = false) {
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
      if (to.prim.deepEqual(wdHB[i][0], SO[j])) {
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
  const wiMessageDif = to.prim.makeIndependant(wdMessageDif);

  // there are no locally dependant operations in HB, therefore all independant
  // operations can be included directly
  /// TODO: or if all locally dependant difs are empty
  if (wdLocallyDependantDifs.length === 0) {
    if (log) console.log('GOTCA no locally dependant ops');
    const wdTransformationDif = [];
    wdIndependantDifs.forEach((wdDif) => wdTransformationDif.push(...wdDif));
    const wTransformedMessageDif = to.prim.LIT(wiMessageDif, wdTransformationDif);
    wdMessage[1] = wTransformedMessageDif;
    return wdMessage;
  }

  // preparing difs for transformation
  wdLocallyDependantDifs = to.prim.deepCopy(wdLocallyDependantDifs);

  const dependantHBIndex = to.prim.findLastDependancyIndex(wdMessage, wdHB);
  const wdReversedTransformerDifs = [];
  for (let i = dependantHBIndex; i > lastDirectlyDependantIndex; i--) {
    const wdDif = to.prim.deepCopy(wdHB[i][1]);
    wdDif.reverse();
    wdReversedTransformerDifs.push(wdDif);
  }

  // if(log) console.log('wdLocallyDependantDifs:', JSON.stringify(wdLocallyDependantDifs));
  // if(log) console.log('wdReversedTransformerDifs:', JSON.stringify(wdReversedTransformerDifs));

  // [..., last_dep_index=20, indep1, indep2, loc_dep0=23, indep3, loc_dep1=25]

  // transformation
  const wdTransformedDifs = []; // EOL' in wrapped dif form
  let wdLETDif = to.prim.dissolveArrays(wdReversedTransformerDifs.slice(
    wdReversedTransformerDifs.length
    - (locallyDependantIndices[0]
    - (lastDirectlyDependantIndex + 1)),
  ));
  const wdLITDif = [];
  if (log) dlog('wdLocallyDependantDifs[0]', wdLocallyDependantDifs[0], 'wDif');

  const wiFirstTransformedDif = to.prim.LET(
    to.prim.makeIndependant(wdLocallyDependantDifs[0]), wdLETDif,
  );

  // this now has mutually independant subdifs, they need to be made dependant
  const wdFirstTransformedDif = to.prim.makeDependant(wiFirstTransformedDif);
  if (log) dlog('wdFirstTransformedDif', wdFirstTransformedDif, 'wDif');
  wdTransformedDifs.push(wdFirstTransformedDif);
  for (let i = 1; i < wdLocallyDependantDifs.length; i++) {
    wdLETDif = to.prim.dissolveArrays(wdReversedTransformerDifs.slice(
      wdReversedTransformerDifs.length
      - (locallyDependantIndices[i]
      - (lastDirectlyDependantIndex + 1)),
    ));

    // this is also mutually independant
    const wiIndependantExcludedDif = to.prim.LET(
      to.prim.makeIndependant(wdLocallyDependantDifs[i]), wdLETDif,
    );
    wdLITDif.push(...wdTransformedDifs[i - 1]);
    const wdTransformedDif = to.prim.LIT(wiIndependantExcludedDif, wdLITDif);
    wdTransformedDifs.push(wdTransformedDif);
  }
  const wdReversedTransformedDifs = to.prim.deepCopy(wdTransformedDifs);
  wdReversedTransformedDifs.reverse();
  wdReversedTransformedDifs.forEach((wdDif) => wdDif.reverse());
  if (log) dlog('wdReversedTransformedDifs', wdReversedTransformedDifs, 'wDifs');
  if (log) dlog('wiMessageDif', wiMessageDif, 'wDif');

  const wiExcludedMessageDif = to.prim.LET(
    wiMessageDif, to.prim.dissolveArrays(wdReversedTransformedDifs),
  );

  if (log) dlog('wiExcludedMessageDif', wiExcludedMessageDif, 'wDif');

  // independant difs between the last directly and first locally dependant dif
  const prependingIndependantDifs = wdHB.slice(
    lastDirectlyDependantIndex + 1, to.prim.findFirstLocalDependancyIndex(wdMessage, wdHB),
  );
  prependingIndependantDifs.forEach((operation, index) => {
    prependingIndependantDifs[index] = operation[1];
  });

  const wdHBLITDif = [];
  for (let i = lastDirectlyDependantHBIndex + 1; i < wdHB.length; i++) {
    wdHBLITDif.push(...wdHB[i][1]);
  }
  if (log) dlog('wdHBLITDif', wdHBLITDif, 'wDif');
  const wdTransformedMessageDif = to.prim.LIT(wiExcludedMessageDif, wdHBLITDif);
  wdMessage[1] = wdTransformedMessageDif;
  if (log) console.log('GOTCA full run');
  return wdMessage;
};

/**
 * @brief Creates a new dif that has the same effects as the input dif but is compressed.
 * @param {*} inputDif The dif to be compressed.
 * @returns Compressed dif.
 */
to.compress = function compress(inputDif) {
  const dif = to.prim.deepCopy(inputDif);

  // remove empty Adds/Dels/Moves
  for (let i = 0; i < dif.length; ++i) {
    if (to.isAdd(dif[i])) {
      if (dif[i][2] === '') {
        dif.splice(i, 1);
        --i;
      }
    }
    else if (to.isDel(dif[i])) {
      if (dif[i][2] === 0) {
        dif.splice(i, 1);
        --i;
      }
    }
    else if (to.isMove(dif[i])) {
      if (dif[i][4] === 0) {
        dif.splice(i, 1);
        --i;
      }
    }
  }

  // join adjacent Adds
  for (let i = 0; i < dif.length - 1; ++i) { // so that there is a next entry
    if (to.isAdd(dif[i])) {
      const endPos = dif[i][1] + dif[i][2].length;
      if (dif[i][0] === dif[i + 1][0] // they are on the same row
                && endPos === dif[i + 1][1] // they are adjacent
                && to.isAdd(dif[i + 1]) // the next entry is of type Add
      ) {
        dif[i] = [dif[i][0], dif[i][1], dif[i][2] + dif[i + 1][2]];
        dif.splice(i + 1, 1);
        i--; // decrement i so that the compressed subdif will be compared with the next one
      }
    }
  }

  // join adjacent Dels
  for (let i = 0; i < dif.length - 1; ++i) { // so that there is a next entry
    if (to.isDel(dif[i])) {
      if (dif[i][0] === dif[i + 1][0] // they are on the same row
                && to.isDel(dif[i + 1]) // the next entry is of type Del
      ) {
        if (
          // they are adjacent (the next one is on a higher position)
          dif[i][1] + dif[i][2] === dif[i + 1][1]) {
          dif[i] = [dif[i][0], dif[i][1], dif[i][2] + dif[i + 1][2]];
          dif.splice(i + 1, 1);
          i--;
        }
        else if (
          // they are adjacent (the next one is on a lower position)
          dif[i + 1][1] + dif[i + 1][2] === dif[i][1]) {
          dif[i] = [dif[i][0], dif[i + 1][1], dif[i][2] + dif[i + 1][2]];
          dif.splice(i + 1, 1);
          i--;
        }
      }
    }
  }

  // line deletion right propagation
  for (let i = dif.length - 1; i >= 0; --i) {
    if (to.isRemline(dif[i])) {
      for (let j = i + 1; j < dif.length; ++j) {
        if (to.isAdd(dif[j]) && dif[j][0] >= -dif[i]) {
          dif[j][0] += 1;
        }
        else if (to.isDel(dif[j]) && dif[j][0] >= -dif[i]) {
          dif[j][0] += 1;
        }
        else if (to.isNewline(dif[j])) {
          if (dif[j] >= -dif[i]) {
            dif[j] += 1;
          }
          else {
            dif[i] -= 1;
          }
        }
        else if (to.isRemline(dif[j])) {
          if (dif[i] >= dif[j]) {
            dif[j] -= 1;
          }
          else {
            dif[i] += 1;
          }
        }
        else if (to.isMove(dif[j])) {
          if (dif[j][0] >= -dif[i]) {
            dif[j][0] += 1;
          }
          if (dif[j][2] >= -dif[i]) {
            dif[j][2] += 1;
          }
        }
      }
      dif.push(dif[i]);
      dif.splice(i, 1);
    }
  }

  // line addition left propagation
  for (let i = 1; i < dif.length; ++i) {
    if (to.isNewline(dif[i])) {
      for (let j = i - 1; j >= 0; --j) {
        if (to.isAdd(dif[j]) && dif[j][0] >= dif[i]) {
          dif[j][0] += 1;
        }
        else if (to.isDel(dif[j]) && dif[j][0] >= dif[i]) {
          dif[j][0] += 1;
        }
        else if (to.isNewline(dif[j])) {
          if (dif[i] <= dif[j]) {
            dif[j] += 1;
          }
          else {
            dif[i] -= 1;
          }
        }
        else if (to.isMove(dif[j])) {
          if (dif[j][0] >= dif[i]) {
            dif[j][0] += 1;
          }
          if (dif[j][2] >= dif[i]) {
            dif[j][2] += 1;
          }
        }
      }
      dif.unshift(dif[i]);
      dif.splice(i + 1, 1);
    }
  }

  /// TODO: reorder newlines
  /// TODO: order Adds and Dels by row

  return dif;
};

to.prim.wrapID = 0; // id for wrapped difs (used in relative addressing)

to.prim.changeCursorPosition = function changeCursorPosition(cursorPosition, wOperation) {
  if (cursorPosition === null) return;
  let { row } = cursorPosition;
  let position = cursorPosition.column;
  wOperation[1].forEach((wrap) => {
    if (to.isNewline(wrap) && wrap.sub <= row) {
      row++;
    }
    if (to.isRemline(wrap) && -wrap.sub <= row) {
      row--;
    }
    if (
      to.isMove(wrap)
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
};

/**
 * @brief Finds the index in HB at which a non present operation should be placed.
 * @param {*} dMessage The operation whose TO index is being determined.
 * @param {*} HB The history buffer.
 * @param {*} SO The server ordering.
 * @returns Returns the index.
 */
to.prim.findTotalOrderingHBIndex = function findTotalOrderingHBIndex(dMessage, HB, SO) {
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
      const operationSOIndex = to.prim.SOIndex(operation, SO);
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
            if (to.prim.SOIndex(chainMember, SO) === -1) {
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
};

/**
 * @brief Finds the last HB index of an operation that is either locally or
 *  directly dependant on the input.
 * @param {*} operation The input operation.
 * @param {*} HB The history buffer.
 * @returns Returns the index.
 */
to.prim.findLastDependancyIndex = function findLastDependancyIndex(operation, HB) {
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
};

/**
 * @brief Finds the first HB index of an operation that is locally dependant on the input.
 * @param {*} operation The input operation.
 * @param {*} HB The history buffer.
 * @returns Returns the index.
 */
to.prim.findFirstLocalDependancyIndex = function findFirstLocalDependancyIndex(operation, HB) {
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
};

/**
 * @brief Finds the server ordering index of an operation.
 * @param {*} operation The input operation.
 * @param {*} SO The server ordering.
 * @returns Returns the index.
 */
to.prim.SOIndex = function SOIndex(operation, SO) {
  return SO.findIndex((entry) => entry[0] === operation[0][0] && entry[1] === operation[0][1]);
};

/**
 * @brief Finds the HB index of an operation.
 * @param {*} operation The input operation.
 * @param {*} HB The history buffer.
 * @returns Returns the index.
 */
to.prim.HBIndex = function HBIndex(operation, HB) {
  return HB.findIndex((entry) => (
    entry[0][0] === operation[0][0] && entry[0][1] === operation[0][1]
  ));
};

/**
 * @brief Takes an array of arrays and returns an array containing all nested elements
 */
to.prim.dissolveArrays = function dissolveArrays(arrays) {
  const a = [];
  arrays.forEach((array) => a.push(...array));
  return a;
};

to.prim.deepCopy = function deepCopy(object) {
  return JSON.parse(JSON.stringify(object));
};

to.prim.deepEqual = function deepEqual(x, y) {
  if (x === y) {
    return true;
  }
  if ((typeof x === 'object' && x != null) && (typeof y === 'object' && y != null)) {
    if (Object.keys(x).length !== Object.keys(y).length) return false;

    // eslint-disable-next-line no-restricted-syntax
    for (const prop in x) {
      if (y[prop] !== undefined) {
        if (!to.prim.deepEqual(x[prop], y[prop])) return false;
      }
      else return false;
    }

    return true;
  }
  return false;
};

to.prim.sameRow = function sameRow(wrap, wTransformer) {
  return wrap.sub[0] === wTransformer.sub[0];
};

to.prim.mockupString = function mockupString(length) {
  return {
    length,
  };
};

to.prim.wrapSubdif = function wrapSubdif(subdif) {
  if (!to.isMove(subdif)) {
    return {
      sub: to.prim.deepCopy(subdif),
      meta: {
        ID: to.prim.wrapID++,
        informationLost: false, // whether the context had to be saved
        relative: false, // whether relative addresing is in place
        context: {
          original: null,
          transformers: null,
          addresser: null,
        },
      },
    };
  }

  return {
    sub: to.prim.deepCopy(subdif),
    metaDel: {
      ID: to.prim.wrapID++,
      informationLost: false, // whether the context had to be saved
      relative: false, // whether relative addresing is in place
      context: {
        original: null,
        transformers: null,
        addresser: null,
      },
    },
    metaAdd: {
      ID: to.prim.wrapID++,
      informationLost: false, // whether the context had to be saved
      relative: false, // whether relative addresing is in place
      context: {
        original: null,
        transformers: null,
        addresser: null,
      },
    },
  };
};

to.prim.unwrapSubdif = function unwrapSubdif(wrap) {
  if (wrap.constructor === Object && wrap.sub !== undefined) {
    return wrap.sub;
  }
  return wrap;
};

to.prim.wrapDif = function wrapDif(dif) {
  for (let i = 0; i < dif.length; i++) {
    dif[i] = to.prim.wrapSubdif(dif[i]);
  }
  return dif;
};

to.prim.unwrapDif = function unwrapDif(dif) {
  const unwrappedDif = [];
  dif.forEach((wrap) => unwrappedDif.push(to.prim.unwrapSubdif(wrap)));
  return unwrappedDif;
};

to.prim.identicalSubdifs = function identicalSubdifs(subdif1, subdif2) {
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
};

to.prim.saveLI = function saveLI(wrap, wTransformer, mode = 'default') {
  if (mode === 'default') {
    wrap.meta.informationLost = true;
    wrap.meta.context.original = to.prim.deepCopy(wrap.sub);
    wrap.meta.context.wTransformer = to.prim.deepCopy(wTransformer);
  }
  else if (mode === 'add') {
    wrap.metaAdd.informationLost = true;
    wrap.metaAdd.context.original = to.prim.deepCopy(wrap.sub);
    wrap.metaAdd.context.wTransformer = to.prim.deepCopy(wTransformer);
  }
  else if (mode === 'del') {
    wrap.metaDel.informationLost = true;
    wrap.metaDel.context.original = to.prim.deepCopy(wrap.sub);
    wrap.metaDel.context.wTransformer = to.prim.deepCopy(wTransformer);
  }
  else {
    console.log('Unknown mode in saveLI!');
  }
  return wrap;
};

to.prim.checkRA = function checkRA(wrap) {
  // newlines and remlines are never relatively addressed
  if (to.isNewline(wrap) || to.isRemline(wrap)) {
    return false;
  }
  if (!to.isMove(wrap)) {
    return wrap.meta.relative;
  }
  return wrap.metaAdd.relative || wrap.metaDel.relative;
};

to.prim.saveRA = function saveRA(wrap, addresser) {
  wrap.meta.relative = true;
  wrap.meta.context.addresser = addresser;
  return wrap;
};

/// TODO: what if the transformer is move?
/**
 * @brief Checks whether the wrap lost information due to the transformer.
 *
 * @param {*} wrap
 * @param {*} wTransformer
 * @param {*} mode Used for move wraps. Either "add" or "del".
 * @returns
 */
to.prim.checkLI = function checkLI(wrap, wTransformer, mode = 'default') {
  if (!to.isMove(wrap)) {
    if (!wrap.meta.informationLost) {
      return false;
    }
    return wrap.meta.context.wTransformer.meta.ID === wTransformer.meta.ID;
  }

  if (mode === 'add') {
    if (!wrap.metaAdd.informationLost) {
      return false;
    }
    return wrap.metaAdd.context.wTransformer.meta.ID === wTransformer.meta.ID;
  }
  if (mode === 'del') {
    if (!wrap.metaDel.informationLost) {
      return false;
    }
    return wrap.metaDel.context.wTransformer.meta.ID === wTransformer.meta.ID;
  }

  console.log('Incorrect checkLI usage!');
  return false;
};

to.prim.recoverLI = function recoverLI(wrap, mode = 'default') {
  if (!to.isMove(wrap)) {
    wrap.sub = wrap.meta.context.original;
    wrap.meta.informationLost = false;
  }
  else if (mode === 'add') {
    // the add part of move only handles where the moved text is pasted
    wrap.sub[2] = wrap.metaAdd.context.original[2];
    wrap.sub[3] = wrap.metaAdd.context.original[3];
    wrap.metaAdd.informationLost = false;
  }
  else if (mode === 'del') {
    // the del part of move handles from where the text was taken and how much of it
    wrap.sub[0] = wrap.metaDel.context.original[0];
    wrap.sub[1] = wrap.metaDel.context.original[1];
    wrap.sub[4] = wrap.metaDel.context.original[4];
    wrap.metaDel.informationLost = false;
  }
  // return wrap.meta.context.original;
};

to.prim.checkBO = function checkBO(wrap, wTransformer) {
  if (!to.isMove(wrap)) {
    return wrap.meta.context.addresser.meta.ID === wTransformer.meta.ID;
  }
  return wrap.metaAdd.context.addresser.meta.ID === wTransformer.meta.ID
           || wrap.metaDel.context.addresser.meta.ID === wTransformer.meta.ID;
};

to.prim.convertAA = function convertAA(wrap, wAddresser) {
  if (!to.isMove(wrap)) {
    wrap.sub[1] += wAddresser.sub[1];
    wrap.meta.relative = false;
    wrap.meta.context.addresser = null;
  }
  else if (wrap.metaAdd.context.addresser.ID === wAddresser.meta.ID) {
    wrap.sub[3] += wAddresser.sub[1];
    wrap.metaAdd.relative = false;
    wrap.metaAdd.context.addresser = null;
  }
  else if (wrap.metaDel.context.addresser.ID === wAddresser.meta.ID) {
    wrap.sub[1] += wAddresser.sub[1];
    wrap.metaDel.relative = false;
    wrap.metaDel.context.addresser = null;
  }
  else {
    console.log('Unknown addresser in convertAA!');
  }
  return wrap;
};

/**
 * @brief Takes a wDif of chronologically dependant subdifs and
 *    returns a new wDif of independant subdifs.
 */
to.prim.makeIndependant = function makeIndependant(wDif) {
  const wDifCopy = to.prim.deepCopy(wDif);
  const wDifReversed = to.prim.deepCopy(wDif).reverse();
  const wIndependantDif = [];
  for (let i = 0; i < wDif.length; i++) {
    const wrap = wDifCopy[i];
    const wdTransformedDif = to.prim.LET(
      [wrap], wDifReversed.slice(wDifReversed.length - i),
    ); // LET can return multiple subdifs

    wIndependantDif.push(...wdTransformedDif);
  }
  return wIndependantDif;
};

/**
 * @brief Takes a wDif of independant subdifs and returns
 *   a new wDif of chronologically dependant subdifs.
 */
to.prim.makeDependant = function makeDependant(wDif) {
  const wDifCopy = to.prim.deepCopy(wDif);
  const wDependantSubdifs = to.prim.LIT(wDifCopy.slice(1), [wDifCopy[0]]);
  return [wDifCopy[0], ...wDependantSubdifs];
};

to.prim.LIT = function LIT(wDif, wTransformationDif, log = false) {
  if (wDif.length === 0) return [];
  if (wTransformationDif.length === 0) return wDif;
  if (log && wDif.length === 1 && (wDif[0].meta.ID === 13 || wDif[0].meta.ID === 11)) console.log('wDif', JSON.stringify(wDif));
  const wTransformedSubdifs1 = to.prim.LIT1(wDif[0], wTransformationDif, log);
  const wTransformedSubdifs2 = to.prim.LIT(
    wDif.slice(1), [...wTransformationDif, ...wTransformedSubdifs1],
  );
  return [...wTransformedSubdifs1, ...wTransformedSubdifs2];
};
to.prim.LIT1 = function LIT1(wrap, wTransformationDif, log = false) {
  const logCondition = log && wrap.meta.ID === 45; /// TODO: test only
  let wTransformedSubdifs = [];
  if (wTransformationDif.length === 0) {
    wTransformedSubdifs = [wrap];
  }
  // if the wrap is relatively addressed and the transformer is not the target, then skip it
  else if (to.prim.checkRA(wrap) && !to.prim.checkBO(wrap, wTransformationDif[0])) {
    wTransformedSubdifs = to.prim.LIT1(wrap, wTransformationDif.slice(1), log);
  }
  else if (to.prim.checkRA(wrap) && to.prim.checkBO(wrap, wTransformationDif[0])) {
    to.prim.convertAA(wrap, wTransformationDif[0]);
    wTransformedSubdifs = to.prim.LIT1(wrap, wTransformationDif.slice(1));
  }
  else {
    wTransformedSubdifs = to.prim.LIT(
      to.prim.IT(wrap, wTransformationDif[0]), wTransformationDif.slice(1), log,
    );
  }
  return wTransformedSubdifs;
};

to.prim.LET = function LET(wDif, wTransformationDif, log) {
  if (wDif.length === 0) return [];
  if (wTransformationDif.length === 0) return wDif;
  const wTransformedSubdifs1 = to.prim.LET1(wDif[0], wTransformationDif, log);
  const wTransformedSubdifs2 = to.prim.LET(wDif.slice(1), wTransformationDif, log);
  return [...wTransformedSubdifs1, ...wTransformedSubdifs2];
};
to.prim.LET1 = function LET1(wrap, wTransformationDif, log) {
  let wTransformedSubdifs = [];
  if (wTransformationDif.length === 0) {
    wTransformedSubdifs = [wrap];
  }
  else if (to.prim.checkRA(wrap)) {
    wTransformedSubdifs = [wrap];
  }
  else {
    wTransformedSubdifs = to.prim.LET(
      to.prim.ET(wrap, wTransformationDif[0]), wTransformationDif.slice(1), log,
    );
  }
  return wTransformedSubdifs;
};

/// TODO: consider returning an array from all prim transform functions
to.prim.IT = function IT(wrap, wTransformer) {
  const transformedWraps = [];
  if (to.isAdd(wrap)) {
    if (to.isAdd(wTransformer)) transformedWraps.push(to.prim.IT_AA(wrap, wTransformer));
    else if (to.isDel(wTransformer)) transformedWraps.push(to.prim.IT_AD(wrap, wTransformer));
    else if (to.isMove(wTransformer)) transformedWraps.push(to.prim.IT_AM(wrap, wTransformer));
    else if (to.isNewline(wTransformer)) transformedWraps.push(to.prim.IT_AN(wrap, wTransformer));
    else if (to.isRemline(wTransformer)) transformedWraps.push(to.prim.IT_AR(wrap, wTransformer));
  }
  else if (to.isDel(wrap)) {
    if (to.isAdd(wTransformer)) {
      const result = to.prim.IT_DA(wrap, wTransformer);
      if (to.isDel(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
    else if (to.isDel(wTransformer)) transformedWraps.push(to.prim.IT_DD(wrap, wTransformer));
    else if (to.isMove(wTransformer)) {
      const result = to.prim.IT_DM(wrap, wTransformer);
      if (to.isDel(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
    else if (to.isNewline(wTransformer)) transformedWraps.push(to.prim.IT_DN(wrap, wTransformer));
    else if (to.isRemline(wTransformer)) transformedWraps.push(to.prim.IT_DR(wrap, wTransformer));
  }
  else if (to.isMove(wrap)) {
    if (to.isAdd(wTransformer)) {
      const result = to.prim.IT_MA(wrap, wTransformer);
      if (to.isMove(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
    else if (to.isDel(wTransformer)) transformedWraps.push(to.prim.IT_MD(wrap, wTransformer));
    else if (to.isMove(wTransformer)) {
      const result = to.prim.IT_MM(wrap, wTransformer);
      if (to.isMove(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
    else if (to.isNewline(wTransformer)) transformedWraps.push(to.prim.IT_MN(wrap, wTransformer));
    else if (to.isRemline(wTransformer)) transformedWraps.push(to.prim.IT_MR(wrap, wTransformer));
  }
  else if (to.isNewline(wrap)) {
    if (to.isAdd(wTransformer)) transformedWraps.push(to.prim.IT_NA(wrap, wTransformer));
    else if (to.isDel(wTransformer)) transformedWraps.push(to.prim.IT_ND(wrap, wTransformer));
    else if (to.isMove(wTransformer)) transformedWraps.push(to.prim.IT_NM(wrap, wTransformer));
    else if (to.isNewline(wTransformer)) transformedWraps.push(to.prim.IT_NN(wrap, wTransformer));
    else if (to.isRemline(wTransformer)) transformedWraps.push(to.prim.IT_NR(wrap, wTransformer));
  }
  else if (to.isRemline(wrap)) {
    if (to.isAdd(wTransformer)) transformedWraps.push(to.prim.IT_RA(wrap, wTransformer));
    else if (to.isDel(wTransformer)) transformedWraps.push(to.prim.IT_RD(wrap, wTransformer));
    else if (to.isMove(wTransformer)) transformedWraps.push(to.prim.IT_RM(wrap, wTransformer));
    else if (to.isNewline(wTransformer)) transformedWraps.push(to.prim.IT_RN(wrap, wTransformer));
    else if (to.isRemline(wTransformer)) transformedWraps.push(to.prim.IT_RR(wrap, wTransformer));
  }
  return transformedWraps;
};
to.prim.ET = function ET(wrap, wTransformer) {
  const transformedWraps = [];
  if (to.isAdd(wrap)) {
    if (to.isAdd(wTransformer)) transformedWraps.push(to.prim.ET_AA(wrap, wTransformer));
    else if (to.isDel(wTransformer)) transformedWraps.push(to.prim.ET_AD(wrap, wTransformer));
    else if (to.isMove(wTransformer)) transformedWraps.push(to.prim.ET_AM(wrap, wTransformer));
    else if (to.isNewline(wTransformer)) transformedWraps.push(to.prim.ET_AN(wrap, wTransformer));
    else if (to.isRemline(wTransformer)) transformedWraps.push(to.prim.ET_AR(wrap, wTransformer));
  }
  else if (to.isDel(wrap)) {
    if (to.isAdd(wTransformer)) {
      const result = to.prim.ET_DA(wrap, wTransformer);
      if (to.isDel(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
    else if (to.isDel(wTransformer)) {
      const result = to.prim.ET_DD(wrap, wTransformer);
      if (to.isDel(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
    else if (to.isMove(wTransformer)) {
      const result = to.prim.ET_DM(wrap, wTransformer);
      if (to.isDel(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
    else if (to.isNewline(wTransformer)) transformedWraps.push(to.prim.ET_DN(wrap, wTransformer));
    else if (to.isRemline(wTransformer)) transformedWraps.push(to.prim.ET_DR(wrap, wTransformer));
  }
  else if (to.isMove(wrap)) {
    if (to.isAdd(wTransformer)) {
      const result = to.prim.ET_MA(wrap, wTransformer);
      if (to.isMove(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
    else if (to.isDel(wTransformer)) {
      const result = to.prim.ET_MD(wrap, wTransformer);
      if (to.isMove(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
    else if (to.isMove(wTransformer)) {
      const result = to.prim.ET_MM(wrap, wTransformer);
      if (isMove(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
    else if (to.isNewline(wTransformer)) transformedWraps.push(to.prim.ET_MN(wrap, wTransformer));
    else if (to.isRemline(wTransformer)) transformedWraps.push(to.prim.ET_MR(wrap, wTransformer));
  }
  else if (to.isNewline(wrap)) {
    if (to.isAdd(wTransformer)) transformedWraps.push(to.prim.ET_NA(wrap, wTransformer));
    else if (to.isDel(wTransformer)) transformedWraps.push(to.prim.ET_ND(wrap, wTransformer));
    else if (to.isMove(wTransformer)) transformedWraps.push(to.prim.ET_NM(wrap, wTransformer));
    else if (to.isNewline(wTransformer)) transformedWraps.push(to.prim.ET_NN(wrap, wTransformer));
    else if (to.isRemline(wTransformer)) transformedWraps.push(to.prim.ET_NR(wrap, wTransformer));
  }
  else if (to.isRemline(wrap)) {
    if (to.isAdd(wTransformer)) transformedWraps.push(to.prim.ET_RA(wrap, wTransformer));
    else if (to.isDel(wTransformer)) transformedWraps.push(to.prim.ET_RD(wrap, wTransformer));
    else if (to.isMove(wTransformer)) transformedWraps.push(to.prim.ET_RM(wrap, wTransformer));
    else if (to.isNewline(wTransformer)) transformedWraps.push(to.prim.ET_RN(wrap, wTransformer));
    else if (to.isRemline(wTransformer)) transformedWraps.push(to.prim.ET_RR(wrap, wTransformer));
  }
  return transformedWraps;
};

to.prim.IT_AA = function IT_AA(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (!to.prim.sameRow(wrap, wTransformer)) return wrap;
  if (wrap.sub[1] < transformer[1]) return wrap;
  wrap.sub[1] += transformer[2].length;
  return wrap;
};
to.prim.IT_AD = function IT_AD(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (!to.prim.sameRow(wrap, wTransformer)) return wrap;
  if (wrap.sub[1] <= transformer[1]) return wrap;
  if (wrap.sub[1] > transformer[1] + transformer[2]) {
    wrap.sub[1] -= transformer[2];
  }
  else {
    to.prim.saveLI(wrap, wTransformer);
    wrap.sub[1] = transformer[1];
  }
  return wrap;
};
to.prim.IT_AM = function IT_AM(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (wrap.sub[0] === transformer[0]) {
    wrap = to.prim.IT_AD(wrap, to.prim.wrapSubdif(
      to.del(transformer[0], transformer[1], transformer[4]),
    ));
  }
  else if (wrap.sub[0] === transformer[2]) {
    wrap = to.prim.IT_AA(wrap, to.prim.wrapSubdif(
      to.add(transformer[2], transformer[3], to.prim.mockupString(transformer[4])),
    ));
  }
  return wrap;
};
to.prim.IT_AN = function IT_AN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer <= wrap.sub[0]) {
    wrap.sub[0]++;
  }
  return wrap;
};
to.prim.IT_AR = function IT_AR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (-transformer < wrap.sub[0]) {
    wrap.sub[0]--;
  }
  else if (-transformer === wrap.sub[0]) {
    /**
         * In order to preserve the intention of adding characters,
           a new line has to be added and those characters will be added here.
         * Note that those character may not make semantically sense, if they were
           to be inserted in another set of characters that were deleted.
         */
    /// TODO: implement this
  }
  return wrap;
};
// @note May return an array with two subdifs
to.prim.IT_DA = function IT_DA(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (!to.prim.sameRow(wrap, wTransformer)) return wrap;
  if (transformer[1] >= wrap.sub[1] + wrap.sub[2]) return wrap;
  if (wrap.sub[1] >= transformer[1]) {
    wrap.sub[1] += transformer[2].length;
    return wrap;
  }

  return [to.prim.wrapSubdif(to.del(wrap.sub[0], wrap.sub[1], transformer[1] - wrap.sub[1])),
    to.prim.wrapSubdif(to.del(
      wrap.sub[0],
      transformer[1] + transformer[2].length,
      wrap.sub[2] - (transformer[1] - wrap.sub[1]),
    ))];
};
to.prim.IT_DD = function IT_DD(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (!to.prim.sameRow(wrap, wTransformer)) return wrap;
  if (transformer[1] >= wrap.sub[1] + wrap.sub[2]) return wrap;
  if (wrap.sub[1] >= transformer[1] + transformer[2]) {
    wrap.sub = to.del(wrap.sub[0], wrap.sub[1] - transformer[2], wrap.sub[2]);
  }
  else {
    to.prim.saveLI(wrap, wTransformer);
    if (
      transformer[1] <= wrap.sub[1]
      && wrap.sub[1] + wrap.sub[2] <= transformer[1] + transformer[2]
    ) {
      wrap.sub = to.del(wrap.sub[0], wrap.sub[1], 0);
    }
    else if (
      transformer[1] <= wrap.sub[1]
      && wrap.sub[1] + wrap.sub[2] > transformer[1] + transformer[2]
    ) {
      wrap.sub = to.del(
        wrap.sub[0], transformer[1], wrap.sub[1] + wrap.sub[2] - (transformer[1] + transformer[2]),
      );
    }
    else if (
      transformer[1] > wrap.sub[1]
      && wrap.sub[1] + wrap.sub[2] >= transformer[1] + transformer[2]
    ) {
      wrap.sub = to.del(wrap.sub[0], wrap.sub[1], transformer[1] - wrap.sub[1]);
    }
    else {
      wrap.sub = to.del(wrap.sub[0], wrap.sub[1], wrap.sub[2] - transformer[2]);
    }
  }
  return wrap;
};
// @note May return an array with two subdifs
to.prim.IT_DM = function IT_DM(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (wrap.sub[0] === transformer[0]) {
    wrap = to.prim.IT_DD(wrap, to.del(transformer[0], transformer[1], transformer[4]));
  }
  else if (wrap.sub[0] === transformer[2]) {
    wrap = to.prim.IT_DA(
      wrap, to.add(transformer[2], transformer[3], to.prim.mockupString(transformer[4])),
    );
  }
  return wrap;
};
to.prim.IT_DN = function IT_DN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer <= wrap.sub[0]) {
    wrap.sub[0]++;
  }
  return wrap;
};
to.prim.IT_DR = function IT_DR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (-transformer < wrap.sub[0]) {
    wrap.sub[0]--;
  }
  else if (-transformer === wrap.sub[0]) {
    /**
         * The user tries to delete characters that no longer exist,
           therefore his intention was fulfilled by someone else and
           the deletion can be removed.
         */
    wrap.sub = to.del(0, 0, 0);
  }
  return wrap;
};
// @note May return an array with two subdifs
to.prim.IT_MA = function IT_MA(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (wrap.sub[0] === transformer[0]) {
    const delWrap = to.prim.IT_DA(
      to.prim.wrapSubdif(to.del(wrap.sub[0], wrap.sub[1], wrap.sub[4])), wTransformer,
    );
    if (to.isDel(delWrap)) {
      wrap.sub[1] = delWrap.sub[1];
    }
    else {
      return [
        to.prim.wrapSubdif(to.move(
          wrap.sub[0], delWrap[0].sub[1], wrap.sub[2], wrap.sub[3], delWrap[0].sub[2],
        )),
        to.prim.wrapSubdif(to.move(
          wrap.sub[0],
          delWrap[1].sub[1],
          wrap.sub[2],
          wrap.sub[3] + delWrap[0].sub[2],
          delWrap[1].sub[2],
        )),
      ];
    }
  }
  else if (wrap.sub[2] === transformer[0]) {
    const addWrap = to.prim.IT_AA(
      to.prim.wrapSubdif(to.add(wrap.sub[2], wrap.sub[3], to.prim.mockupString(wrap.sub[4]))),
      wTransformer,
    );
    wrap.sub[3] = addWrap.sub[1];
  }
  return wrap;
};
to.prim.IT_MD = function IT_MD(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (wrap.sub[0] === transformer[0]) {
    const delWrap = to.prim.IT_DD(
      to.prim.wrapSubdif(to.del(wrap.sub[0], wrap.sub[1], wrap.sub[4])), wTransformer,
    );
    if (delWrap.meta.informationLost) {
      to.prim.saveLI(wrap, wTransformer, 'del');
    }
    wrap.sub[1] = delWrap.sub[1];
    wrap.sub[4] = delWrap.sub[2];
  }
  else if (wrap.sub[2] === transformer[0]) {
    const addWrap = to.prim.IT_AD(
      to.prim.wrapSubdif(to.add(wrap.sub[2], wrap.sub[3], to.prim.mockupString(wrap.sub[4]))),
      wTransformer,
    );
    if (addWrap.meta.informationLost) {
      to.prim.saveLI(wrap, wTransformer, 'add');
    }
    wrap.sub[3] = addWrap[1];
  }
  return wrap;
};
// @note May return an array with two subdifs
to.prim.IT_MM = function IT_MM(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (wrap.sub[0] === transformer[0]) {
    wrap = to.prim.IT_MD(
      wrap, to.prim.wrapSubdif(to.del(transformer[0], transformer[1], transformer[4])),
    );
  }
  if (wrap.sub[0] === transformer[2]) {
    const delWrap = to.prim.IT_DA(
      to.prim.wrapSubdif(to.del(wrap.sub[0], wrap.sub[1], wrap.sub[4])),
      to.prim.wrapSubdif(to.add(
        transformer[2], transformer[3], to.prim.mockupString(transformer[4]),
      )),
    );
    if (to.isDel(delWrap)) {
      wrap.sub[1] = delWrap.sub[1];
    }
    else {
      // splitting the move into two sections
      const moveWrap1 = to.prim.wrapSubdif(
        to.move(wrap.sub[0], delWrap[0].sub[1], wrap.sub[2], wrap.sub[3], delWrap[0].sub[2]),
      );
      const moveWrap2 = to.prim.wrapSubdif(to.move(
        wrap.sub[0],
        delWrap[1].sub[1],
        wrap.sub[2],
        wrap.sub[3] + delWrap[0].sub[2],
        delWrap[1].sub[2],
      ));
      /// TODO: implement this
      /* if (wrap.sub[2] === transformer[0]) {
                let addWrap = to.prim.IT_AD(
                  to.add(move1[2], move1[3], to.prim.mockupString(move1[4])),
                  to.del(transformer[0], transformer[1], transformer[4]),
                );
                move1[3] = addWrap[1];
                // appending the second move right after the first one
                move2[3] = addWrap[1] + move1[4];
            } */
      console.log('IT_MM not implemented');
      return [moveWrap1, moveWrap2];
    }
  }
  if (wrap.sub[2] === transformer[0]) {
    wrap = to.prim.IT_MD(
      wrap, to.prim.wrapSubdif(to.del(transformer[0], transformer[1], transformer[4])),
    );
  }
  if (wrap.sub[2] === transformer[2]) {
    wrap = to.prim.IT_MA(
      wrap, to.prim.wrapSubdif(
        to.add(transformer[2], transformer[3], to.prim.mockupString(transformer[4])),
      ),
    );
  }
  return wrap;
};
to.prim.IT_MN = function IT_MN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (to.prim.checkLI(wrap, wTransformer, 'add')) {
    to.prim.recoverLI(wrap, 'add');
    return wrap;
  }
  if (to.prim.checkLI(wrap, wTransformer, 'del')) {
    to.prim.recoverLI(wrap, 'del');
    return wrap;
  }
  if (wrap.sub[0] >= transformer) wrap.sub[0]++;
  if (wrap.sub[2] >= transformer) wrap.sub[2]++;
  return wrap;
};
to.prim.IT_MR = function IT_MR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (-transformer < wrap.sub[0]) wrap.sub[0]--;
  else if (-transformer === wrap.sub[0]) {
    /**
         * The text that had to be moved no longer exists, therefore
           the move operation can be removed.
         */
    wrap.sub = to.move(0, 0, 0, 0, 0);
  }
  if (-transformer < wrap.sub[2]) wrap.sub[2]--;
  else if (-transformer === wrap.sub[2]) {
    /**
         * The target row no longer exists, therefore a new row has to be
           added (similarily to IT_AR)
         */
    /// TODO: implement this
  }
  return wrap;
};
to.prim.IT_NA = function IT_NA(wrap, wTransformer) {
  return wrap;
};
to.prim.IT_ND = function IT_ND(wrap, wTransformer) {
  return wrap;
};
to.prim.IT_NM = function IT_NM(wrap, wTransformer) {
  return wrap;
};
to.prim.IT_NN = function IT_NN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer <= wrap.sub) wrap.sub++;
  return wrap;
};
to.prim.IT_NR = function IT_NR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (-transformer < wrap.sub) wrap.sub--;
  else if (-transformer === wrap.sub) {
    /**
         * The place to add the new line might be deleted.
         * The solution would be to add the newline at the same position, or
           if the position does not exist, add a newline at the end of the document.
         */
    /// TODO: implement this
  }
  return wrap;
};
to.prim.IT_RA = function IT_RA(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (-wrap.sub === transformer[0]) {
    // disable the remline
    to.prim.saveLI(wrap, wTransformer);
  }
  return wrap;
};
to.prim.IT_RD = function IT_RD(wrap, wTransformer) {
  return wrap;
};
to.prim.IT_RM = function IT_RM(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (-wrap.sub === transformer[2]) {
    console.log('Transforming remline agains a move addition on the same row!');
    // disable the remline
    to.prim.saveLI(wrap, wTransformer);
  }
  return wrap;
};
to.prim.IT_RN = function IT_RN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer <= -wrap.sub) wrap.sub--;
  return wrap;
};
to.prim.IT_RR = function IT_RR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (-transformer < -wrap.sub) wrap.sub++;
  if (transformer === wrap.sub) {
    /**
         * Trying to delete a row that already had been deleted. The intention was
           fulfilled by someone else, therefore the subdif may be omitted.
         */
    /// TODO: implement this
  }
  return wrap;
};

to.prim.ET_AA = function ET_AA(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (!to.prim.sameRow(wrap, wTransformer)) return wrap;
  // equality removed because of the
  // IT(ET([0, 0, '3'], [0, 0, '2']), [0, 0, '2']) => [0, 0, '3'] example
  if (wrap.sub[1] < transformer[1]) return wrap;
  if (wrap.sub[1] >= transformer[1] + transformer[2].length) {
    wrap.sub[1] -= transformer[2].length;
  }
  else {
    wrap.sub[1] -= transformer[1];
    to.prim.saveRA(wrap, wTransformer);
  }
  return wrap;
};
to.prim.ET_AD = function ET_AD(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (!to.prim.sameRow(wrap, wTransformer)) return wrap;
  if (to.prim.checkLI(wrap, wTransformer)) {
    to.prim.recoverLI(wrap);
  }
  else if (wrap.sub[1] <= transformer[1]) return wrap;
  else {
    wrap.sub[1] += transformer[2];
  }
  return wrap;
};
to.prim.ET_AM = function ET_AM(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (wrap.sub[0] === transformer[0]) {
    wrap.sub = to.prim.ET_AD(wrap, to.del(transformer[0], transformer[1], transformer[4]));
  }
  else if (wrap.sub[0] === transformer[2]) {
    wrap.sub = to.prim.ET_AA(
      wrap, to.add(transformer[2], transformer[3], to.prim.mockupString(transformer[4])),
    );
  }
  return wrap;
};
to.prim.ET_AN = function ET_AN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer < wrap.sub[0]) { /// TODO: revise this
    wrap.sub[0]--;
  }
  return wrap;
};
to.prim.ET_AR = function ET_AR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (-transformer < wrap.sub[0]) {
    wrap.sub[0]++;
  }
  return wrap;
};
// @note May return an array with two subdifs
to.prim.ET_DA = function ET_DA(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (!to.prim.sameRow(wrap, wTransformer)) return wrap;
  if (wrap.sub[1] + wrap.sub[2] <= transformer[1]) return wrap;
  if (wrap.sub[1] >= transformer[1] + transformer[2].length) {
    wrap.sub[1] -= transformer[2].length;
  }
  else if (
    transformer[1] <= wrap.sub[1]
    && wrap.sub[1] + wrap.sub[2] <= transformer[1] + transformer[2].length
  ) {
    wrap.sub[1] -= transformer[1];
    to.prim.saveRA(wrap, wTransformer);
  }
  else if (
    transformer[1] <= wrap.sub[1]
    && wrap.sub[1] + wrap.sub[2] > transformer[1] + transformer[2].length
  ) {
    const delWrap1 = to.prim.wrapSubdif(to.del(
      wrap.sub[0],
      wrap.sub[1] - transformer[1],
      transformer[1] + transformer[2].length - wrap.sub[1],
    ));
    const delWrap2 = to.prim.wrapSubdif(to.del(
      wrap.sub[0],
      transformer[1],
      wrap.sub[1] + wrap.sub[2] - transformer[1] - transformer[2].length,
    ));
    to.prim.saveRA(delWrap1, wTransformer);
    return [delWrap1, delWrap2];
  }
  else if (
    transformer[1] > wrap.sub[1]
    && transformer[1] + transformer[2].length <= wrap.sub[1] + wrap.sub[2]
  ) {
    const delWrap1 = to.prim.wrapSubdif(to.del(wrap.sub[0], 0, transformer[2].length));
    const delWrap2 = to.prim.wrapSubdif(to.del(
      wrap.sub[0], wrap.sub[1], wrap.sub[2] - transformer[2].length,
    ));
    to.prim.saveRA(delWrap1, wTransformer);
    return [delWrap1, delWrap2];
  }
  else {
    const delWrap1 = to.prim.wrapSubdif(to.del(
      wrap.sub[0], 0, wrap.sub[1] + wrap.sub[2] - transformer[1],
    ));
    const delWrap2 = to.prim.wrapSubdif(to.del(
      wrap.sub[0], wrap.sub[1], transformer[1] - wrap.sub[1],
    ));
    to.prim.saveRA(delWrap1, wTransformer);
    return [delWrap1, delWrap2];
  }
  return wrap;
};
// @note May return an array with two subdifs
to.prim.ET_DD = function ET_DD(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (!to.prim.sameRow(wrap, wTransformer)) return wrap;
  if (to.prim.checkLI(wrap, wTransformer)) {
    to.prim.recoverLI(wrap);
  }
  else if (transformer[1] >= wrap.sub[1] + wrap.sub[2]) return wrap;
  else if (wrap.sub[1] >= transformer[1]) {
    wrap.sub[1] += transformer[2];
  }
  else {
    const delWrap1 = to.prim.wrapSubdif(to.del(
      wrap.sub[0], wrap.sub[1], transformer[1] - wrap.sub[1],
    ));
    const delWrap2 = to.prim.wrapSubdif(to.del(
      wrap.sub[0], transformer[1] + transformer[2], wrap.sub[1] + wrap.sub[2] - transformer[1],
    ));
    return [delWrap1, delWrap2];
  }
  return wrap;
};
// @note May return an array with two subdifs
/// TODO: the wrap might be losing some meta information here
to.prim.ET_DM = function ET_DM(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (wrap.sub[0] === transformer[0]) {
    wrap = to.prim.ET_DD(wrap, to.del(transformer[0], transformer[1], transformer[4]));
  }
  else if (wrap.sub[0] === transformer[2]) {
    wrap = to.prim.ET_DA(wrap, to.add(
      transformer[2], transformer[3], to.prim.mockupString(transformer[4]),
    ));
  }
  return wrap;
};
to.prim.ET_DN = function ET_DN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer < wrap.sub[0]) { /// TODO: revise this
    wrap.sub[0]--;
  }
  return wrap;
};
to.prim.ET_DR = function ET_DR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (-transformer < wrap.sub[0]) {
    wrap.sub[0]++;
  }
  return wrap;
};
to.prim.ET_DN = function ET_DN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer < wrap.sub[0]) { /// TODO: revise this
    wrap.sub[0]--;
  }
  return wrap;
};
to.prim.ET_DR = function ET_DR(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (-transformer < wrap.sub[0]) {
    wrap.sub[0]++;
  }
  return wrap;
};
// @note May return an array with two subdifs
to.prim.ET_MA = function ET_MA(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (wrap.sub[0] === transformer[0]) {
    const delWrap = to.prim.ET_DA(
      to.prim.wrapSubdif(to.del(wrap.sub[0], wrap.sub[1], wrap.sub[4])), transformer,
    );
    if (to.isDel(delWrap)) {
      wrap.sub[1] = delWrap.sub[1];
      wrap.metaDel.relative = delWrap.meta.relative;
      wrap.metaDel.context.addresser = delWrap.meta.context.addresser;
    }
    else {
      const delWrap1 = delWrap[0];
      const delWrap2 = delWrap[1];
      const moveWrap1 = to.prim.wrapSubdif(to.move(
        wrap.sub[0], delWrap1.sub[1], wrap.sub[2], wrap.sub[3], delWrap1.sub[2],
      ));
      moveWrap1.metaDel = delWrap1.meta;
      const moveWrap2 = to.prim.wrapSubdif(to.move(
        wrap.sub[0], delWrap2.sub[1], wrap.sub[2], wrap.sub[3] + delWrap1.sub[2], delWrap2.sub[2],
      ));
      moveWrap2.metaDel = delWrap2.meta;
      return [moveWrap1, moveWrap2];
    }
  }
  else if (wrap.sub[2] === transformer[0]) {
    const addWrap = to.prim.ET_AA(
      to.prim.wrapSubdif(to.add(wrap.sub[2], wrap.sub[3], to.prim.mockupString(wrap.sub[4]))),
      transformer,
    );
    wrap.sub[3] = addWrap.sub[1];
    wrap.metaAdd.relative = addWrap.meta.relative;
    wrap.metaAdd.context.addresser = addWrap.meta.context.addresser;
  }
  return wrap;
};
// @note May return an array with two subdifs
to.prim.ET_MD = function ET_MD(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (wrap.sub[0] === transformer[0]) {
    const delWrap = to.prim.ET_DD(
      to.prim.wrapSubdif(to.del(wrap.sub[0], wrap.sub[1], wrap.sub[4])), transformer,
    );
    if (to.isDel(delWrap)) {
      wrap.sub = delWrap.sub;
    }
    else {
      const delWrap1 = delWrap[0];
      const delWrap2 = delWrap[1];
      const moveWrap1 = to.prim.wrapSubdif(to.move(
        wrap.sub[0], delWrap1.sub[1], wrap.sub[2], wrap.sub[3], delWrap1.sub[2],
      ));
      const moveWrap2 = to.prim.wrapSubdif(to.move(
        wrap.sub[0], delWrap2.sub[1], wrap.sub[2], wrap.sub[3] + delWrap1.sub[2], delWrap2.sub[2],
      ));
      return [moveWrap1, moveWrap2];
    }
  }
  else if (wrap.sub[2] === transformer[0]) {
    const addWrap = to.prim.ET_AD(
      to.prim.wrapSubdif(
        to.add(wrap.sub[2], wrap.sub[3], to.prim.mockupString(wrap.sub[4])),
      ),
      transformer,
    );
    wrap.sub[3] = addWrap[1];
  }
  return wrap;
};
// @note May return an array with two subdifs
to.prim.ET_MM = function ET_MM(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  /// TODO: finish
  console.log('Not implemented ET_MM');
  return wrap;
};
to.prim.ET_MN = function ET_MN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer < wrap.sub[0]) wrap.sub[0]--;
  else if (transformer === wrap.sub[0]) {
    to.prim.saveLI(wrap, wTransformer, 'del');
  }

  if (transformer < wrap.sub[2]) wrap.sub[2]--;
  else if (transformer === wrap.sub[2]) {
    to.prim.saveLI(wrap, wTransformer, 'add');
  }
  return wrap;
};
to.prim.ET_MR = function ET_MR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (-transformer < wrap.sub[0]) wrap.sub[0]++;
  if (-transformer < wrap.sub[2]) wrap.sub[2]++;
  return wrap;
};
to.prim.ET_NA = function ET_NA(wrap, wTransformer) {
  return wrap;
};
to.prim.ET_ND = function ET_ND(wrap, wTransformer) {
  return wrap;
};
to.prim.ET_NM = function ET_NM(wrap, wTransformer) {
  return wrap;
};
to.prim.ET_NN = function ET_NN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer < wrap.sub) wrap.sub--;
  return wrap;
};
to.prim.ET_NR = function ET_NR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (-transformer < wrap.sub) wrap.sub++;
  return wrap;
};
to.prim.ET_RA = function ET_RA(wrap, wTransformer) {
  /// TODO: this might be redundant
  if (to.prim.checkLI(wrap, wTransformer)) {
    to.prim.recoverLI(wrap);
  }
  return wrap;
};
to.prim.ET_RD = function ET_RD(wrap, wTransformer) {
  return wrap;
};
to.prim.ET_RM = function ET_RM(wrap, wTransformer) {
  /// TODO: this might be redundant
  if (to.prim.checkLI(wrap, wTransformer)) {
    to.prim.recoverLI(wrap);
  }
  return wrap;
};
to.prim.ET_RN = function ET_RN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer < -wrap.sub) wrap.sub++;
  return wrap;
};
to.prim.ET_RR = function ET_RR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (-transformer < -wrap.sub) wrap.sub--;
  return wrap;
};

to.applyAdd = function applyAdd(previousValue, subdif) {
  if (subdif[1] > previousValue.length) {
    console.log('applyAdd subdif position too large!');
    console.log(subdif);
    console.log(previousValue);
    return previousValue;
  }

  return (previousValue.substring(0, subdif[1]) + subdif[2] + previousValue.substring(subdif[1]));
};

to.applyDel = function applyDel(previousValue, subdif) {
  if (subdif[1] + subdif[2] > previousValue.length) {
    console.log('applyDel subdif position too large!');
    console.log(previousValue);
    console.log(subdif);
    return previousValue;
  }

  return (previousValue.substring(0, subdif[1])) + previousValue.substring(subdif[1] + subdif[2]);
};

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
to.textToDif = function textToDif(targetRow, targetPosition, content, trailingRowText) {
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
};

module.exports = to;
