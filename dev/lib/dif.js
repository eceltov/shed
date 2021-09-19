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

to.applyDif = function(dif, document) {
    dif.forEach((subdif) => {
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
        else if (to.isRemline(subdif)) {
            document.removeNewLine(-subdif - 1);
        }
        else {
            console.log("Received unknown subdif!", subdif);
        }
    });
    return document;
}

to.undoDif = function(dif, document) {
    let dif_copy = to.prim.deepCopy(dif);
    dif_copy.reverse(); // subdifs need to be undone in reverse order
    dif_copy.forEach((subdif) => {
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

to.UDR = function(message, editor, HB_original, SO_original) {
    // creating new document so that changing it is not propagated to the user
    let document = new Document(editor.getSession().getDocument().getAllLines());
    let HB = to.prim.deepCopy(HB_original);
    let SO = [...SO_original, message[0]];

    // finding an operation in HB which satisfies: operation => message (message directly follows the operation)
    let TO_HB_index = to.prim.findTOIndex(message, HB, SO);
    console.log('TO_HB_index:', TO_HB_index);

    // case when no operations need to be undone
    if (TO_HB_index === HB.length - 1) {
        let transformed_message = to.GOTCA(message, HB, SO);
        document = to.applyDif(transformed_message[1], document);
        console.log('UDR no ops need to be undone');
        log(transformed_message);
        return {
            message: transformed_message,
            document: document,
            HB: [...HB, transformed_message]
        };
    }

    // undo independant operations
    for (let i = HB.length - 1; i > TO_HB_index; i--) {
        to.undoDif(HB[i][1], document);
    }

    // transforming and applying message
    let transformed_message = to.GOTCA(message, HB.slice(0, TO_HB_index), SO); // giving GOTCA only the relevant part of HB
    document = to.applyDif(transformed_message[1], document);

    // preparing undone difs for transformation
    let redo_wraps = [];
    for (let i = TO_HB_index + 1; i < HB.length; i++) {
        redo_wraps.push(to.prim.wrapDif(to.prim.deepCopy(HB[i][1])));
    }

    let reversed_redo_difs = [];
    for (let i = HB.length - 1; i > TO_HB_index; i--) {
        let dif = to.prim.deepCopy(HB[i][1]);
        dif.reverse();
        reversed_redo_difs.push(dif);
    }

    // transforming undone difs
    let transformed_wraps = [];
    let first_transformed_wrap = to.prim.LIT(redo_wraps[0], transformed_message[1]);
    transformed_wraps.push(first_transformed_wrap);
    let LET_transformation_dif = [];
    let LIT_transformation_dif = [...transformed_message[1]];
    for (let i = 1; i < redo_wraps.length; i++) {
        LET_transformation_dif.unshift(...reversed_redo_difs[reversed_redo_difs.length - i]);
        let excluded_wrap = to.prim.LET(redo_wraps[i], LET_transformation_dif);
        LIT_transformation_dif.push(...transformed_wraps[i - 1]);
        let transformed_wrap = to.prim.LIT(excluded_wrap, LIT_transformation_dif);
        transformed_wraps.push(transformed_wrap);
    }

    // unwrapping transformed wraps
    let transformed_difs = [];
    transformed_wraps.forEach(wrap => transformed_difs.push(to.prim.unwrapDif(wrap)));

    // redoing undone difs
    transformed_difs.forEach(dif => document = to.applyDif(dif, document));

    // creating operations from undone difs
    let transformed_operations = [];
    transformed_difs.forEach((dif, i) => {
        let transformed_operation = [HB[TO_HB_index + 1 + i][0], dif];
        transformed_operations.push(transformed_operation);
    });

    // updating HB
    HB.push(transformed_message)
    transformed_operations.forEach(operation => HB.push(operation));

    console.log('UDR full run');
    log(transformed_message);

    return {
        message: transformed_message,
        document: document,
        HB: HB
    };
}

to.GOTCA = function(message, HB, SO) {
    /**
     *  @note Due to the fact that all operations are being received by all clients in the same
         order, the only independant operations from the received one can be those made by the
        local client after the received ones generation, as all others are present in the context
        of the received operation.
    */

    // array of difs of independant operations in HB
    let independant_difs = [];
    // causally preceding difs with an index higher than last_directly_dependant_index
    let locally_dependant_difs = [];
    let locally_dependant_indices = [];

    let last_directly_dependant_index = SO.findIndex((operation) => operation[0] === message[0][2] && operation[1] === message[0][3]);

    // finding independant operations
    for (let HB_index = 0, SO_index = 0; HB_index < HB.length; HB_index++) {
    // filtering all directly dependant operations
    if (SO_index <= last_directly_dependant_index) {
        if (HB[HB_index][0][0] === SO[SO_index][0] &&
            HB[HB_index][0][1] === SO[SO_index][1]
        ) {
            SO_index++;
            continue;
        }
    }
    // filtering all locally dependant operations
    if (HB[HB_index][0][0] === message[0][0]) {
        locally_dependant_difs.push(HB[HB_index][1]);
        locally_dependant_indices.push(HB_index);
        continue;
    }

    // the remainder must be independant
    independant_difs.push(HB[HB_index][1]);
    }

    // there are no independant messages, therefore no transformation is needed
    if (independant_difs.length === 0) {
        console.log('GOTCA no independant messages');
        return message; 
    }

    let wrapped_message_dif = to.prim.wrapDif(message[1]);

    // there are no locally dependant operations in HB, therefore all independant operations can be included directly
    if (locally_dependant_difs.length === 0) {
        let transformation_dif = [];
        independant_difs.forEach(dif => transformation_dif.push(...dif));
        let transformed_message_wrap = to.prim.LIT(wrapped_message_dif, transformation_dif);
        message[1] = to.prim.unwrapDif(transformed_message_wrap);
        console.log('GOTCA no locally dependant operations');
        log(message);
        return message;
    }

    // preparing difs for transformation
    let locally_dependant_wraps = [];
    locally_dependant_difs.forEach(dif => locally_dependant_wraps.push(to.prim.wrapDif(to.prim.deepCopy(dif))));

    let TO_HB_index = to.prim.findTOIndex(message, HB, SO);
    let reversed_transformer_difs = [];
    for (let i = TO_HB_index; i > last_directly_dependant_index; i--) {
        let dif = to.prim.deepCopy(HB[i][1]);
        dif.reverse();
        reversed_transformer_difs.push(dif);
    }

    // [..., last_dep_index=20, indep1, indep2, loc_dep0=23, indep3, loc_dep1=25]

    // transformation
    let transformed_wraps = []; ///TODO: actually wrapped difs, rename this
    let LET_transformation_dif = to.prim.dissolveArrays(reversed_transformer_difs.slice(reversed_transformer_difs.length - (locally_dependant_indices[0] - (last_directly_dependant_index + 1))));
    let LIT_transformation_dif = [];
    let first_transformed_wrap = to.prim.LET(locally_dependant_wraps[0], LET_transformation_dif);
    transformed_wraps.push(first_transformed_wrap);
    for (let i = 1; i < locally_dependant_wraps.length; i++) {
        LET_transformation_dif = to.prim.dissolveArrays(reversed_transformer_difs.slice(reversed_transformer_difs.length - (locally_dependant_indices[i] - (last_directly_dependant_index + 1))));
        let excluded_wrap = to.prim.LET(locally_dependant_wraps[i], LET_transformation_dif);
        LIT_transformation_dif.push(...transformed_wraps[i - 1]);
        let transformed_wrap = to.prim.LIT(excluded_wrap, LIT_transformation_dif);
        transformed_wraps.push(transformed_wrap);
    }
    let transformed_difs = [];
    transformed_wraps.forEach(wrap => transformed_difs.push(to.prim.unwrapDif(wrap)));
    transformed_difs.reverse();
    let transformed_message_wrap = to.prim.LET(wrapped_message_dif, to.prim.dissolveArrays(transformed_difs));
    transformed_message_wrap = to.prim.LIT(transformed_message_wrap, to.prim.dissolveArrays(HB.slice(last_directly_dependant_index + 1, TO_HB_index + 1)));
    message[1] = to.prim.unwrapDif(transformed_message_wrap);
    console.log('GOTCA full run');
    log(message);
    return message;
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
            let end_pos = dif[i][1] + dif[i][2];
            if (dif[i][0] === dif[i+1][0] &&      // they are on the same row
                end_pos === dif[i+1][1] &&           // they are adjacent
                to.isDel(dif[i+1])                   // the next entry is of type Del
            ) {
                dif[i] = [dif[i][0], dif[i][1], dif[i][2] + dif[i+1][2]];
                dif.splice(i+1, 1);
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

/**
 * @brief Finds the index of an HB entry that the operation directly follows.
 * 
 * @returns Index of the HB entry or -1 if not found.
 */
to.prim.findTOIndex = function(operation, HB, SO) {
    let SO_index = SO.findIndex((entry) => entry[0] === operation[0][0] && entry[1] === operation[0][1]); // index of operation
    console.log('SO_index', SO_index);
    if (SO_index === 0) return -1;
    let HB_index = HB.findIndex((entry) => entry[0][0] === SO[SO_index - 1][0] && entry[0][1] === SO[SO_index - 1][1]); // index of entry before operation
    return HB_index;
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
to.prim.sameRow = function(wrap, transformer) {
    return wrap.sub[0] === transformer[0];
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
                informationLost: false, // whether the context had to be saved
                relative: false, // whether relative addresing is in place
                context: {
                    original: null,
                    transformers: null,
                    addresser: null
                }
            },
            metaAdd: {
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
    let s = wrap;
    if (s.constructor === Object && s.hasOwnProperty('sub')) {
        s = s.sub;
    }
    return s;
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
to.prim.saveLI = function(wrap, subdif, transformer, mode='default') {
    if (mode === 'default') {
        wrap.meta.informationLost = true;
        wrap.meta.context.original = subdif;
        wrap.meta.context.transformer = transformer;
    }
    else if (mode === 'add') {
        wrap.metaAdd.informationLost = true;
        wrap.metaAdd.context.original = subdif;
        wrap.metaAdd.context.transformer = transformer;
    }
    else if (mode === 'del') {
        wrap.metaDel.informationLost = true;
        wrap.metaDel.context.original = subdif;
        wrap.metaDel.context.transformer = transformer;
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
///TODO: is it sufficient to check whether they are equal? what if there are two identical subdifs?
to.prim.checkLI = function(wrap, transformer) {
    if (!wrap.meta.informationLost) {
        return false;
    }
    return to.prim.identicalSubdifs(wrap.meta.context.transformer, transformer);
}
to.prim.recoverLI = function(wrap) {
    return wrap.meta.context.original;
}
to.prim.checkBO = function(wrap, subdif) {
    if (!to.isMove(wrap)) {
        return to.prim.identicalSubdifs(wrap.meta.context.addresser, subdif);
    }
    return to.prim.identicalSubdifs(wrap.metaAdd.context.addresser, subdif) ||
           to.prim.identicalSubdifs(wrap.metaDel.context.addresser, subdif);
}
to.prim.convertAA = function(wrap, addresser) {
    if (!to.isMove(wrap)) {
        wrap.sub[1] += wrap.meta.context.addresser[1];
        wrap.meta.relative = false;
        wrap.meta.context.addresser = null;
    }
    else if (to.prim.identicalSubdifs(wrap.metaAdd.context.addresser, addresser)) {
        wrap.sub[3] += wrap.metaAdd.context.addresser[1];
        wrap.metaAdd.relative = false;
        wrap.metaAdd.context.addresser = null;
    }
    else if (to.prim.identicalSubdifs(wrap.metaDel.context.addresser, addresser)) {
        wrap.sub[1] += wrap.metaDel.context.addresser[1];
        wrap.metaDel.relative = false;
        wrap.metaDel.context.addresser = null;
    }
    else {
        console.log('Unknown addresser in convertAA!');
    }
    return wrap;
}

to.prim.LIT = function(wrapped_dif, transformation_dif) {
    if (wrapped_dif.length === 0) return [];
    let transformed_wraps_1 = to.prim.LIT1(wrapped_dif[0], transformation_dif);
    let transformed_wraps_2 = to.prim.LIT(wrapped_dif.slice(1), [...transformation_dif, ...transformed_wraps_1]);
    return [...transformed_wraps_1, ...transformed_wraps_2];    
}
to.prim.LIT1 = function(wrap, transformation_dif) {
    let transformed_wraps = [];
    if (transformation_dif.length === 0) {
        transformed_wraps = [wrap];
    }
    else if (to.prim.checkRA(wrap) && !to.prim.checkBO(wrap, transformation_dif[0])) {
        transformed_wraps = to.prim.LIT1(wrap, transformation_dif.slice(1));
    } 
    else if (to.prim.checkRA(wrap) && to.prim.checkBO(wrap, transformation_dif[0])) {
        to.prim.convertAA(wrap, transformation_dif[0]);
        transformed_wraps = to.prim.LIT1(wrap, transformation_dif.slice(1));
    }
    else {
        transformed_wraps = to.prim.LIT(to.prim.IT(wrap, transformation_dif[0]), transformation_dif.slice(1));
    }
    return transformed_wraps;
}

to.prim.LET = function(wrapped_dif, transformation_dif) {
    if (wrapped_dif.length === 0) return [];
    let transformed_wraps_1 = to.prim.LET1(wrapped_dif[0], transformation_dif);
    let transformed_wraps_2 = to.prim.LET(wrapped_dif.slice(1), transformation_dif);
    return [...transformed_wraps_1, ...transformed_wraps_2];
}
to.prim.LET1 = function(wrap, transformation_dif) {
    let transformed_wraps = [];
    if (transformation_dif.length === 0) {
        transformed_wraps = [wrap];
    }
    else if (to.prim.checkRA(wrap)) {
        transformed_wraps = [wrap];
    }
    else {
        transformed_wraps = to.prim.LET(to.prim.ET(wrap, transformation_dif[0]), transformation_dif.slice(1));
    }
    return transformed_wraps;
}

to.prim.IT = function(wrap, transformer) {
    let transformed_wraps = [];
    if (to.isAdd(wrap)) {
        if (to.isAdd(transformer)) transformed_wraps.push(to.prim.IT_AA(wrap, transformer));
        else if (to.isDel(transformer)) transformed_wraps.push(to.prim.IT_AD(wrap, transformer));
        else if (to.isMove(transformer)) transformed_wraps.push(to.prim.IT_AM(wrap, transformer));
        else if (to.isNewline(transformer)) transformed_wraps.push(to.prim.IT_AN(wrap, transformer));
        else if (to.isRemline(transformer)) transformed_wraps.push(to.prim.IT_AR(wrap, transformer));
    }
    else if (to.isDel(wrap)) {
        if (to.isAdd(transformer)) {
            let result = to.prim.IT_DA(wrap, transformer);
            if (to.isDel(result)) transformed_wraps.push(result);
            else {
                transformed_wraps.push(result[0]);
                transformed_wraps.push(result[1]);
            }
        }
        else if (to.isDel(transformer)) transformed_wraps.push(to.prim.IT_DD(wrap, transformer));
        else if (to.isMove(transformer)) {
            let result = to.prim.IT_DM(wrap, transformer);
            if (isDel(result)) transformed_wraps.push(result);
            else {
                transformed_wraps.push(result[0]);
                transformed_wraps.push(result[1]);
            }
        }
        else if (to.isNewline(transformer)) transformed_wraps.push(to.prim.IT_DN(wrap, transformer));
        else if (to.isRemline(transformer)) transformed_wraps.push(to.prim.IT_DR(wrap, transformer));
    }
    else if (to.isMove(wrap)) {
        if (to.isAdd(transformer)) {
            let result = to.prim.IT_MA(wrap, transformer);
            if (to.isMove(result)) transformed_wraps.push(result);
            else {
                transformed_wraps.push(result[0]);
                transformed_wraps.push(result[1]);
            }
        }
        else if (to.isDel(transformer)) transformed_wraps.push(to.prim.IT_MD(wrap, transformer));
        else if (to.isMove(transformer)) {
            let result = to.prim.IT_MM(wrap, transformer);
            if (isMove(result)) transformed_wraps.push(result);
            else {
                transformed_wraps.push(result[0]);
                transformed_wraps.push(result[1]);
            }
        }
        else if (to.isNewline(transformer)) transformed_wraps.push(to.prim.IT_MN(wrap, transformer));
        else if (to.isRemline(transformer)) transformed_wraps.push(to.prim.IT_MR(wrap, transformer));
    }
    else if (to.isNewline(wrap)) {
        if (to.isAdd(transformer)) transformed_wraps.push(to.prim.IT_NA(wrap, transformer));
        else if (to.isDel(transformer)) transformed_wraps.push(to.prim.IT_ND(wrap, transformer));
        else if (to.isMove(transformer)) transformed_wraps.push(to.prim.IT_NM(wrap, transformer));
        else if (to.isNewline(transformer)) transformed_wraps.push(to.prim.IT_NN(wrap, transformer));
        else if (to.isRemline(transformer)) transformed_wraps.push(to.prim.IT_NR(wrap, transformer));
    }
    else if (to.isRemline(wrap)) {
        if (to.isAdd(transformer)) transformed_wraps.push(to.prim.IT_RA(wrap, transformer));
        else if (to.isDel(transformer)) transformed_wraps.push(to.prim.IT_RD(wrap, transformer));
        else if (to.isMove(transformer)) transformed_wraps.push(to.prim.IT_RM(wrap, transformer));
        else if (to.isNewline(transformer)) transformed_wraps.push(to.prim.IT_RN(wrap, transformer));
        else if (to.isRemline(transformer)) transformed_wraps.push(to.prim.IT_RR(wrap, transformer));
    }
    return transformed_wraps;
}
to.prim.ET = function(wrap, transformer) {
    let transformed_wraps = [];
    if (to.isAdd(wrap)) {
        if (to.isAdd(transformer)) transformed_wraps.push(to.prim.ET_AA(wrap, transformer));
        else if (to.isDel(transformer)) transformed_wraps.push(to.prim.ET_AD(wrap, transformer));
        else if (to.isMove(transformer)) transformed_wraps.push(to.prim.ET_AM(wrap, transformer));
        else if (to.isNewline(transformer)) transformed_wraps.push(to.prim.ET_AN(wrap, transformer));
        else if (to.isRemline(transformer)) transformed_wraps.push(to.prim.ET_AR(wrap, transformer));
    }
    else if (to.isDel(wrap)) {
        if (to.isAdd(transformer)) {
            let result = to.prim.ET_DA(wrap, transformer);
            if (to.isDel(result)) transformed_wraps.push(result);
            else {
                transformed_wraps.push(result[0]);
                transformed_wraps.push(result[1]);
            }
        }
        else if (to.isDel(transformer)) {
            let result = to.prim.ET_DD(wrap, transformer);
            if (isDel(result)) transformed_wraps.push(result);
            else {
                transformed_wraps.push(result[0]);
                transformed_wraps.push(result[1]);
            }
        }
        else if (to.isMove(transformer)) {
            let result = to.prim.ET_DM(wrap, transformer);
            if (isDel(result)) transformed_wraps.push(result);
            else {
                transformed_wraps.push(result[0]);
                transformed_wraps.push(result[1]);
            }
        }
        else if (to.isNewline(transformer)) transformed_wraps.push(to.prim.ET_DN(wrap, transformer));
        else if (to.isRemline(transformer)) transformed_wraps.push(to.prim.ET_DR(wrap, transformer));
    }
    else if (to.isMove(wrap)) {
        if (to.isAdd(transformer)) {
            let result = to.prim.ET_MA(wrap, transformer);
            if (to.isMove(result)) transformed_wraps.push(result);
            else {
                transformed_wraps.push(result[0]);
                transformed_wraps.push(result[1]);
            }
        }
        else if (to.isDel(transformer)) {
            let result = to.prim.ET_MD(wrap, transformer);
            if (to.isMove(result)) transformed_wraps.push(result);
            else {
                transformed_wraps.push(result[0]);
                transformed_wraps.push(result[1]);
            }
        }
        else if (to.isMove(transformer)) {
            let result = to.prim.ET_MM(wrap, transformer);
            if (isMove(result)) transformed_wraps.push(result);
            else {
                transformed_wraps.push(result[0]);
                transformed_wraps.push(result[1]);
            }
        }
        else if (to.isNewline(transformer)) transformed_wraps.push(to.prim.ET_MN(wrap, transformer));
        else if (to.isRemline(transformer)) transformed_wraps.push(to.prim.ET_MR(wrap, transformer));
    }
    else if (to.isNewline(wrap)) {
        if (to.isAdd(transformer)) transformed_wraps.push(to.prim.ET_NA(wrap, transformer));
        else if (to.isDel(transformer)) transformed_wraps.push(to.prim.ET_ND(wrap, transformer));
        else if (to.isMove(transformer)) transformed_wraps.push(to.prim.ET_NM(wrap, transformer));
        else if (to.isNewline(transformer)) transformed_wraps.push(to.prim.ET_NN(wrap, transformer));
        else if (to.isRemline(transformer)) transformed_wraps.push(to.prim.ET_NR(wrap, transformer));
    }
    else if (to.isRemline(wrap)) {
        if (to.isAdd(transformer)) transformed_wraps.push(to.prim.ET_RA(wrap, transformer));
        else if (to.isDel(transformer)) transformed_wraps.push(to.prim.ET_RD(wrap, transformer));
        else if (to.isMove(transformer)) transformed_wraps.push(to.prim.ET_RM(wrap, transformer));
        else if (to.isNewline(transformer)) transformed_wraps.push(to.prim.ET_RN(wrap, transformer));
        else if (to.isRemline(transformer)) transformed_wraps.push(to.prim.ET_RR(wrap, transformer));
    }
    return transformed_wraps;
}


to.prim.IT_AA = function(wrap, transformer) {
    if (!to.prim.sameRow(wrap, transformer)) return wrap;
    if (wrap.sub[1] < transformer[1]) return wrap;
    wrap.sub[1] += transformer[2].length;
    return wrap;
}
to.prim.IT_AD = function(wrap, transformer) {
    if (!to.prim.sameRow(wrap, transformer)) return wrap;
    if (wrap.sub[1] <= transformer[1]) return wrap;
    if (wrap.sub[1] > transformer[1] + transformer[2]) {
        wrap.sub[1] -= transformer[2];
    }
    else {
        to.prim.saveLI(wrap, to.prim.deepCopy(wrap.sub), transformer);
        wrap.sub[1] = transformer[1];
    }
    return wrap;
}
to.prim.IT_AM = function(wrap, transformer) {
    if (wrap.sub[0] === transformer[0]) {
        wrap = to.prim.IT_AD(wrap, to.del(transformer[0], transformer[1], transformer[4]));
    }
    else if (wrap.sub[0] === transformer[2]) {
        wrap = to.prim.IT_AA(wrap, to.add(transformer[2], transformer[3], to.prim.mockupString(transformer[4])));
    }
    return wrap;
}
to.prim.IT_AN = function(wrap, transformer) {
    if (transformer <= wrap.sub[0]) {
        wrap.sub[0]++;
    }
    return wrap;
}
to.prim.IT_AR = function(wrap, transformer) {
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
to.prim.IT_DA = function(wrap, transformer) {
    if (!to.prim.sameRow(wrap, transformer)) return wrap;
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
to.prim.IT_DD = function(wrap, transformer) {
    if (!to.prim.sameRow(wrap, transformer)) return wrap;
    if (transformer[1] >= wrap.sub[1] + wrap.sub[2]) return wrap;
    if (wrap.sub[1] >= transformer[1] + transformer[2]) {
        wrap.sub = to.del(wrap.sub[0], wrap.sub[1] - transformer[2], wrap.sub[2]);
    }
    else {
        to.prim.saveLI(wrap, to.prim.deepCopy(wrap.sub), transformer);
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
to.prim.IT_DM = function(wrap, transformer) {
    if (wrap.sub[0] === transformer[0]) {
        wrap = to.prim.IT_DD(wrap, to.del(transformer[0], transformer[1], transformer[4]));
    }
    else if (wrap.sub[0] === transformer[2]) {
        wrap = to.prim.IT_DA(wrap, to.add(transformer[2], transformer[3], to.prim.mockupString(transformer[4])));
    }
    return wrap;
}
to.prim.IT_DN = function(wrap, transformer) {
    if (transformer <= wrap.sub[0]) {
        wrap.sub[0]++;
    }
    return wrap;
}
to.prim.IT_DR = function(wrap, transformer) {
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
to.prim.IT_MA = function(wrap, transformer) {
    if (wrap.sub[0] === transformer[0]) {
        let del_wrap = to.prim.IT_DA(to.prim.wrapSubdif(to.del(wrap.sub[0], wrap.sub[1], wrap.sub[4])), transformer);
        if (to.isDel(del_wrap)) {
            wrap.sub[1] = del_wrap.sub[1];
        }
        else {
            return [to.prim.wrapSubdif(to.move(wrap.sub[0], del_wrap[0].sub[1], wrap.sub[2], wrap.sub[3], del_wrap[0].sub[2])),
                    to.prim.wrapSubdif(to.move(wrap.sub[0], del_wrap[1].sub[1], wrap.sub[2], wrap.sub[3] + del_wrap[0].sub[2], del_wrap[1].sub[2]))];
        } 
    }
    else if (wrap.sub[2] === transformer[0]) {
        let add_wrap = to.prim.IT_AA(to.prim.wrapSubdif(to.add(wrap.sub[2], wrap.sub[3], to.prim.mockupString(wrap.sub[4]))), transformer);
        wrap.sub[3] = add_wrap.sub[1];
    }
    return wrap;
}
to.prim.IT_MD = function(wrap, transformer) {
    if (wrap.sub[0] === transformer[0]) {
        let del_wrap = to.prim.IT_DD(to.prim.wrapSubdif(to.del(wrap.sub[0], wrap.sub[1], wrap.sub[4])), transformer);
        if (del_wrap.meta.informationLost) {
            to.prim.saveLI(wrap, to.prim.deepCopy(wrap.sub), transformer, 'del');
        }
        wrap.sub[1] = del_wrap.sub[1];
        wrap.sub[4] = del_wrap.sub[2];
    }
    else if (wrap.sub[2] === transformer[0]) {
        let add_wrap = to.prim.IT_AD(to.prim.wrapSubdif(to.add(wrap.sub[2], wrap.sub[3], to.prim.mockupString(wrap.sub[4]))), transformer);
        if (add_wrap.meta.informationLost) {
            to.prim.saveLI(wrap, to.prim.deepCopy(wrap.sub), transformer, 'add');
        }
        wrap.sub[3] = add_wrap[1];
    }
    return wrap;
}
// @note May return an array with two subdifs
to.prim.IT_MM = function(wrap, transformer) {
    if (wrap.sub[0] === transformer[0]) {
        wrap = to.prim.IT_MD(wrap, to.del(transformer[0], transformer[1], transformer[4]));
    }
    if (wrap.sub[0] === transformer[2]) {
        let del_wrap = to.prim.IT_DA(to.prim.wrapSubdif(to.del(wrap.sub[0], wrap.sub[1], wrap.sub[4])), to.add(transformer[2], transformer[3], to.prim.mockupString(transformer[4])));
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
    if (subdif[2] === transformer[0]) {
        wrap = to.prim.IT_MD(wrap, to.del(transformer[0], transformer[1], transformer[4]));
    }
    if (subdif[2] === transformer[2]) {
        wrap = to.prim.IT_MA(wrap, to.add(transformer[2], transformer[3], to.prim.mockupString(transformer[4])));
    }
    return wrap;
}
to.prim.IT_MN = function(wrap, transformer) {
    if (wrap.sub[0] >= transformer) wrap.sub[0]++;
    if (wrap.sub[2] >= transformer) wrap.sub[2]++;
    return wrap;
}
to.prim.IT_MR = function(wrap, transformer) {
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
to.prim.IT_NA = function(wrap, transformer) {
    return wrap;
}
to.prim.IT_ND = function(wrap, transformer) {
    return wrap;
}
to.prim.IT_NM = function(wrap, transformer) {
    return wrap;
}
to.prim.IT_NN = function(wrap, transformer) {
    if (transformer <= wrap.sub) wrap.sub++;
    return wrap;
}
to.prim.IT_NR = function(wrap, transformer) {
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
to.prim.IT_RA = function(wrap, transformer) {
    if (-wrap.sub === transformer[0]) {
        console.log("Transforming remline agains an add on the same row!");
        ///TODO: find out a way to handle this
    }
    return wrap;
}
to.prim.IT_RD = function(wrap, transformer) {
    return wrap;
}
to.prim.IT_RM = function(wrap, transformer) {
    if (-wrap.sub === transformer[2]) {
        console.log("Transforming remline agains a move addition on the same row!");
        ///TODO: find out a way to handle this
    }
    return wrap;
}
to.prim.IT_RN = function(wrap, transformer) {
    if (transformer <= -wrap.sub) wrap.sub--;
    return wrap;
}
to.prim.IT_RR = function(wrap, transformer) {
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

to.prim.ET_AA = function(wrap, transformer) {
    if (!to.prim.sameRow(wrap, transformer)) return wrap;
    if (wrap.sub[1] <= transformer[1]) return wrap;
    if (wrap.sub[1] >= transformer[1] + transformer[2].length) {
        wrap.sub[1] -= transformer[2].length;
    }
    else {
        wrap.sub[1] -= transformer[1];
        to.prim.saveRA(wrap, transformer);
    }
    return wrap;
}
to.prim.ET_AD = function(wrap, transformer) {
    if (!to.prim.sameRow(wrap, transformer)) return wrap;
    if (to.prim.checkLI(wrap, transformer)) {
        wrap.sub = to.prim.recoverLI(wrap);
    }
    else if (wrap.sub[1] <= transformer[1]) return wrap;
    else {
        wrap.sub[1] += transformer[2];
    }
    return wrap;
}
to.prim.ET_AM = function(wrap, transformer) {
    if (wrap.sub[0] === transformer[0]) {
        wrap.sub = to.prim.ET_AD(wrap, to.del(transformer[0], transformer[1], transformer[4]));
    }
    else if (wrap.sub[0] === transformer[2]) {
        wrap.sub = to.prim.ET_AA(wrap, to.add(transformer[2], transformer[3], to.prim.mockupString(transformer[4])));
    }
    return wrap;
}
to.prim.ET_AN = function(wrap, transformer) {
    if (transformer < wrap.sub[0]) { ///TODO: revise this
        wrap.sub[0]--;
    }
    return wrap;
}
to.prim.ET_AR = function(wrap, transformer) {
    if (-transformer < wrap.sub[0]) {
        wrap.sub[0]++;
    }
    return wrap;
}
// @note May return an array with two subdifs
to.prim.ET_DA = function(wrap, transformer) {
    if (!to.prim.sameRow(wrap, transformer)) return wrap;
    if (wrap.sub[1] + wrap.sub[2] <= transformer[1]) return wrap;
    if (wrap.sub[1] >= transformer[1] + transformer[2].length) {
        wrap.sub[1] -= transformer[2].length;
    }
    else {
        if (transformer[1] <= wrap.sub[1] && wrap.sub[1] + wrap.sub[2] <= transformer[1] + transformer[2].length) {
            wrap.sub[1] -= transformer[1];
            to.prim.saveRA(wrap, transformer);
        }
        else if (transformer[1] <= wrap.sub[1] && wrap.sub[1] + wrap.sub[2] > transformer[1] + transformer[2].length) {
            let del1_wrap = to.prim.wrapSubdif(to.del(wrap.sub[0], wrap.sub[1] - transformer[1], transformer[1] + transformer[2].length - wrap.sub[1]));
            let del2_wrap = to.prim.wrapSubdif(to.del(wrap.sub[0], transformer[1], wrap.sub[1] + wrap.sub[2] - transformer[1] - transformer[2].length));
            to.prim.saveRA(del1_wrap, transformer);
            return [del1_wrap, del2_wrap];
        }
        else if (transformer[1] > wrap.sub[1] && transformer[1] + transformer[2].length <= wrap.sub[1] + wrap.sub[2]) {
            let del1_wrap = to.prim.wrapSubdif(to.del(wrap.sub[0], 0, transformer[2].length));
            let del2_wrap = to.prim.wrapSubdif(to.del(wrap.sub[0],  wrap.sub[1], wrap.sub[2] - transformer[2].length));
            to.prim.saveRA(del1_wrap, transformer);
            return [del1_wrap, del2_wrap];
        }
        else {
            let del1_wrap = to.prim.wrapSubdif(to.del(wrap.sub[0], 0, wrap.sub[1] + wrap.sub[2] - transformer[1]));
            let del2_wrap = to.prim.wrapSubdif(to.del(wrap.sub[0],  wrap.sub[1], transformer[1] - wrap.sub[1]));
            to.prim.saveRA(del1_wrap, transformer);
            return [del1_wrap, del2_wrap];
        }
    }
    return wrap;
}
// @note May return an array with two subdifs
to.prim.ET_DD = function(wrap, transformer) {
    if (!to.prim.sameRow(wrap, transformer)) return wrap;
    if (to.prim.checkLI(wrap, transformer)) {
        wrap.sub = to.prim.recoverLI(wrap);
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
to.prim.ET_DM = function(wrap, transformer) {
    if (wrap.sub[0] === transformer[0]) {
        wrap = to.prim.ET_DD(wrap, to.del(transformer[0], transformer[1], transformer[4]));
    }
    else if (wrap.sub[0] === transformer[2]) {
        wrap = to.prim.ET_DA(wrap, to.add(transformer[2], transformer[3], to.prim.mockupString(transformer[4])));
    }
    return wrap;
}
to.prim.ET_DN = function(wrap, transformer) {
    if (transformer < wrap.sub[0]) { ///TODO: revise this
        wrap.sub[0]--;
    }
    return wrap;
}
to.prim.ET_DR = function(wrap, transformer) {
    if (-transformer < wrap.sub[0]) {
        wrap.sub[0]++;
    }
    return wrap;
}
to.prim.ET_DN = function(wrap, transformer) {
    if (transformer < wrap.sub[0]) { ///TODO: revise this
        wrap.sub[0]--;
    }
    return wrap;
}
to.prim.ET_DR = function(wrap, transformer) {
    if (-transformer < wrap.sub[0]) {
        wrap.sub[0]++;
    }
    return wrap;
}
// @note May return an array with two subdifs
to.prim.ET_MA = function(wrap, transformer) {
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
to.prim.ET_MD = function(wrap, transformer) {
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
to.prim.ET_MM = function(wrap, transformer) {
    ///TODO: finish
    console.log('Not implemented ET_MM');
    return wrap;
}
to.prim.ET_MN = function(wrap, transformer) {
    if (transformer < wrap.sub[0]) wrap.sub[0]--;
    if (transformer < wrap.sub[2]) wrap.sub[2]--;
    return wrap;
}
to.prim.ET_MR = function(wrap, transformer) {
    if (-transformer < wrap.sub[0]) wrap.sub[0]++;
    if (-transformer < wrap.sub[2]) wrap.sub[2]++;
    return wrap;
}
to.prim.ET_NA = function(wrap, transformer) {
    return wrap;
}
to.prim.ET_ND = function(wrap, transformer) {
    return wrap;
}
to.prim.ET_NM = function(wrap, transformer) {
    return wrap;
}
to.prim.ET_NN = function(wrap, transformer) {
    if (transformer < wrap.sub) wrap.sub--;
    return wrap;
}
to.prim.ET_NR = function(wrap, transformer) {
    if (-transformer < wrap.sub) wrap.sub++;
    return wrap;
}
to.prim.ET_RA = function(wrap, transformer) {
    return wrap;
}
to.prim.ET_RD = function(wrap, transformer) {
    return wrap;
}
to.prim.ET_RM = function(wrap, transformer) {
    return wrap;
}
to.prim.ET_RN = function(wrap, transformer) {
    if (transformer < -wrap.sub) wrap.sub++;
    return wrap;
}
to.prim.ET_RR = function(wrap, transformer) {
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
