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
function newline(row, position) {
  return [row, position, true];
}
function remline(row, position) {
  return [row, position, false];
}

function isAdd(subdif) {
  const s = unwrapSubdif(subdif);
  return (typeof s[2] === 'string');
}
function isDel(subdif) {
  const s = unwrapSubdif(subdif);
  return (typeof s[2] === 'number');
}
function isNewline(subdif) {
  const s = unwrapSubdif(subdif);
  return (s[2] === true);
}
function isRemline(subdif) {
  const s = unwrapSubdif(subdif);
  return (s[2] === false);
}

function wrapSubdif(subdif, ID = null) {
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
  add, del, newline, remline,
  isAdd, isDel, isNewline, isRemline,
  wrapSubdif, unwrapSubdif, wrapDif, unwrapDif,
};
