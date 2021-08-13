/**
 * @note Dif definition: A dif is an array of primitive operations called subdifs.
   A primitive operation can be adding newlines (called newline), removing empty lines (called
   remlines), adding text (called add) or deleting text (called del).

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
      Example: applying the subdif [3, 5, 4] where the content of row 3 is '123456789'
      will result in the new content of row 3 being '16789' (the 5th character and 3 preceding
      ones will be removed - a total of 4 characters).

    Example dif: [2, -3, [1, 2, 'abc'], [3, 3, 1]]
*/

if (typeof to === 'undefined') {
    // Export for browsers
    var to = {};
}

to.isAdd = function(subdif) {
    return (subdif.constructor === Array && typeof subdif[2] === 'string');
}

to.isDel = function(subdif) {
    return (subdif.constructor === Array && typeof subdif[2] === 'number');
}

to.isNewline = function(subdif) {
    return (typeof subdif === 'number' && subdif >= 0);
}

to.isRemline = function(subdif) {  
    return (typeof subdif === 'number' && subdif < 0); // line 0 cannot be deleted
}

to.merge = function(buf_ref) {
    let buf = JSON.parse(JSON.stringify(buf_ref)); // deep copy

    // remove empty Adds/Dels
    for (let i = 0; i < buf.length; ++i) {
        if (to.isAdd(buf[i])) {
            if (buf[i][2] === "") {
                buf.splice(i, 1);
                --i;
            }
        }
        else if (to.isDel(buf[i])) {
            if (buf[i][2] === 0) {
                buf.splice(i, 1);
                --i;
            }
        }
    }
    
    // join adjacent Adds
    for (let i = 0; i < buf.length - 1; ++i) { // so that there is a next entry
        if (to.isAdd(buf[i])) {
            let end_pos = buf[i][1] + buf[i][2].length;
            if (buf[i][0] === buf[i+1][0] &&      // they are on the same row
                end_pos === buf[i+1][1] &&           // they are adjacent
                to.isAdd(buf[i+1])                   // the next entry is of type Add
            ) {
                buf[i] = [buf[i][0], buf[i][1], buf[i][2] + buf[i+1][2]];
                buf.splice(i+1, 1);
                i--; // decrement i so that the merged subdif will be compared with the next one
            }
        }
    }

    // join adjacent Dels
    for (let i = 0; i < buf.length - 1; ++i) { // so that there is a next entry
        if (to.isDel(buf[i])) {
            let end_pos = buf[i][1] - buf[i][2];
            if (buf[i][0] === buf[i+1][0] &&      // they are on the same row
                end_pos === buf[i+1][1] &&           // they are adjacent
                to.isDel(buf[i+1])                   // the next entry is of type Add
            ) {
                buf[i] = [buf[i][0], buf[i][1], buf[i][2] + buf[i+1][2]];
                buf.splice(i+1, 1);
            }
        }
    }

    // line deletion right propagation
    for (let i = buf.length - 1; i >= 0; --i) {
        if (to.isRemline(buf[i])) {
            for (let j = i + 1; j < buf.length; ++j) {
                if (to.isAdd(buf[j]) && buf[j][0] >= -buf[i]) {
                    buf[j][0] += 1;
                }
                else if (to.isDel(buf[j]) && buf[j][0] >= -buf[i]) {
                    buf[j][0] += 1;
                }
                else if (to.isNewline(buf[j])) {
                    if (buf[j] >= -buf[i]) {
                        buf[j] += 1;
                    }
                    else {
                        buf[i] -= 1;
                    }
                }
                else if (to.isRemline(buf[j])) {
                    if (buf[i] >= buf[j]) {
                        buf[j] -= 1;
                    }
                    else {
                        buf[i] += 1;
                    }
                }
            }
            buf.push(buf[i]);
            buf.splice(i, 1);
        }
    }

    // line addition left propagation
    for (let i = 1; i < buf.length; ++i) {
        if (to.isNewline(buf[i])) {
            for (let j = i - 1; j >= 0; --j) {
                if (to.isAdd(buf[j]) && buf[j][0] >= buf[i]) {
                    buf[j][0] += 1;
                }
                else if (to.isDel(buf[j]) && buf[j][0] >= buf[i]) {
                    buf[j][0] += 1;
                }
                else if (to.isNewline(buf[j])) {
                    if (buf[i] <= buf[j]) {
                        buf[j] += 1;
                    }
                    else {
                        buf[i] -= 1;
                    }
                }
            }
            buf.unshift(buf[i]);
            buf.splice(i+1, 1);
        }
    }

    ///TODO: reorder newlines?
    
    // order Adds and Dels by row
    const first_non_nl = buf.findIndex(el => !to.isNewline(el));
    const first_reml = buf.findIndex(el => to.isRemline(el));
    const non_nl_el_count = buf.length - ((first_non_nl >= 0) ? first_non_nl : 0) - ((first_reml >= 0) ? (buf.length - first_reml) : 0);
    if (non_nl_el_count > 1) {
        let content = buf.slice(((first_non_nl >= 0) ? first_non_nl : 0), ((first_reml >= 0) ? first_reml : buf.length));
        let newlines = buf.slice(0, ((first_non_nl >= 0) ? first_non_nl : 0));
        let remlines = buf.slice(((first_reml >= 0) ? first_reml : buf.length), buf.length);
        content.sort(function(a,b) { return a[0] > b[0] });
        buf = [...newlines, ...content, ...remlines];
    }

    return buf;
}

to.applyAdd = function(previous_value, subdif) {
    if (subdif[1] > previous_value.length) {
        console.log('applyAdd subdif position too large!');
        return previous_value;
    }

    return (previous_value.substring(0, subdif[1]) + subdif[2] + previous_value.substring(subdif[1]));
}

to.applyDel = function(previous_value, subdif) {
    if (subdif[1] > previous_value.length) {
        console.log('applyDel subdif position too large!');
        return previous_value;
    }

    return (previous_value.substring(0, subdif[1] - subdif[2])) + previous_value.substring(subdif[1]);
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
        dif.push([targetRow, targetPosition + trailingRowText.length, trailingRowText.length]);
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
