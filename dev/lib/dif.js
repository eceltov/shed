/**
 * @note Dif definition: A dif is an array of primitive operations called subdifs.
   A primitive operation can be adding newlines (called newline), removing empty lines (called
   remlines), adding text (called add) deleting text (called del) or moving text to a different location (called move).

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
      will result in the new content of row 3 being '16789' (4 characters after the 1st will be removed).

    - move: [source_row, source_position, target_row, target_position, length]; where all variables are positive integers or zeroes.
      Example: let the content on row 0 be "1234" and content on row 1 be "abcd". Applying the subdif [0, 1, 1, 2, 2]
      will result in row 0 being "14" and row 1 being "ab23cd". For sake of implementation simplicity, it is assumed
      that the move instruction cannot move content on the same row.

    Example dif: [2, -3, [1, 2, 'abc'], [3, 3, 1]]

    @note Operation definition: An operation is an array with two elements. The first is an array
    containing user transaction metadata (userID, commitSerialNumber, preceding userID,
    preceding commitSerialNumber) and the second element is a merged dif describing the changes
    made by the author. 

    Note that an operation contains enough information to determine its total ordering.

    @note Server ordering (SO): Server ordering is defined by the order the server relays
    operations to other users. The operation are received by all users in the same order,
    therefore server ordering stays the same for all users. 

    @note Direct dependancy: An operation is directly dependant on the operation described by its
    preceding userID and preceding commitSerialNumber and all operations before that in server
    ordering.

    @note Local dependancy: An operation is locally dependant on all previous operations made by
    the same user. Note that local dependancy may contain operations not included in direct
    dependancy. This happens when a user sends multiple operations before receiving them from
    the server, as these operations may all have the same preceding userID and preceding
    commitSerialNumber.

    @note An operation is only dependant an all directly and locally dependant operations.
    All other operations are independant.

    @note Total ordering:
    Given the operations A and B: A => B (B directly follows A) if and only if B directly
    follows A in server ordering.

    Given the operations A and B: A *=> B (B follows A) if and only if:

    1) A => B
    OR
    2) There exist an operation C, such that A *=> C => B
*/

function dlog(name, obj, mode="default") {
    if (mode === "default") {
        console.log(name + ":", JSON.stringify(obj));
        console.log();
    }
    else if (mode === "wDif") {
        console.log(name + ":");
        obj.forEach(wrap => console.log(JSON.stringify(wrap)));
        console.log();
    }
    else if (mode === "wDifs") {
        console.log(name + ":");
        obj.forEach(wDif => {
            wDif.forEach(wrap => console.log(JSON.stringify(wrap)));
            console.log("-----------------------------");
        });
        console.log();
    }
}

if (typeof to === 'undefined') {
    // Export for browsers
    var to = {};
}

to.prim = {};

to.add = function(row, position, content) {
    return [row, position, content];
}
to.del = function(row, position, count) {
    return [row, position, count];
}
to.move = function(source_row, source_position, target_row, target_position, length) {
    return [source_row, source_position, target_row, target_position, length];
}
to.newline = function(row) {
    return row;
}
to.remline = function(row) {
    if (row === 0) console.log("Creating remline with row = 0!");
    return -row;
}

to.isAdd = function(subdif) {
    let s = to.prim.unwrapSubdif(subdif);
    return (s.constructor === Array && s.length === 3 && typeof s[2] === 'string');
}

to.isDel = function(subdif) {
    let s = to.prim.unwrapSubdif(subdif);
    return (s.constructor === Array && s.length === 3 && typeof s[2] === 'number');
}

to.isNewline = function(subdif) {
    let s = to.prim.unwrapSubdif(subdif);
    return (typeof s === 'number' && s >= 0);
}

to.isRemline = function(subdif) {  
    let s = to.prim.unwrapSubdif(subdif);
    return (typeof s === 'number' && s < 0); // line 0 cannot be deleted
}

to.isMove = function(subdif) {
    let s = to.prim.unwrapSubdif(subdif);
    return (s.constructor === Array && s.length === 5);
}

to.applyDif = function(wDif, document) {
    if (document.constructor === Array) {
        return to.applyDifTest(wDif, document);
    }
    else {
        return to.applyDifAce(wDif, document);
    }
}

to.undoDif = function(wDif, document) {
    if (document.constructor === Array) {
        return to.undoDifTest(wDif, document);
    }
    else {
        return to.undoDifAce(wDif, document);
    }
}

to.applyDifAce = function(wDif, document) {
    wDif.forEach((wrap) => {
        let subdif = wrap.sub;
        if (to.isAdd(subdif)) {
            document.insert({row: subdif[0], column: subdif[1]}, subdif[2]);
        }
        else if (to.isDel(subdif)) {
            document.removeInLine(subdif[0], subdif[1], subdif[1] + subdif[2]);
        }
        else if (to.isMove(subdif)) {
            let movedText = document.getLine(subdif[0]).substr(subdif[1], subdif[4]);
            document.insert({row: subdif[2], column: subdif[3]}, movedText);
            document.removeInLine(subdif[0], subdif[1], subdif[1] + subdif[4]);
        }
        else if (to.isNewline(subdif)) {
            document.insertNewLine({row: subdif, column: 0});
        }
        else if (to.isRemline(subdif) && !wrap.meta.informationLost) {
            document.removeNewLine(-subdif - 1);
        }
        else if (to.isRemline(subdif) && wrap.meta.informationLost) {
        // do nothing
        }
        else {
            console.log("Received unknown subdif!", subdif);
        }
    });
    return document;
}

to.undoDifAce = function(wDif, document) {
    let wDifCopy = to.prim.deepCopy(wDif);
    wDifCopy.reverse(); // subdifs need to be undone in reverse order
    wDifCopy.forEach((wrap) => {
        let subdif = wrap.sub;
        if (to.isAdd(subdif)) {
            document.removeInLine(subdif[0], subdif[1], subdif[1] + subdif[2].length);
        }
        else if (to.isDel(subdif)) {
            document.insert({row: subdif[0], column: subdif[1]}, '#'.repeat(subdif[2]));
        }
        else if (to.isMove(subdif)) {
            let movedText = document.getLine(subdif[2]).substr(subdif[3], subdif[4]);
            document.insert({row: subdif[0], column: subdif[1]}, movedText);
            document.removeInLine(subdif[2], subdif[3], subdif[3] + subdif[4]);
        }
        else if (to.isNewline(subdif)) {
            document.removeNewLine(subdif - 1);
        }
        else if (to.isRemline(subdif)) {
            document.insertNewLine({row: -subdif, column: 0});
        }
        else {
            console.log("Received unknown dif!");
        }
    });
    return document;
}

to.applyDifTest = function(wDif, document) {
    console.log("before:",  document);
    wDif.forEach((wrap) => {
      let subdif = to.prim.unwrapSubdif(wrap);
      if (to.isAdd(subdif)) {
        console.log("subdif:",  subdif);
        let row = document[subdif[0]];
        document[subdif[0]] = row.substr(0, subdif[1]) + subdif[2] + row.substr(subdif[1]);
      }
      else if (to.isDel(subdif)) {
        let row = document[subdif[0]];
        document[subdif[0]] = row.substr(0, subdif[1]) + row.substr(subdif[1] + subdif[2]);
      }
      else if (to.isMove(subdif)) {
        let sourceRow = document[subdif[0]];
        let targetRow = document[subdif[2]];
        let movedText = sourceRow.substr(subdif[1], subdif[4]);
        document[subdif[0]] = sourceRow.substr(0, subdif[1]) + sourceRow.substr(subdif[1] + subdif[4]);
        document[subdif[2]] = targetRow.substr(0, subdif[3]) + movedText + targetRow.substr(subdif[3]);
      }
      else if (to.isNewline(subdif)) {
        document.splice(subdif, 0, "");
      }
      ///TODO: don't forget to implement the information lost bit in the live version
      else if (to.isRemline(subdif) && !wrap.meta.informationLost) {
        document.splice(-subdif, 1);
      }
      else if (to.isRemline(subdif) && wrap.meta.informationLost) {
        // do nothing
      }
      else {
          console.log("Received unknown subdif!", subdif);
      }
    });
    console.log("after:", document);
    return document;
}

to.undoDifTest = function(wDif, document) {
    let wDifCopy = to.prim.deepCopy(wDif);
    wDifCopy.reverse(); // subdifs need to be undone in reverse order
    wDifCopy.forEach((wrap) => {
        let subdif = wrap.sub;
        if (to.isAdd(subdif)) {
            let row = document[subdif[0]];
            document[subdif[0]] = row.substr(0, subdif[1]) + row.substr(subdif[1] + subdif[2].length);
        }
        else if (to.isDel(subdif)) {
            let row = document[subdif[0]];
            document[subdif[0]] = row.substr(0, subdif[1]) + '#'.repeat(subdif[2]) + row.substr(subdif[1]);
        }
        else if (to.isMove(subdif)) {
            let sourceRow = document[subdif[2]];
            let targetRow = document[subdif[0]];
            let movedText = sourceRow.substr(subdif[3], subdif[4]);
            document[subdif[2]] = sourceRow.substr(0, subdif[3]) + sourceRow.substr(subdif[3] + subdif[4]);
            document[subdif[0]] = targetRow.substr(0, subdif[1]) + movedText + targetRow.substr(subdif[1]);
        }
        else if (to.isNewline(subdif)) {
            document.splice(subdif, 1);
        }
          else if (to.isRemline(subdif)) {
            document.splice(-subdif, 0, "");
        }
        else {
            console.log("Received unknown dif!");
        }
    });
    return document;
}

to.UDRTest = function(dMessage, document, wdOriginalHB, SO_original, log) {
    // creating new document so that changing it is not propagated to the user
    if(log) console.log('before:', document);
    let wdHB = to.prim.deepCopy(wdOriginalHB);
    let SO = [...SO_original, dMessage[0]];

    if(log) console.log('message:', dMessage);

    // finding an operation in HB which satisfies: operation => message (message directly follows the operation)
    let TO_HBIndex = to.prim.findTOIndex(dMessage, wdHB, SO);
    let dependantHBIndex = to.prim.findLastDependancyIndex(dMessage, wdHB);
    
    let undoIndex = 0;

    ///TODO: could this be omitted?
    // handling the case when the message is part of a 'message chain'
    // if it is, it will be placed directly after the previous message in the chain (in HB)
    for (let i = 0; i < wdHB.length; i++) {
        let operation = wdHB[i];
        // message is part of a chain
        if (dMessage[0][0] === operation[0][0] && dMessage[0][2] === operation[0][2] && dMessage[0][3] === operation[0][3]) {
            undoIndex = i + 1;
        }
    }

    if(log && undoIndex === 0) console.log('Not part of chain');

    // handling the case when the message is not part of a 'message chain'
    // in this case, the message is placed according to total ordering
    // the strategy is to take operations from HB from the back and determine their total ordering
    // if the operation in HB is part of a message chain, and it's first member is present in SO, then the
    //  received message will be placed after the last message chain member (the message chain effectively shares
    //  it's first member's SO)
    if (undoIndex === 0) {
        for (let i = wdHB.length - 1; i >= 0; i--) {
            let operation = wdHB[i];
            let operationSOIndex = to.prim.SOIndex(operation, SO);
            let partOfChain = false;

            // the operation is not in SO, but it could be part of a chain
            if (operationSOIndex === -1) {
                // look from the beginning of HB to find the first member of the message chain, if any
                // if the first member is present in SO, than the message has to be placed after the last message chain member
                for (let j = 0; j < i; j++) {
                    let chainMember = wdHB[j];
                    if (chainMember[0][0] === operation[0][0] && chainMember[0][2] === operation[0][2] && chainMember[0][3] === operation[0][3]) {
                        // the operation is a part of a chain, but it could be a chain that has not yet arrived
                        if (to.prim.SOIndex(chainMember, SO) === -1) {
                            break;
                        }
                        // the operation is a part of a chain that partially arrived
                        partOfChain = true;
                        break;
                    }
                }
            }

            // the operation is not present in SO and is not part of a chain, therefore it will be ordered after the message
            if (!partOfChain && operationSOIndex === -1) {
                continue;
            }
            // because the message has to have a higher SOIndex than any message in HB, it will be placed after the first operation that is present in SO
            undoIndex = i + 1;
            break;
        }
    }

    if(log) console.log('dependantHBIndex:', dependantHBIndex);
    if(log) console.log('undoIndex:', undoIndex);
    if(log) console.log('TO_HBIndex:', TO_HBIndex);
    if(log) console.log('wdHB', wdHB.forEach(entry => console.log(JSON.stringify(entry))));

    let wdMessage = [dMessage[0], to.prim.wrapDif(dMessage[1])];

    // case when no operations need to be undone
    if (undoIndex === wdHB.length) {
        if(log) console.log('UDR no ops need to be undone');
        let wdTransformedMessage = to.GOTCA(wdMessage, wdHB, SO, log);
        //let transformedMessage = [wTransformedMessage[0], to.merge(to.prim.unwrapDif(wTransformedMessage[1]))];
        if(log) console.log('wdTransformedMessage:', JSON.stringify(wdTransformedMessage));

        document = to.applyDif(wdTransformedMessage[1], document);
        //log(wTransformedMessage);

        if(log) console.log('after:', document);

        return {
            document: document,
            HB: [...wdHB, wdTransformedMessage]
        };
    }

    let wdUndoneHB = wdHB.slice(undoIndex);
    wdHB = wdHB.slice(0, undoIndex);
    // undo independant operations
    for (let i = wdUndoneHB.length - 1; i >= 0; i--) {
        document = to.undoDif(wdUndoneHB[i][1], document);
    }

    if(log) console.log('undo independant ops:', document);
    if(log) console.log('wdUndoneHB', wdUndoneHB.forEach(entry => console.log(JSON.stringify(entry))));

    // transforming and applying message
    let wdTransformedMessage = to.GOTCA(wdMessage, wdHB, SO, log); // giving GOTCA only the relevant part of HB (from start to the last dependant operation)
    document = to.applyDif(wdTransformedMessage[1], document);

    if(log) console.log('wdTransformedMessage:', JSON.stringify(wdTransformedMessage));
    if(log) console.log();

    // preparing undone difs for transformation
    let wdUndoneDifs = [];
    for (let i = 0; i < wdUndoneHB.length; i++) {
        wdUndoneDifs.push(to.prim.deepCopy(wdUndoneHB[i][1]));
    }

    let wdReversedUndoneDifs = [];
    for (let i = wdUndoneHB.length - 1; i >= 0; i--) {
        let wdUndoneDif = to.prim.deepCopy(wdUndoneHB[i][1]);
        wdUndoneDif.reverse();
        wdReversedUndoneDifs.push(wdUndoneDif);
    }

    // transforming undone difs
    let wdTransformedUndoneDifs = []; // undone difs that are transformed
    if(log) dlog('wdUndoneDifs', wdUndoneDifs, "wDifs");
    let wiFirstUndoneDif = to.prim.makeIndependant(wdUndoneDifs[0]);
    if(log) dlog('wiFirstUndoneDif', wiFirstUndoneDif, "wDif");
    let wdFirstTransformedUndoneDif = to.prim.LIT(wiFirstUndoneDif, wdTransformedMessage[1]);
    if(log) dlog('wdFirstTransformedUndoneDif', wdFirstTransformedUndoneDif, "wDif");
    wdTransformedUndoneDifs.push(wdFirstTransformedUndoneDif);
    let wdLETDif = []; // chronologically reversed
    let wdLITDif = [...wdTransformedMessage[1]];
    //if(log) console.log('wdFirstTransformedUndoneDif:', JSON.stringify(wdFirstTransformedUndoneDif));
    for (let i = 1; i < wdUndoneDifs.length; i++) {
        //if(log) console.log('wdUndoneDifs[i]:', JSON.stringify(wdUndoneDifs[i]));
        //if(log) console.log();
        wdLETDif.unshift(...wdReversedUndoneDifs[wdReversedUndoneDifs.length - i]);
        //if(log) console.log('wdLETDif:', JSON.stringify(wdLETDif));
        //if(log) console.log();
        let wiUndoneDif = to.prim.makeIndependant(wdUndoneDifs[i]);
        let wiExcludedDif = to.prim.LET(wiUndoneDif, wdLETDif);
        //if(log) console.log('wiExcludedDif:', JSON.stringify(wiExcludedDif));
        //if(log) console.log();
        wdLITDif.push(...wdTransformedUndoneDifs[i - 1]);
        //if(log) console.log('wdLITDif:', JSON.stringify(wdLITDif));
        //if(log) console.log();
        let wdTransformedUndoneDif = to.prim.LIT(wiExcludedDif, wdLITDif, log);
        //if(log) console.log('wdTransformedUndoneDif:', JSON.stringify(wdTransformedUndoneDif));
        //if(log) console.log();
        wdTransformedUndoneDifs.push(wdTransformedUndoneDif);
    }


    // unwrapping transformed wraps
    //let transformedUndoneDifs = [];
    //wTransformedUndoneDifs.forEach(wrap => transformedUndoneDifs.push(to.prim.unwrapDif(wrap)));



    if(log) dlog('wdTransformedUndoneDifs', wdTransformedUndoneDifs, "wDifs");
    // redoing undone difs
    //transformedUndoneDifs.forEach(dif => document = to.applyDif(dif, document));
    wdTransformedUndoneDifs.forEach(wdDif => document = to.applyDif(wdDif, document));

    // creating operations from undone difs
    let wdTransformedUndoneOperations = [];
    wdTransformedUndoneDifs.forEach((wDif, i) => {
        let wdTransformedOperation = [wdUndoneHB[i][0], wDif];
        wdTransformedUndoneOperations.push(wdTransformedOperation);
    });

    //if(log) console.log('mid HB:', HB);


    // updating HB
    wdHB.push(wdTransformedMessage);
    wdTransformedUndoneOperations.forEach(wdOperation => wdHB.push(wdOperation));

    if(log) console.log('UDR full run');
    //log(transformed_message);

    if(log) console.log('after:', document);
    //if(log) console.log('after HB:', HB);

    return {
        document: document,
        HB: wdHB
    };
}

to.GOTCA = function(wdMessage, wdHB, SO, log=false) {
    /**
     *  @note Due to the fact that all operations are being received by all clients in the same
         order, the only independant operations from the received one can be those made by the
        local client after the received ones generation, as all others are present in the context
        of the received operation.
    */

    // array of difs of independant operations in HB
    let wdIndependantDifs = [];
    // causally preceding difs with an index higher than last_directly_dependant_index
    let wdLocallyDependantDifs = [];
    let locallyDependantIndices = [];

    let lastDirectlyDependantIndex = SO.findIndex((operation) => operation[0] === wdMessage[0][2] && operation[1] === wdMessage[0][3]);
    let lastDirectlyDependantHBIndex = -1;

    //if(log) console.log('lastDirectlyDependantIndex', lastDirectlyDependantIndex);

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

    if(log) console.log('wdIndependantDifs:');
    if(log) wdIndependantDifs.forEach(wDif => console.log(JSON.stringify(wDif)));
    if(log) console.log();
    if(log) console.log('wdLocallyDependantDifs:');
    if(log) wdLocallyDependantDifs.forEach(wDif => console.log(JSON.stringify(wDif)));
    if(log) console.log();


    // there are no independant messages, therefore no transformation is needed
    if (wdIndependantDifs.length === 0) {
        //console.log('GOTCA no independant messages');
        return wdMessage; 
    }

    let wdMessageDif = wdMessage[1];
    let wiMessageDif = to.prim.makeIndependant(wdMessageDif);

    // there are no locally dependant operations in HB, therefore all independant operations can be included directly
    ///TODO: or if all locally dependant difs are empty
    if (wdLocallyDependantDifs.length === 0) {
        if(log) console.log('GOTCA no locally dependant ops');
        let wdTransformationDif = [];
        wdIndependantDifs.forEach(wdDif => wdTransformationDif.push(...wdDif));
        if(log) console.log('wiMessageDif', JSON.stringify(wiMessageDif));
        if(log) console.log();
        let wTransformedMessageDif = to.prim.LIT(wiMessageDif, wdTransformationDif);
        //if(log) console.log('wTransformedMessageDif', JSON.stringify(wTransformedMessageDif));
        wdMessage[1] = wTransformedMessageDif;
        //console.log('GOTCA no locally dependant operations');
        //log(message);
        return wdMessage;
    }

    // preparing difs for transformation
    wdLocallyDependantDifs = to.prim.deepCopy(wdLocallyDependantDifs);

    //let TO_HB_index = to.prim.findTOIndex(message, HB, SO);
    let dependantHBIndex = to.prim.findLastDependancyIndex(wdMessage, wdHB);
    let wdReversedTransformerDifs = [];
    //for (let i = TO_HB_index; i > lastDirectlyDependantIndex; i--) {
    for (let i = dependantHBIndex; i > lastDirectlyDependantIndex; i--) {
        let wdDif = to.prim.deepCopy(wdHB[i][1]);
        wdDif.reverse();
        wdReversedTransformerDifs.push(wdDif);
    }

    //if(log) console.log('wdLocallyDependantDifs:', JSON.stringify(wdLocallyDependantDifs));
    //if(log) console.log('wdReversedTransformerDifs:', JSON.stringify(wdReversedTransformerDifs));


    // [..., last_dep_index=20, indep1, indep2, loc_dep0=23, indep3, loc_dep1=25]

    // transformation
    let wdTransformedDifs = []; // EOL' in wrapped dif form
    let wdLETDif = to.prim.dissolveArrays(wdReversedTransformerDifs.slice(wdReversedTransformerDifs.length - (locallyDependantIndices[0] - (lastDirectlyDependantIndex + 1))));
    let wdLITDif = [];
    if(log) console.log('wdLocallyDependantDifs[0]:', JSON.stringify(wdLocallyDependantDifs[0]));
    if(log) console.log();
    let wiFirstTransformedDif = to.prim.LET(to.prim.makeIndependant(wdLocallyDependantDifs[0]), wdLETDif); // this now has mutually independant subdifs, they need to be made dependant
    let wdFirstTransformedDif = to.prim.makeDependant(wiFirstTransformedDif);
    if(log) console.log('wdFirstTransformedDif:', JSON.stringify(wdFirstTransformedDif));
    if(log) console.log();
    wdTransformedDifs.push(wdFirstTransformedDif);
    for (let i = 1; i < wdLocallyDependantDifs.length; i++) {
        wdLETDif = to.prim.dissolveArrays(wdReversedTransformerDifs.slice(wdReversedTransformerDifs.length - (locallyDependantIndices[i] - (lastDirectlyDependantIndex + 1))));
        let wiIndependantExcludedDif = to.prim.LET(to.prim.makeIndependant(wdLocallyDependantDifs[i]), wdLETDif); // this is also mutually independant
        wdLITDif.push(...wdTransformedDifs[i - 1]);
        let wdTransformedDif = to.prim.LIT(wiIndependantExcludedDif, wdLITDif);
        wdTransformedDifs.push(wdTransformedDif);
    }
    let wdReversedTransformedDifs = to.prim.deepCopy(wdTransformedDifs)
    wdReversedTransformedDifs.reverse();
    wdReversedTransformedDifs.forEach(wdDif => wdDif.reverse());
    if(log) console.log('wdReversedTransformedDifs:', JSON.stringify(to.prim.dissolveArrays(to.prim.deepCopy(wdReversedTransformedDifs))));
    if(log) console.log();
    if(log) console.log('wiMessageDif:', JSON.stringify(wiMessageDif));
    if(log) console.log();

    let wiExcludedMessageDif = to.prim.LET(wiMessageDif, to.prim.dissolveArrays(wdReversedTransformedDifs));
    
    if(log) console.log('wiExcludedMessageDif:', JSON.stringify(wiExcludedMessageDif));
    if(log) console.log();
    
    
    let prependingIndependantDifs = wdHB.slice(lastDirectlyDependantIndex + 1, to.prim.findFirstLocalDependancyIndex(wdMessage, wdHB)); // independant difs between the last directly and first locally dependant dif
    //let prependingIndependantDifs = HB.slice(lastDirectlyDependantIndex + 1, TO_HB_index); // independant difs between the last directly and first locally dependant dif
    prependingIndependantDifs.forEach((operation, index) => prependingIndependantDifs[index] = operation[1]);

    let wdHBLITDif = [];
    for (let i = lastDirectlyDependantHBIndex + 1; i < wdHB.length; i++) {
        wdHBLITDif.push(...wdHB[i][1]);
    }
    if(log) console.log('wdHBLITDif:', JSON.stringify(wdHBLITDif));
    if(log) console.log();
    let wdTransformedMessageDif = to.prim.LIT(wiExcludedMessageDif, wdHBLITDif);
    //if(log) console.log('wdTransformedMessageDif post LIT:', JSON.stringify(wdTransformedMessageDif));
    wdMessage[1] = wdTransformedMessageDif;
    //console.log('GOTCA full run');
    //log(message);
    return wdMessage;
}

to.merge = function(dif_ref) {
    let dif = JSON.parse(JSON.stringify(dif_ref)); // deep copy ///TODO: use the function for this

    // remove empty Adds/Dels/Moves
    for (let i = 0; i < dif.length; ++i) {
        if (to.isAdd(dif[i])) {
            if (dif[i][2] === "") {
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
            let end_pos = dif[i][1] + dif[i][2].length;
            if (dif[i][0] === dif[i+1][0] &&      // they are on the same row
                end_pos === dif[i+1][1] &&           // they are adjacent
                to.isAdd(dif[i+1])                   // the next entry is of type Add
            ) {
                dif[i] = [dif[i][0], dif[i][1], dif[i][2] + dif[i+1][2]];
                dif.splice(i+1, 1);
                i--; // decrement i so that the merged subdif will be compared with the next one
            }
        }
    }

    // join adjacent Dels
    for (let i = 0; i < dif.length - 1; ++i) { // so that there is a next entry
        if (to.isDel(dif[i])) {
            if (dif[i][0] === dif[i+1][0] &&        // they are on the same row
                to.isDel(dif[i+1])                  // the next entry is of type Del
            ) {
                if (dif[i][1] + dif[i][2] === dif[i+1][1]) {    // they are adjacent (the next one is on a higher position)
                    dif[i] = [dif[i][0], dif[i][1], dif[i][2] + dif[i+1][2]];
                    dif.splice(i+1, 1);
                    i--;
                }
                else if (dif[i+1][1] + dif[i+1][2] == dif[i][1]) {  // they are adjacent (the next one is on a lower position)
                    dif[i] = [dif[i][0], dif[i+1][1], dif[i][2] + dif[i+1][2]];
                    dif.splice(i+1, 1);
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
            dif.splice(i+1, 1);
        }
    }

    ///TODO: reorder newlines?
    
    // order Adds and Dels by row
    ///TODO: implement this with move instruction in mind
    /*const first_non_nl = dif.findIndex(el => !to.isNewline(el));
    const first_reml = dif.findIndex(el => to.isRemline(el));
    const non_nl_el_count = dif.length - ((first_non_nl >= 0) ? first_non_nl : 0) - ((first_reml >= 0) ? (dif.length - first_reml) : 0);
    if (non_nl_el_count > 1) {
        let content = dif.slice(((first_non_nl >= 0) ? first_non_nl : 0), ((first_reml >= 0) ? first_reml : dif.length));
        let newlines = dif.slice(0, ((first_non_nl >= 0) ? first_non_nl : 0));
        let remlines = dif.slice(((first_reml >= 0) ? first_reml : dif.length), dif.length);
        content.sort(function(a,b) { return a[0] > b[0] });
        dif = [...newlines, ...content, ...remlines];
    }*/

    return dif;
}

to.prim.wrapID = 0; // id for wrapped difs (used in relative addressing)

/**
 * @brief Finds the index of an HB entry that the operation directly follows.
 * 
 * @returns Index of the HB entry or -1 if not found.
 */
to.prim.findTOIndex = function(operation, HB, SO) {
    let SO_index = SO.findIndex((entry) => entry[0] === operation[0][0] && entry[1] === operation[0][1]); // index of operation
    //console.log('SO_index', SO_index);
    if (SO_index === 0) return -1;
    let HB_index = HB.findIndex((entry) => entry[0][0] === SO[SO_index - 1][0] && entry[0][1] === SO[SO_index - 1][1]); // index of entry before operation
    return HB_index;
}
to.prim.findLastDependancyIndex = function(operation, HB) {
    let user = operation[0][0];
    let directDependancyUser = operation[0][2]; // the user the operation is directly dependant on
    let directDependancyCSN = operation[0][3]; // the commitSerialNumber the operation is directly dependant on

    let DDIndex = -1;
    let LDIndex = -1;
    // find the last locally dependant operation and the last directly dependant operation
    HB.forEach((op, i) => {
        if (op[0][0] === directDependancyUser && op[0][1] === directDependancyCSN) {
            DDIndex = i;
        }
        if (op[0][0] === user && op[0][2] === directDependancyUser && op[0][3] === directDependancyCSN) {
            LDIndex = i;
        }
    });
    return Math.max(DDIndex, LDIndex);
}
to.prim.findFirstLocalDependancyIndex = function(operation, HB) {
    let user = operation[0][0];
    let directDependancyUser = operation[0][2]; // the user the operation is directly dependant on
    let directDependancyCSN = operation[0][3]; // the commitSerialNumber the operation is directly dependant on

    // find the last locally dependant operation and the last directly dependant operation
    for (let i = 0; i < HB.length; i++) {
        if (HB[i][0][0] === user && HB[i][0][2] === directDependancyUser && HB[i][0][3] === directDependancyCSN) {
            return i;
        }
    }
    return -1;
}
to.prim.SOIndex = function(operation, SO) {
    return SO.findIndex(entry => entry[0] === operation[0][0] && entry[1] === operation[0][1]);
}
to.prim.HBIndex = function(operation, HB) {
    return HB.findIndex(entry => entry[0][0] === operation[0][0] && entry[0][1] === operation[0][1]);
}
/**
 * @brief Takes an array of arrays and returns an array containing all nested elements
 */
to.prim.dissolveArrays = function(arrays) {
    let a = [];
    arrays.forEach(array => a.push(...array));
    return a;
}
to.prim.deepCopy = function(object) {
    return JSON.parse(JSON.stringify(object));
}
to.prim.deepEqual = function(x, y) {
    if (x === y) {
        return true;
    }
    else if ((typeof x == "object" && x != null) && (typeof y == "object" && y != null)) {
        if (Object.keys(x).length != Object.keys(y).length)
            return false;
    
        for (var prop in x) {
            if (y.hasOwnProperty(prop))
            {  
                if (!to.prim.deepEqual(x[prop], y[prop]))
                    return false;
            }
            else
                return false;
        }
        
        return true;
      }
      else 
        return false;
}
to.prim.sameRow = function(wrap, wTransformer) {
    return wrap.sub[0] === wTransformer.sub[0];
}
to.prim.mockupString = function(length) {
    return {
        length: length
    };
}
to.prim.wrapSubdif = function(subdif) {
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
                    addresser: null
                }
            }
        };
    }
    else {
        return {
            sub: to.prim.deepCopy(subdif),
            metaDel: {
                ID: to.prim.wrapID++,
                informationLost: false, // whether the context had to be saved
                relative: false, // whether relative addresing is in place
                context: {
                    original: null,
                    transformers: null,
                    addresser: null
                }
            },
            metaAdd: {
                ID: to.prim.wrapID++,
                informationLost: false, // whether the context had to be saved
                relative: false, // whether relative addresing is in place
                context: {
                    original: null,
                    transformers: null,
                    addresser: null
                }
            }
        };
    }
}
to.prim.unwrapSubdif = function(wrap) {
    if (wrap.constructor === Object && wrap.hasOwnProperty('sub')) {
        return wrap.sub;
    }
    return wrap;
}
to.prim.wrapDif = function(dif) {
    for (let i = 0; i < dif.length; i++) {
        dif[i] = to.prim.wrapSubdif(dif[i]);
    }
    return dif;
}
to.prim.unwrapDif = function(dif) {
    let ret_dif = [];
    dif.forEach(wrap => ret_dif.push(to.prim.unwrapSubdif(wrap)));
    return ret_dif;
}
to.prim.identicalSubdifs = function(subdif1, subdif2) {
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
to.prim.saveLI = function(wrap, wTransformer, mode='default') {
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
}
to.prim.checkRA = function(wrap) {
    // newlines and remlines are never relatively addressed
    if (to.isNewline(wrap) || to.isRemline(wrap)) {
        return false;
    }
    if (!to.isMove(wrap)) {
        return wrap.meta.relative;
    }
    return wrap.metaAdd.relative || wrap.metaDel.relative;
}
to.prim.saveRA = function(wrap, addresser) {
    wrap.meta.relative = true;
    wrap.meta.context.addresser = addresser;
    return wrap;
}
///TODO: what if the transformer is move?
/**
 * @brief Checks whether the wrap lost information due to the transformer.
 * 
 * @param {*} wrap 
 * @param {*} wTransformer 
 * @param {*} mode Used for move wraps. Either "add" or "del".
 * @returns 
 */
to.prim.checkLI = function(wrap, wTransformer, mode="default") {
    if (!to.isMove(wrap)) {
        if (!wrap.meta.informationLost) {
            return false;
        }
        return wrap.meta.context.wTransformer.meta.ID === wTransformer.meta.ID;
    }
    else {
        if (mode="add") {
            if (!wrap.metaAdd.informationLost) {
                return false;
            }
            return wrap.metaAdd.context.wTransformer.meta.ID === wTransformer.meta.ID;
        }
        else if (mode="del") {
            if (!wrap.metaDel.informationLost) {
                return false;
            }
            return wrap.metaDel.context.wTransformer.meta.ID === wTransformer.meta.ID;
        }
    }
    
}
to.prim.recoverLI = function(wrap, mode="default") {
    if (!to.isMove(wrap)) {
        wrap.sub = wrap.meta.context.original;
        wrap.meta.informationLost = false;
    }
    else {
        if (mode === "add") {
            // the add part of move only handles where the moved text is pasted
            wrap.sub[2] = wrap.metaAdd.context.original[2];
            wrap.sub[3] = wrap.metaAdd.context.original[3];
            wrap.metaAdd.informationLost = false;
        }
        else if (mode === "del") {
            // the del part of move handles from where the text was taken and how much of it
            wrap.sub[0] = wrap.metaDel.context.original[0];
            wrap.sub[1] = wrap.metaDel.context.original[1];
            wrap.sub[4] = wrap.metaDel.context.original[4];
            wrap.metaDel.informationLost = false;
        }
    }
    //return wrap.meta.context.original;
}
to.prim.checkBO = function(wrap, wTransformer) {
    if (!to.isMove(wrap)) {
        return wrap.meta.context.addresser.meta.ID === wTransformer.meta.ID;
    }
    return wrap.metaAdd.context.addresser.meta.ID === wTransformer.meta.ID ||
           wrap.metaDel.context.addresser.meta.ID === wTransformer.meta.ID;
}
to.prim.convertAA = function(wrap, wAddresser) {
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
}

/**
 * @brief Takes a wDif of chronologically dependant subdifs and returns a new wDif of independant subdifs.
 */
to.prim.makeIndependant = function(wDif) {
    let wDifCopy = to.prim.deepCopy(wDif);
    let wDifReversed = to.prim.deepCopy(wDif).reverse();
    let wIndependantDif = [];
    for (let i = 0; i < wDif.length; i++) {
        let wrap = wDifCopy[i];
        let wdTransformedDif = to.prim.LET([wrap], wDifReversed.slice(wDifReversed.length - i)); // LET can return multiple subdifs
        wIndependantDif.push(...wdTransformedDif);
    }
    return wIndependantDif;
}

/**
 * @brief Takes a wDif of independant subdifs and returns a new wDif of chronologically dependant subdifs.
 */
 to.prim.makeDependant = function(wDif) {
    let wDifCopy = to.prim.deepCopy(wDif);
    let wDependantSubdifs = to.prim.LIT(wDifCopy.slice(1), [wDifCopy[0]]);
    return [wDifCopy[0], ...wDependantSubdifs]; 
}


to.prim.LIT = function(wDif, wTransformationDif, log=false) {
    if (wDif.length === 0) return [];
    if (wTransformationDif.length === 0) return wDif;
    if (log && wDif.length === 1 && (wDif[0].meta.ID === 13 || wDif[0].meta.ID === 11)) console.log('wDif', JSON.stringify(wDif));
    let wTransformedSubdifs1 = to.prim.LIT1(wDif[0], wTransformationDif, log);
    let wTransformedSubdifs2 = to.prim.LIT(wDif.slice(1), [...wTransformationDif, ...wTransformedSubdifs1]);
    //if (log) console.log('wTransformedSubdifs1', JSON.stringify(wTransformedSubdifs1));
    //if (log) console.log('wTransformedSubdifs2', JSON.stringify(wTransformedSubdifs2));
    return [...wTransformedSubdifs1, ...wTransformedSubdifs2];    
}
to.prim.LIT1 = function(wrap, wTransformationDif, log=false) {
    let logCondition = log && wrap.meta.ID == 45; ///TODO: test only
    let wTransformedSubdifs = [];
    if (wTransformationDif.length === 0) {
        wTransformedSubdifs = [wrap];
    }
    // if the wrap is relatively addressed and the transformer is not the target, then skip it
    else if (to.prim.checkRA(wrap) && !to.prim.checkBO(wrap, wTransformationDif[0])) {
        if (logCondition) console.log('not BO');
        if (logCondition) console.log();
        if (logCondition) console.log('wrap', JSON.stringify(wrap));
        if (logCondition) console.log();
        if (logCondition) console.log('wTransformationDif[0]', JSON.stringify(wTransformationDif[0]));
        if (logCondition) console.log();
        wTransformedSubdifs = to.prim.LIT1(wrap, wTransformationDif.slice(1), log);
    } 
    else if (to.prim.checkRA(wrap) && to.prim.checkBO(wrap, wTransformationDif[0])) {
        if (logCondition) console.log('BO');
        if (logCondition) console.log();
        to.prim.convertAA(wrap, wTransformationDif[0]);
        wTransformedSubdifs = to.prim.LIT1(wrap, wTransformationDif.slice(1));
    }
    else {
        if (logCondition) console.log('normal IT');
        if (logCondition) console.log();
        if (logCondition) console.log('pre', JSON.stringify(wrap));
        if (logCondition) console.log();
        if (logCondition) console.log('post', JSON.stringify(to.prim.IT(to.prim.deepCopy(wrap), wTransformationDif[0])));
        if (logCondition) console.log();
        if (logCondition) console.log('wTransformationDif[0]', JSON.stringify(wTransformationDif[0]));
        if (logCondition) console.log();
        wTransformedSubdifs = to.prim.LIT(to.prim.IT(wrap, wTransformationDif[0]), wTransformationDif.slice(1), log);
        if (logCondition) console.log('post wTransformedSubdifs', JSON.stringify(wTransformedSubdifs));
        if (logCondition) console.log();
    }
    return wTransformedSubdifs;
}

to.prim.LET = function(wDif, wTransformationDif, log) {
    if (wDif.length === 0) return [];
    if (wTransformationDif.length === 0) return wDif;
    let wTransformedSubdifs1 = to.prim.LET1(wDif[0], wTransformationDif, log);
    let wTransformedSubdifs2 = to.prim.LET(wDif.slice(1), wTransformationDif, log);
    return [...wTransformedSubdifs1, ...wTransformedSubdifs2];
}
to.prim.LET1 = function(wrap, wTransformationDif, log) {
    let wTransformedSubdifs = [];
    if (wTransformationDif.length === 0) {
        wTransformedSubdifs = [wrap];
    }
    else if (to.prim.checkRA(wrap)) {
        wTransformedSubdifs = [wrap];
    }
    else {
        if (log && (wrap.meta.ID == 17 || wrap.meta.ID == 11)) console.log('pre', JSON.stringify(wrap));
        if (log && (wrap.meta.ID == 17 || wrap.meta.ID == 11)) console.log();
        if (log && (wrap.meta.ID == 17 || wrap.meta.ID == 11)) console.log('post', JSON.stringify(to.prim.ET(to.prim.deepCopy(wrap), wTransformationDif[0])));
        if (log && (wrap.meta.ID == 17 || wrap.meta.ID == 11)) console.log();
        if (log && (wrap.meta.ID == 17 || wrap.meta.ID == 11)) console.log('wTransformationDif[0])', JSON.stringify(wTransformationDif[0]));
        if (log && (wrap.meta.ID == 17 || wrap.meta.ID == 11)) console.log();
        wTransformedSubdifs = to.prim.LET(to.prim.ET(wrap, wTransformationDif[0]), wTransformationDif.slice(1), log);
    }
    return wTransformedSubdifs;
}

to.prim.IT = function(wrap, wTransformer) {
    let transformed_wraps = [];
    if (to.isAdd(wrap)) {
        if (to.isAdd(wTransformer)) transformed_wraps.push(to.prim.IT_AA(wrap, wTransformer));
        else if (to.isDel(wTransformer)) transformed_wraps.push(to.prim.IT_AD(wrap, wTransformer));
        else if (to.isMove(wTransformer)) transformed_wraps.push(to.prim.IT_AM(wrap, wTransformer));
        else if (to.isNewline(wTransformer)) transformed_wraps.push(to.prim.IT_AN(wrap, wTransformer));
        else if (to.isRemline(wTransformer)) transformed_wraps.push(to.prim.IT_AR(wrap, wTransformer));
    }
    else if (to.isDel(wrap)) {
        if (to.isAdd(wTransformer)) {
            let result = to.prim.IT_DA(wrap, wTransformer);
            if (to.isDel(result)) transformed_wraps.push(result);
            else {
                transformed_wraps.push(result[0]);
                transformed_wraps.push(result[1]);
            }
        }
        else if (to.isDel(wTransformer)) transformed_wraps.push(to.prim.IT_DD(wrap, wTransformer));
        else if (to.isMove(wTransformer)) {
            let result = to.prim.IT_DM(wrap, wTransformer);
            if (to.isDel(result)) transformed_wraps.push(result);
            else {
                transformed_wraps.push(result[0]);
                transformed_wraps.push(result[1]);
            }
        }
        else if (to.isNewline(wTransformer)) transformed_wraps.push(to.prim.IT_DN(wrap, wTransformer));
        else if (to.isRemline(wTransformer)) transformed_wraps.push(to.prim.IT_DR(wrap, wTransformer));
    }
    else if (to.isMove(wrap)) {
        if (to.isAdd(wTransformer)) {
            let result = to.prim.IT_MA(wrap, wTransformer);
            if (to.isMove(result)) transformed_wraps.push(result);
            else {
                transformed_wraps.push(result[0]);
                transformed_wraps.push(result[1]);
            }
        }
        else if (to.isDel(wTransformer)) transformed_wraps.push(to.prim.IT_MD(wrap, wTransformer));
        else if (to.isMove(wTransformer)) {
            let result = to.prim.IT_MM(wrap, wTransformer);
            if (to.isMove(result)) transformed_wraps.push(result);
            else {
                transformed_wraps.push(result[0]);
                transformed_wraps.push(result[1]);
            }
        }
        else if (to.isNewline(wTransformer)) transformed_wraps.push(to.prim.IT_MN(wrap, wTransformer));
        else if (to.isRemline(wTransformer)) transformed_wraps.push(to.prim.IT_MR(wrap, wTransformer));
    }
    else if (to.isNewline(wrap)) {
        if (to.isAdd(wTransformer)) transformed_wraps.push(to.prim.IT_NA(wrap, wTransformer));
        else if (to.isDel(wTransformer)) transformed_wraps.push(to.prim.IT_ND(wrap, wTransformer));
        else if (to.isMove(wTransformer)) transformed_wraps.push(to.prim.IT_NM(wrap, wTransformer));
        else if (to.isNewline(wTransformer)) transformed_wraps.push(to.prim.IT_NN(wrap, wTransformer));
        else if (to.isRemline(wTransformer)) transformed_wraps.push(to.prim.IT_NR(wrap, wTransformer));
    }
    else if (to.isRemline(wrap)) {
        if (to.isAdd(wTransformer)) transformed_wraps.push(to.prim.IT_RA(wrap, wTransformer));
        else if (to.isDel(wTransformer)) transformed_wraps.push(to.prim.IT_RD(wrap, wTransformer));
        else if (to.isMove(wTransformer)) transformed_wraps.push(to.prim.IT_RM(wrap, wTransformer));
        else if (to.isNewline(wTransformer)) transformed_wraps.push(to.prim.IT_RN(wrap, wTransformer));
        else if (to.isRemline(wTransformer)) transformed_wraps.push(to.prim.IT_RR(wrap, wTransformer));
    }
    return transformed_wraps;
}
to.prim.ET = function(wrap, wTransformer) {
    let transformed_wraps = [];
    if (to.isAdd(wrap)) {
        if (to.isAdd(wTransformer)) transformed_wraps.push(to.prim.ET_AA(wrap, wTransformer));
        else if (to.isDel(wTransformer)) transformed_wraps.push(to.prim.ET_AD(wrap, wTransformer));
        else if (to.isMove(wTransformer)) transformed_wraps.push(to.prim.ET_AM(wrap, wTransformer));
        else if (to.isNewline(wTransformer)) transformed_wraps.push(to.prim.ET_AN(wrap, wTransformer));
        else if (to.isRemline(wTransformer)) transformed_wraps.push(to.prim.ET_AR(wrap, wTransformer));
    }
    else if (to.isDel(wrap)) {
        if (to.isAdd(wTransformer)) {
            let result = to.prim.ET_DA(wrap, wTransformer);
            if (to.isDel(result)) transformed_wraps.push(result);
            else {
                transformed_wraps.push(result[0]);
                transformed_wraps.push(result[1]);
            }
        }
        else if (to.isDel(wTransformer)) {
            let result = to.prim.ET_DD(wrap, wTransformer);
            if (to.isDel(result)) transformed_wraps.push(result);
            else {
                transformed_wraps.push(result[0]);
                transformed_wraps.push(result[1]);
            }
        }
        else if (to.isMove(wTransformer)) {
            let result = to.prim.ET_DM(wrap, wTransformer);
            if (to.isDel(result)) transformed_wraps.push(result);
            else {
                transformed_wraps.push(result[0]);
                transformed_wraps.push(result[1]);
            }
        }
        else if (to.isNewline(wTransformer)) transformed_wraps.push(to.prim.ET_DN(wrap, wTransformer));
        else if (to.isRemline(wTransformer)) transformed_wraps.push(to.prim.ET_DR(wrap, wTransformer));
    }
    else if (to.isMove(wrap)) {
        if (to.isAdd(wTransformer)) {
            let result = to.prim.ET_MA(wrap, wTransformer);
            if (to.isMove(result)) transformed_wraps.push(result);
            else {
                transformed_wraps.push(result[0]);
                transformed_wraps.push(result[1]);
            }
        }
        else if (to.isDel(wTransformer)) {
            let result = to.prim.ET_MD(wrap, wTransformer);
            if (to.isMove(result)) transformed_wraps.push(result);
            else {
                transformed_wraps.push(result[0]);
                transformed_wraps.push(result[1]);
            }
        }
        else if (to.isMove(wTransformer)) {
            let result = to.prim.ET_MM(wrap, wTransformer);
            if (isMove(result)) transformed_wraps.push(result);
            else {
                transformed_wraps.push(result[0]);
                transformed_wraps.push(result[1]);
            }
        }
        else if (to.isNewline(wTransformer)) transformed_wraps.push(to.prim.ET_MN(wrap, wTransformer));
        else if (to.isRemline(wTransformer)) transformed_wraps.push(to.prim.ET_MR(wrap, wTransformer));
    }
    else if (to.isNewline(wrap)) {
        if (to.isAdd(wTransformer)) transformed_wraps.push(to.prim.ET_NA(wrap, wTransformer));
        else if (to.isDel(wTransformer)) transformed_wraps.push(to.prim.ET_ND(wrap, wTransformer));
        else if (to.isMove(wTransformer)) transformed_wraps.push(to.prim.ET_NM(wrap, wTransformer));
        else if (to.isNewline(wTransformer)) transformed_wraps.push(to.prim.ET_NN(wrap, wTransformer));
        else if (to.isRemline(wTransformer)) transformed_wraps.push(to.prim.ET_NR(wrap, wTransformer));
    }
    else if (to.isRemline(wrap)) {
        if (to.isAdd(wTransformer)) transformed_wraps.push(to.prim.ET_RA(wrap, wTransformer));
        else if (to.isDel(wTransformer)) transformed_wraps.push(to.prim.ET_RD(wrap, wTransformer));
        else if (to.isMove(wTransformer)) transformed_wraps.push(to.prim.ET_RM(wrap, wTransformer));
        else if (to.isNewline(wTransformer)) transformed_wraps.push(to.prim.ET_RN(wrap, wTransformer));
        else if (to.isRemline(wTransformer)) transformed_wraps.push(to.prim.ET_RR(wrap, wTransformer));
    }
    return transformed_wraps;
}


to.prim.IT_AA = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (!to.prim.sameRow(wrap, wTransformer)) return wrap;
    if (wrap.sub[1] < transformer[1]) return wrap;
    wrap.sub[1] += transformer[2].length;
    return wrap;
}
to.prim.IT_AD = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
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
}
to.prim.IT_AM = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (wrap.sub[0] === transformer[0]) {
        wrap = to.prim.IT_AD(wrap, to.prim.wrapSubdif(to.del(transformer[0], transformer[1], transformer[4])));
    }
    else if (wrap.sub[0] === transformer[2]) {
        wrap = to.prim.IT_AA(wrap, to.prim.wrapSubdif(to.add(transformer[2], transformer[3], to.prim.mockupString(transformer[4]))));
    }
    return wrap;
}
to.prim.IT_AN = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (transformer <= wrap.sub[0]) {
        wrap.sub[0]++;
    }
    return wrap;
}
to.prim.IT_AR = function(wrap, wTransformer) {
    // case when the remline is disabled
    if (wTransformer.meta.informationLost) {
        return wrap;
    }
    let transformer = wTransformer.sub;
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
        ///TODO: implement this
    }
    return wrap;
}
// @note May return an array with two subdifs
to.prim.IT_DA = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (!to.prim.sameRow(wrap, wTransformer)) return wrap;
    if (transformer[1] >= wrap.sub[1] + wrap.sub[2]) return wrap;
    if (wrap.sub[1] >= transformer[1]) {
        wrap.sub[1] += transformer[2].length;
        return wrap;
    }
    else {
        return [to.prim.wrapSubdif(to.del(wrap.sub[0], wrap.sub[1], transformer[1] - wrap.sub[1])),
                to.prim.wrapSubdif(to.del(wrap.sub[0], transformer[1] + transformer[2].length, wrap.sub[2] - (transformer[1] - wrap.sub[1])))];
    }
}
to.prim.IT_DD = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (!to.prim.sameRow(wrap, wTransformer)) return wrap;
    if (transformer[1] >= wrap.sub[1] + wrap.sub[2]) return wrap;
    if (wrap.sub[1] >= transformer[1] + transformer[2]) {
        wrap.sub = to.del(wrap.sub[0], wrap.sub[1] - transformer[2], wrap.sub[2]);
    }
    else {
        to.prim.saveLI(wrap, wTransformer);
        if (transformer[1] <= wrap.sub[1] && wrap.sub[1] + wrap.sub[2] <= transformer[1] + transformer[2]) {
            wrap.sub = to.del(wrap.sub[0], wrap.sub[1], 0);
        }
        else if (transformer[1] <= wrap.sub[1] && wrap.sub[1] + wrap.sub[2] > transformer[1] + transformer[2]) {
            wrap.sub = to.del(wrap.sub[0], transformer[1], wrap.sub[1] + wrap.sub[2] - (transformer[1] + transformer[2]));
        }
        else if (transformer[1] > wrap.sub[1] && wrap.sub[1] + wrap.sub[2] >= transformer[1] + transformer[2]) {
            wrap.sub = to.del(wrap.sub[0], wrap.sub[1], transformer[1] - wrap.sub[1]);
        }
        else {
            wrap.sub = to.del(wrap.sub[0], wrap.sub[1], wrap.sub[2] - transformer[2]);
        }
    }
    return wrap;
}
// @note May return an array with two subdifs
to.prim.IT_DM = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (wrap.sub[0] === transformer[0]) {
        wrap = to.prim.IT_DD(wrap, to.del(transformer[0], transformer[1], transformer[4]));
    }
    else if (wrap.sub[0] === transformer[2]) {
        wrap = to.prim.IT_DA(wrap, to.add(transformer[2], transformer[3], to.prim.mockupString(transformer[4])));
    }
    return wrap;
}
to.prim.IT_DN = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (transformer <= wrap.sub[0]) {
        wrap.sub[0]++;
    }
    return wrap;
}
to.prim.IT_DR = function(wrap, wTransformer) {
    // case when the remline is disabled
    if (wTransformer.meta.informationLost) {
        return wrap;
    }
    let transformer = wTransformer.sub;
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
}
// @note May return an array with two subdifs
to.prim.IT_MA = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (wrap.sub[0] === transformer[0]) {
        let del_wrap = to.prim.IT_DA(to.prim.wrapSubdif(to.del(wrap.sub[0], wrap.sub[1], wrap.sub[4])), wTransformer);
        if (to.isDel(del_wrap)) {
            wrap.sub[1] = del_wrap.sub[1];
        }
        else {
            return [to.prim.wrapSubdif(to.move(wrap.sub[0], del_wrap[0].sub[1], wrap.sub[2], wrap.sub[3], del_wrap[0].sub[2])),
                    to.prim.wrapSubdif(to.move(wrap.sub[0], del_wrap[1].sub[1], wrap.sub[2], wrap.sub[3] + del_wrap[0].sub[2], del_wrap[1].sub[2]))];
        } 
    }
    else if (wrap.sub[2] === transformer[0]) {
        let add_wrap = to.prim.IT_AA(to.prim.wrapSubdif(to.add(wrap.sub[2], wrap.sub[3], to.prim.mockupString(wrap.sub[4]))), wTransformer);
        wrap.sub[3] = add_wrap.sub[1];
    }
    return wrap;
}
to.prim.IT_MD = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (wrap.sub[0] === transformer[0]) {
        let del_wrap = to.prim.IT_DD(to.prim.wrapSubdif(to.del(wrap.sub[0], wrap.sub[1], wrap.sub[4])), wTransformer);
        if (del_wrap.meta.informationLost) {
            to.prim.saveLI(wrap, wTransformer, 'del');
        }
        wrap.sub[1] = del_wrap.sub[1];
        wrap.sub[4] = del_wrap.sub[2];
    }
    else if (wrap.sub[2] === transformer[0]) {
        let add_wrap = to.prim.IT_AD(to.prim.wrapSubdif(to.add(wrap.sub[2], wrap.sub[3], to.prim.mockupString(wrap.sub[4]))), wTransformer);
        if (add_wrap.meta.informationLost) {
            to.prim.saveLI(wrap, wTransformer, 'add');
        }
        wrap.sub[3] = add_wrap[1];
    }
    return wrap;
}
// @note May return an array with two subdifs
to.prim.IT_MM = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (wrap.sub[0] === transformer[0]) {
        wrap = to.prim.IT_MD(wrap, to.prim.wrapSubdif(to.del(transformer[0], transformer[1], transformer[4])));
    }
    if (wrap.sub[0] === transformer[2]) {
        let del_wrap = to.prim.IT_DA(to.prim.wrapSubdif(to.del(wrap.sub[0], wrap.sub[1], wrap.sub[4])), to.prim.wrapSubdif(to.add(transformer[2], transformer[3], to.prim.mockupString(transformer[4]))));
        if (to.isDel(del_wrap)) {
            wrap.sub[1] = del_wrap.sub[1];
        }
        else {
            // splitting the move into two sections
            let move1_wrap = to.prim.wrapSubdif(to.move(wrap.sub[0], del_wrap[0].sub[1], wrap.sub[2], wrap.sub[3], del_wrap[0].sub[2]));
            let move2_wrap = to.prim.wrapSubdif(to.move(wrap.sub[0], del_wrap[1].sub[1], wrap.sub[2], wrap.sub[3] + del_wrap[0].sub[2], del_wrap[1].sub[2]));
            ///TODO: implement this
            /*if (wrap.sub[2] === transformer[0]) {
                let add_wrap = to.prim.IT_AD(to.add(move1[2], move1[3], to.prim.mockupString(move1[4])), to.del(transformer[0], transformer[1], transformer[4]));
                move1[3] = add_wrap[1];
                move2[3] = add_wrap[1] + move1[4]; // appending the second move right after the first one
            }*/
            console.log('IT_MM not implemented');
            return [move1_wrap, move2_wrap];
        } 
    }
    if (wrap.sub[2] === transformer[0]) {
        wrap = to.prim.IT_MD(wrap, to.prim.wrapSubdif(to.del(transformer[0], transformer[1], transformer[4])));
    }
    if (wrap.sub[2] === transformer[2]) {
        wrap = to.prim.IT_MA(wrap, to.prim.wrapSubdif(to.add(transformer[2], transformer[3], to.prim.mockupString(transformer[4]))));
    }
    return wrap;
}
to.prim.IT_MN = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (to.prim.checkLI(wrap, wTransformer, "add")) {
        to.prim.recoverLI(wrap, "add");
        return wrap;
    }
    if (to.prim.checkLI(wrap, wTransformer, "del")) {
        to.prim.recoverLI(wrap, "del");
        return wrap;
    }
    if (wrap.sub[0] >= transformer) wrap.sub[0]++;
    if (wrap.sub[2] >= transformer) wrap.sub[2]++;
    return wrap;
}
to.prim.IT_MR = function(wrap, wTransformer) {
    // case when the remline is disabled
    if (wTransformer.meta.informationLost) {
        return wrap;
    }
    let transformer = wTransformer.sub;
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
        ///TODO: implement this
    }
    return wrap;
}
to.prim.IT_NA = function(wrap, wTransformer) {
    return wrap;
}
to.prim.IT_ND = function(wrap, wTransformer) {
    return wrap;
}
to.prim.IT_NM = function(wrap, wTransformer) {
    return wrap;
}
to.prim.IT_NN = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (transformer <= wrap.sub) wrap.sub++;
    return wrap;
}
to.prim.IT_NR = function(wrap, wTransformer) {
    // case when the remline is disabled
    if (wTransformer.meta.informationLost) {
        return wrap;
    }
    let transformer = wTransformer.sub;
    if (-transformer < wrap.sub) wrap.sub--;
    else if (-transformer === wrap.sub) {
        /**
         * The place to add the new line might be deleted.
         * The solution would be to add the newline at the same position, or
           if the position does not exist, add a newline at the end of the document.
         */
        ///TODO: implement this
    }
    return wrap;
}
to.prim.IT_RA = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (-wrap.sub === transformer[0]) {
        // disable the remline
        to.prim.saveLI(wrap, wTransformer);
    }
    return wrap;
}
to.prim.IT_RD = function(wrap, wTransformer) {
    return wrap;
}
to.prim.IT_RM = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (-wrap.sub === transformer[2]) {
        console.log("Transforming remline agains a move addition on the same row!");
        // disable the remline
        to.prim.saveLI(wrap, wTransformer);
    }
    return wrap;
}
to.prim.IT_RN = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (transformer <= -wrap.sub) wrap.sub--;
    return wrap;
}
to.prim.IT_RR = function(wrap, wTransformer) {
    // case when the remline is disabled
    if (wTransformer.meta.informationLost) {
        return wrap;
    }
    let transformer = wTransformer.sub;
    if (-transformer < -wrap.sub) wrap.sub++;
    if (transformer === wrap.sub) {
        /**
         * Trying to delete a row that already had been deleted. The intention was 
           fulfilled by someone else, therefore the subdif may be omitted.
         */
        ///TODO: implement this
    }
    return wrap;
}

to.prim.ET_AA = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (!to.prim.sameRow(wrap, wTransformer)) return wrap;
    if (wrap.sub[1] < transformer[1]) return wrap; // equality removed because of the IT(ET([0, 0, '3'], [0, 0, '2']), [0, 0, '2']) => [0, 0, '3'] example
    if (wrap.sub[1] >= transformer[1] + transformer[2].length) {
        wrap.sub[1] -= transformer[2].length;
    }
    else {
        wrap.sub[1] -= transformer[1];
        to.prim.saveRA(wrap, wTransformer);
    }
    return wrap;
}
to.prim.ET_AD = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (!to.prim.sameRow(wrap, wTransformer)) return wrap;
    if (to.prim.checkLI(wrap, wTransformer)) {
        to.prim.recoverLI(wrap);
    }
    else if (wrap.sub[1] <= transformer[1]) return wrap;
    else {
        wrap.sub[1] += transformer[2];
    }
    return wrap;
}
to.prim.ET_AM = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (wrap.sub[0] === transformer[0]) {
        wrap.sub = to.prim.ET_AD(wrap, to.del(transformer[0], transformer[1], transformer[4]));
    }
    else if (wrap.sub[0] === transformer[2]) {
        wrap.sub = to.prim.ET_AA(wrap, to.add(transformer[2], transformer[3], to.prim.mockupString(transformer[4])));
    }
    return wrap;
}
to.prim.ET_AN = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (transformer < wrap.sub[0]) { ///TODO: revise this
        wrap.sub[0]--;
    }
    return wrap;
}
to.prim.ET_AR = function(wrap, wTransformer) {
    // case when the remline is disabled
    if (wTransformer.meta.informationLost) {
        return wrap;
    }
    let transformer = wTransformer.sub;
    if (-transformer < wrap.sub[0]) {
        wrap.sub[0]++;
    }
    return wrap;
}
// @note May return an array with two subdifs
to.prim.ET_DA = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (!to.prim.sameRow(wrap, wTransformer)) return wrap;
    if (wrap.sub[1] + wrap.sub[2] <= transformer[1]) return wrap;
    if (wrap.sub[1] >= transformer[1] + transformer[2].length) {
        wrap.sub[1] -= transformer[2].length;
    }
    else {
        if (transformer[1] <= wrap.sub[1] && wrap.sub[1] + wrap.sub[2] <= transformer[1] + transformer[2].length) {
            wrap.sub[1] -= transformer[1];
            to.prim.saveRA(wrap, wTransformer);
        }
        else if (transformer[1] <= wrap.sub[1] && wrap.sub[1] + wrap.sub[2] > transformer[1] + transformer[2].length) {
            let del1_wrap = to.prim.wrapSubdif(to.del(wrap.sub[0], wrap.sub[1] - transformer[1], transformer[1] + transformer[2].length - wrap.sub[1]));
            let del2_wrap = to.prim.wrapSubdif(to.del(wrap.sub[0], transformer[1], wrap.sub[1] + wrap.sub[2] - transformer[1] - transformer[2].length));
            to.prim.saveRA(del1_wrap, wTransformer);
            return [del1_wrap, del2_wrap];
        }
        else if (transformer[1] > wrap.sub[1] && transformer[1] + transformer[2].length <= wrap.sub[1] + wrap.sub[2]) {
            let del1_wrap = to.prim.wrapSubdif(to.del(wrap.sub[0], 0, transformer[2].length));
            let del2_wrap = to.prim.wrapSubdif(to.del(wrap.sub[0],  wrap.sub[1], wrap.sub[2] - transformer[2].length));
            to.prim.saveRA(del1_wrap, wTransformer);
            return [del1_wrap, del2_wrap];
        }
        else {
            let del1_wrap = to.prim.wrapSubdif(to.del(wrap.sub[0], 0, wrap.sub[1] + wrap.sub[2] - transformer[1]));
            let del2_wrap = to.prim.wrapSubdif(to.del(wrap.sub[0],  wrap.sub[1], transformer[1] - wrap.sub[1]));
            to.prim.saveRA(del1_wrap, wTransformer);
            return [del1_wrap, del2_wrap];
        }
    }
    return wrap;
}
// @note May return an array with two subdifs
to.prim.ET_DD = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (!to.prim.sameRow(wrap, wTransformer)) return wrap;
    if (to.prim.checkLI(wrap, wTransformer)) {
        to.prim.recoverLI(wrap);
    }
    else if (transformer[1] >= wrap.sub[1] + wrap.sub[2]) return wrap;
    else if (wrap.sub[1] >= transformer[1]) {
        wrap.sub[1] += transformer[2];
    }
    else {
        let del1_wrap = to.prim.wrapSubdif(to.del(wrap.sub[0], wrap.sub[1], transformer[1] - wrap.sub[1]));
        let del2_wrap = to.prim.wrapSubdif(to.del(wrap.sub[0],  transformer[1] + transformer[2], wrap.sub[1] + wrap.sub[2] - transformer[1]));
        return [del1_wrap, del2_wrap];
    }
    return wrap;
}
// @note May return an array with two subdifs
///TODO: the wrap might be losing some meta information here
to.prim.ET_DM = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (wrap.sub[0] === transformer[0]) {
        wrap = to.prim.ET_DD(wrap, to.del(transformer[0], transformer[1], transformer[4]));
    }
    else if (wrap.sub[0] === transformer[2]) {
        wrap = to.prim.ET_DA(wrap, to.add(transformer[2], transformer[3], to.prim.mockupString(transformer[4])));
    }
    return wrap;
}
to.prim.ET_DN = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (transformer < wrap.sub[0]) { ///TODO: revise this
        wrap.sub[0]--;
    }
    return wrap;
}
to.prim.ET_DR = function(wrap, wTransformer) {
    // case when the remline is disabled
    if (wTransformer.meta.informationLost) {
        return wrap;
    }
    let transformer = wTransformer.sub;
    if (-transformer < wrap.sub[0]) {
        wrap.sub[0]++;
    }
    return wrap;
}
to.prim.ET_DN = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (transformer < wrap.sub[0]) { ///TODO: revise this
        wrap.sub[0]--;
    }
    return wrap;
}
to.prim.ET_DR = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (-transformer < wrap.sub[0]) {
        wrap.sub[0]++;
    }
    return wrap;
}
// @note May return an array with two subdifs
to.prim.ET_MA = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (wrap.sub[0] === transformer[0]) {
        let del_wrap = to.prim.ET_DA(to.prim.wrapSubdif(to.del(wrap.sub[0], wrap.sub[1], wrap.sub[4])), transformer);
        if (to.isDel(del_wrap)) {
            wrap.sub[1] = del_wrap.sub[1];
            wrap.metaDel.relative = del_wrap.meta.relative;
            wrap.metaDel.context.addresser = del_wrap.meta.context.addresser;
        }
        else {
            let del1_wrap = del_wrap[0];
            let del2_wrap = del_wrap[1];
            let move1_wrap = to.prim.wrapSubdif(to.move(wrap.sub[0], del1_wrap.sub[1], wrap.sub[2], wrap.sub[3], del1_wrap.sub[2]));
            move1_wrap.metaDel = del1_wrap.meta;
            let move2_wrap = to.prim.wrapSubdif(to.move(wrap.sub[0], del2_wrap.sub[1], wrap.sub[2], wrap.sub[3] + del1_wrap.sub[2], del2_wrap.sub[2]));
            move2_wrap.metaDel = del2_wrap.meta;
            return [move1_wrap, move2_wrap];
        } 
    }
    else if (wrap.sub[2] === transformer[0]) {
        let add_wrap = to.prim.ET_AA(to.prim.wrapSubdif(to.add(wrap.sub[2], wrap.sub[3], to.prim.mockupString(wrap.sub[4]))), transformer);
        wrap.sub[3] = add_wrap.sub[1];
        wrap.metaAdd.relative = add_wrap.meta.relative;
        wrap.metaAdd.context.addresser = add_wrap.meta.context.addresser;
    }
    return wrap;
}
// @note May return an array with two subdifs
to.prim.ET_MD = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (wrap.sub[0] === transformer[0]) {
        let del_wrap = to.prim.ET_DD(to.prim.wrapSubdif(to.del(wrap.sub[0], wrap.sub[1], wrap.sub[4])), transformer);
        if (to.isDel(del_wrap)) {
            wrap.sub = del_wrap.sub;
        }
        else {
            let del1_wrap = del_wrap[0];
            let del2_wrap = del_wrap[1];
            let move1_wrap = to.prim.wrapSubdif(to.move(wrap.sub[0], del1_wrap.sub[1], wrap.sub[2], wrap.sub[3], del1_wrap.sub[2]));
            let move2_wrap = to.prim.wrapSubdif(to.move(wrap.sub[0], del2_wrap.sub[1], wrap.sub[2], wrap.sub[3] + del1_wrap.sub[2], del2_wrap.sub[2]));
            return [move1_wrap, move2_wrap];
        }
    }
    else if (wrap.sub[2] === transformer[0]) {
        let add_wrap = to.prim.ET_AD(to.prim.wrapSubdif(to.add(wrap.sub[2], wrap.sub[3], to.prim.mockupString(wrap.sub[4]))), transformer);
        wrap.sub[3] = add_wrap[1];
    }
    return wrap;
}
// @note May return an array with two subdifs
to.prim.ET_MM = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    ///TODO: finish
    console.log('Not implemented ET_MM');
    return wrap;
}
to.prim.ET_MN = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (transformer < wrap.sub[0]) wrap.sub[0]--;
    else if (transformer === wrap.sub[0]) {
        to.prim.saveLI(wrap, wTransformer, "del");
    }

    if (transformer < wrap.sub[2]) wrap.sub[2]--;
    else if (transformer === wrap.sub[2]) {
        to.prim.saveLI(wrap, wTransformer, "add");
    }
    return wrap;
}
to.prim.ET_MR = function(wrap, wTransformer) {
    // case when the remline is disabled
    if (wTransformer.meta.informationLost) {
        return wrap;
    }
    let transformer = wTransformer.sub;
    if (-transformer < wrap.sub[0]) wrap.sub[0]++;
    if (-transformer < wrap.sub[2]) wrap.sub[2]++;
    return wrap;
}
to.prim.ET_NA = function(wrap, wTransformer) {
    return wrap;
}
to.prim.ET_ND = function(wrap, wTransformer) {
    return wrap;
}
to.prim.ET_NM = function(wrap, wTransformer) {
    return wrap;
}
to.prim.ET_NN = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (transformer < wrap.sub) wrap.sub--;
    return wrap;
}
to.prim.ET_NR = function(wrap, wTransformer) {
    // case when the remline is disabled
    if (wTransformer.meta.informationLost) {
        return wrap;
    }
    let transformer = wTransformer.sub;
    if (-transformer < wrap.sub) wrap.sub++;
    return wrap;
}
to.prim.ET_RA = function(wrap, wTransformer) {
    ///TODO: this might be redundant
    if (to.prim.checkLI(wrap, wTransformer)) {
        to.prim.recoverLI(wrap);
    }
    return wrap;
}
to.prim.ET_RD = function(wrap, wTransformer) {
    return wrap;
}
to.prim.ET_RM = function(wrap, wTransformer) {
    ///TODO: this might be redundant
    if (to.prim.checkLI(wrap, wTransformer)) {
        to.prim.recoverLI(wrap);
    }
    return wrap;
}
to.prim.ET_RN = function(wrap, wTransformer) {
    let transformer = wTransformer.sub;
    if (transformer < -wrap.sub) wrap.sub++;
    return wrap;
}
to.prim.ET_RR = function(wrap, wTransformer) {
    // case when the remline is disabled
    if (wTransformer.meta.informationLost) {
        return wrap;
    }
    let transformer = wTransformer.sub;
    if (-transformer < -wrap.sub) wrap.sub--;
    return wrap;
}


to.applyAdd = function(previous_value, subdif) {
    if (subdif[1] > previous_value.length) {
        console.log('applyAdd subdif position too large!');
        console.log(subdif);
        console.log(previous_value);
        return previous_value;
    }

    return (previous_value.substring(0, subdif[1]) + subdif[2] + previous_value.substring(subdif[1]));
}

to.applyDel = function(previous_value, subdif) {
    if (subdif[1] + subdif[2] > previous_value.length) {
        console.log('applyDel subdif position too large!');
        console.log(previous_value);
        console.log(subdif);
        return previous_value;
    }

    return (previous_value.substring(0, subdif[1])) + previous_value.substring(subdif[1] + subdif[2]);
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
to.textToDif = function(targetRow, targetPosition, content, trailingRowText) {
    let dif = [];

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
        dif.push([targetRow, targetPosition + content[0].length, targetRow + content.length - 1, content[content.length - 1].length, trailingRowText.length]);
    }

    return dif;
}



module.exports = to;