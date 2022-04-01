/* eslint-disable object-property-newline */
/* eslint-disable no-use-before-define */
const { deepCopy } = require('./utils');

let wrapID = 0; // id for wrapped difs (used in relative addressing)

// functions for subdif creation
function add(row, position, content) {
  return [row, position, content];
}
function del(row, position, count) {
  return [row, position, count];
}
function move(sourceRow, sourcePosition, targetRow, targetPosition, length) {
  return [sourceRow, sourcePosition, targetRow, targetPosition, length];
}
function newline(row) {
  return row;
}
function remline(row) {
  if (row === 0) console.log('Creating remline with row = 0!');
  return -row;
}

function isAdd(subdif) {
  const s = unwrapSubdif(subdif);
  return (s.constructor === Array && s.length === 3 && typeof s[2] === 'string');
}
function isDel(subdif) {
  const s = unwrapSubdif(subdif);
  return (s.constructor === Array && s.length === 3 && typeof s[2] === 'number');
}
function isNewline(subdif) {
  const s = unwrapSubdif(subdif);
  return (typeof s === 'number' && s >= 0);
}
function isRemline(subdif) {
  const s = unwrapSubdif(subdif);
  return (typeof s === 'number' && s < 0); // line 0 cannot be deleted
}
function isMove(subdif) {
  const s = unwrapSubdif(subdif);
  return (s.constructor === Array && s.length === 5);
}

function wrapSubdif(subdif, ID = null) {
  if (!isMove(subdif)) {
    return {
      sub: deepCopy(subdif),
      meta: {
        ID: ID === null ? wrapID++ : ID, // each wrap has its ID
        informationLost: false, // whether the context had to be saved
        relative: false, // whether relative addresing is in place
        context: {
          original: null,
          wTransformer: null,
          addresser: null,
          siblings: [], // the wrap IDs of right siblings if fragmented
        },
      },
    };
  }

  return {
    sub: deepCopy(subdif),
    metaDel: {
      ID: wrapID++,
      informationLost: false, // whether the context had to be saved
      relative: false, // whether relative addresing is in place
      context: {
        original: null,
        wTransformer: null,
        addresser: null,
      },
    },
    metaAdd: {
      ID: wrapID++,
      informationLost: false, // whether the context had to be saved
      relative: false, // whether relative addresing is in place
      context: {
        original: null,
        wTransformer: null,
        addresser: null,
      },
    },
  };
}

function unwrapSubdif(wrap) {
  if (wrap.constructor === Object && wrap.sub !== undefined) {
    return wrap.sub;
  }
  return wrap;
}

function wrapDif(dif) {
  const wDif = [];
  dif.forEach((subdif) => {
    wDif.push(wrapSubdif(subdif));
  });
  return wDif;
}

function unwrapDif(dif) {
  const unwrappedDif = [];
  dif.forEach((wrap) => unwrappedDif.push(unwrapSubdif(wrap)));
  return unwrappedDif;
}

module.exports = {
  add, del, move, newline, remline,
  isAdd, isDel, isMove, isNewline, isRemline,
  wrapSubdif, unwrapSubdif, wrapDif, unwrapDif,
};
