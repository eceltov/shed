/* eslint-disable no-use-before-define */
import { deepCopy } from './utils.mjs';

let wrapID = 0; // id for wrapped difs (used in relative addressing)

// functions for subdif creation
export function add(row, position, content) {
  return [row, position, content];
}
export function del(row, position, count) {
  return [row, position, count];
}
export function move(sourceRow, sourcePosition, targetRow, targetPosition, length) {
  return [sourceRow, sourcePosition, targetRow, targetPosition, length];
}
export function newline(row) {
  return row;
}
export function remline(row) {
  if (row === 0) console.log('Creating remline with row = 0!');
  return -row;
}

export function isAdd(subdif) {
  const s = unwrapSubdif(subdif);
  return (s.constructor === Array && s.length === 3 && typeof s[2] === 'string');
}
export function isDel(subdif) {
  const s = unwrapSubdif(subdif);
  return (s.constructor === Array && s.length === 3 && typeof s[2] === 'number');
}
export function isNewline(subdif) {
  const s = unwrapSubdif(subdif);
  return (typeof s === 'number' && s >= 0);
}
export function isRemline(subdif) {
  const s = unwrapSubdif(subdif);
  return (typeof s === 'number' && s < 0); // line 0 cannot be deleted
}
export function isMove(subdif) {
  const s = unwrapSubdif(subdif);
  return (s.constructor === Array && s.length === 5);
}

export function wrapSubdif(subdif, ID = null) {
  if (!isMove(subdif)) {
    return {
      sub: deepCopy(subdif),
      meta: {
        ID: ID === null ? wrapID++ : ID, // each wrap has its ID
        informationLost: false, // whether the context had to be saved
        relative: false, // whether relative addresing is in place
        context: {
          original: null,
          transformers: null,
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
        transformers: null,
        addresser: null,
      },
    },
    metaAdd: {
      ID: wrapID++,
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

export function unwrapSubdif(wrap) {
  if (wrap.constructor === Object && wrap.sub !== undefined) {
    return wrap.sub;
  }
  return wrap;
}

export function wrapDif(dif) {
  const wDif = [];
  dif.forEach((subdif) => {
    wDif.push(wrapSubdif(subdif));
  });
  return wDif;
}

export function unwrapDif(dif) {
  const unwrappedDif = [];
  dif.forEach((wrap) => unwrappedDif.push(unwrapSubdif(wrap)));
  return unwrappedDif;
}
