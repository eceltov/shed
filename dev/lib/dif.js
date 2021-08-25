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
      will result in row 0 being "14" and row 1 being "ab23cd".

    Example dif: [2, -3, [1, 2, 'abc'], [3, 3, 1]]
*/

if (typeof to === 'undefined') {
    // Export for browsers
    var to = {};
}

to.isAdd = function(subdif) {
    //console.log(subdif);
    return (subdif.constructor === Array && subdif.length === 3 && typeof subdif[2] === 'string');
}

to.isDel = function(subdif) {
    return (subdif.constructor === Array && subdif.length === 3 && typeof subdif[2] === 'number');
}

to.isNewline = function(subdif) {
    return (typeof subdif === 'number' && subdif >= 0);
}

to.isRemline = function(subdif) {  
    return (typeof subdif === 'number' && subdif < 0); // line 0 cannot be deleted
}

to.isMove = function(subdif) {
    return (subdif.constructor === Array && subdif.length === 5);
}

to.merge = function(dif_ref) {
    let dif = JSON.parse(JSON.stringify(dif_ref)); // deep copy

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

to.transform = function(transformer, dif) {
    let new_transformer = JSON.parse(JSON.stringify(transformer));
    let new_transformer_reduction = 0;

    console.log("transformer:", JSON.stringify(transformer));
    console.log("transformee:", JSON.stringify(dif));
    for (let i = 0; i < transformer.length; i++) {
        for (let j = 0; j < dif.length; j++) {

            if (to.isAdd(transformer[i])) {
                if (to.isAdd(dif[j]) || to.isDel(dif[j])) {
                    if (transformer[i][0] === dif[j][0] && // same row
                        transformer[i][1] <= dif[j][1] // the transformer is at a lower or equal position
                    ) {
                        dif[j][1] += transformer[i][2].length;
                    }
                }
                // newlines are unchanged
                else if (to.isRemline(dif[j])) {
                    if (transformer[i][0] === -dif[j]) {
                        dif.splice(j, 1); // remove the remline
                        --j;
                    }
                }
            }
            else if (to.isDel(transformer[i])) {
                if (to.isAdd(dif[j]) || to.isDel(dif[j])) {
                    if (transformer[i][0] === dif[j][0] &&
                        transformer[i][1] <= dif[j][1]
                    ) {
                        dif[j][1] -= transformer[i][2]; // reduce position by the length of deletion
                    }
                    ///TODO: revise this (this is used in the 1aa2/1a2a3 example)
                    else if (to.isAdd(dif[j]) &&
                             transformer[i][0] === dif[j][0] &&
                             transformer[i][1] > dif[j][1]
                    ) {
                        transformer[i][1] += dif[j][2].length;
                    }
                }
                else if (to.isRemline(dif[j])) {
                    if (transformer[i][0] === -dif[j]) {
                        console.log("Transforming remline against delete!");
                    }
                }
            }
            else if (to.isNewline(transformer[i])) {
                if (to.isAdd(dif[j]) || to.isDel(dif[j])) {
                    if (transformer[i] <= dif[j][0]) { // if the transformer is on the same or lower line
                        ++dif[j][0];
                    }
                }
                else if (to.isNewline(dif[j])) {
                    if (transformer[i] <= dif[j]) {
                        ++dif[j];
                    }
                }
                else {
                    if (transformer[i] <= -dif[j]) {
                        --dif[j];
                    }
                }
            }
            else {
                if (to.isAdd(dif[j])) {
                    if (-transformer[i] === dif[j][0]) {
                        /*transformer.splice(i, 1); // delete from the transformer, as it tries to delete content from the dif
                        --i;*/
                        new_transformer.splice(i - new_transformer_reduction, 1);
                        ++new_transformer_reduction;
                    }
                }
                else if (to.isDel(dif[j])) {
                    if (-transformer[i] === dif[j][0]) {
                        console.log("Transforming delete against remline!");
                    }
                }
                else if (to.isNewline(dif[j])) {
                    if (-transformer[i] <= dif[j]) {
                        --dif[j];
                    }
                }
                else {
                    if (transformer[i] === dif[j]) {
                        dif.splice(j, 1); // remove the remline, as both transformer and dif try to delete the same row
                        --j;
                    }
                }
            }
        }
    }
    transformer = new_transformer;
    console.log("post transformer:", JSON.stringify(transformer));
    console.log("post transformee:", JSON.stringify(dif));
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

// only handles Adds and Dels
to.applySubdif = function(previous_value, subdif) {
    if (to.isAdd(subdif)) {
        return to.applyAdd(previous_value, subdif);
    }
    else if (to.isDel(subdif)) {
        return to.applyDel(previous_value, subdif);
    }
    else {
        console.log('Invalid applySubdif function call!');
    }
}

/**
 * @brief Converts text to a dif.
 * 
 * @param targetRow The row where the text is being added.
 * @param targetPosition The position at which the text is being added.
 * @param trailingRowText The text after the cursor
 * 
 * @returns Returns the final dif.
 */
to.textToDif = function(targetRow, targetPosition, text, trailingRowText) {
    const LINE_EXPRESSION = /\r\n|\n\r|\n|\r/g;
    let lines = text.split(LINE_EXPRESSION);
    let dif = [];

    // add all neccessary newlines
    for (let i = 0; i < lines.length - 1; ++i) {
        dif.push(targetRow + 1);
    }

    // remove the trailing text from the first row
    if (trailingRowText) {
        dif.push([targetRow, targetPosition, trailingRowText.length]);
    }

    // add the first line 
    if (lines[0]) {
        dif.push([targetRow, targetPosition, lines[0]]);
    }

    // add the remaining lines
    for (let i = 1; i < lines.length; ++i) {
        dif.push([targetRow + i, 0, lines[i]]);
    }

    //add the trailing text
    if (trailingRowText) {
        dif.push([targetRow + lines.length - 1, lines[lines.length - 1].length, trailingRowText]);
    }

    return dif;
}
