const { compress } = require('../lib/compress');
const { makeDependant, makeIndependant, LIT, LET } = require('../lib/dif');
const { add, del, move, newline, remline, wrapDif, unwrapDif, wrapSubdif, unwrapSubdif } = require('../lib/subdifOps');
//import * as to from '../lib/dif.mjs';

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

function indepDep(dif) {
  const wiDif = makeIndependant(wrapDif(dif));
  const wdDif = makeDependant(wiDif);
  const dif2 = unwrapDif(wdDif);
  return dif2;
}

function depIndep(dif) {
  const wiDif = makeDependant(wrapDif(dif));
  const wdDif = makeIndependant(wiDif);
  const dif2 = unwrapDif(wdDif);
  return dif2;
}

function compositeLITWrapped(dif, transformer) {
  const wiDif = makeIndependant(wrapDif(dif));
  const wTransformer = wrapDif(transformer);
  const wTransformed = LIT(wiDif, wTransformer);
  return wTransformed;
}

function compositeLIT(dif, transformer) {
  const wTransformed = compositeLITWrapped(dif, transformer);
  const transformed = unwrapDif(wTransformed);
  return transformed;
}

function compositeLETWrapped(dif, transformer) {
  const wiDif = makeIndependant(wrapDif(dif));
  const wTransformer = wrapDif(transformer);
  const wTransformed = LET(wiDif, wTransformer);
  return wTransformed;
}

function compositeLET(dif, transformer) {
  const wiTransformed = compositeLETWrapped(dif, transformer);
  const wdTransformed = makeDependant(wiTransformed);
  const transformed = unwrapDif(wdTransformed);
  return transformed;
}

const dif = [del(0, 3, 3)];
const transformer = [del(0, 3, 1)];
const wTransformed = compositeLITWrapped(dif, transformer);
const transformed = unwrapDif(wTransformed);
const expected = [del(0, 3, 2)]; 
console.log(JSON.stringify(transformed));
console.log(wTransformed[0].meta.informationLost);
console.log(JSON.stringify(wTransformed[0].meta.context.original));
console.log(JSON.stringify(wTransformed[0].meta.context.wTransformer.sub));


/*
[
  '[add, add, add] gets compressed correctly 1',
  [add(0, 0, 'a'), add(0, 1, 'b'), add(0, 2, 'c')],
  [add(0, 0, 'abc')],
],
*/

//console.log(compress([add(0, 0, 'a'), add(0, 1, 'b'), add(0, 2, 'c')]));

/*
const subdif1 = to.del(0, 1, 1);
const subdif2 = to.del(0, 1, 2);
const wrap1 = to.prim.wrapSubdif(subdif1);
const wrap2 = to.prim.wrapSubdif(subdif2);
const wDif = [wrap1, wrap2];
to.prim.saveSibling(wrap1, wrap2);
const wJoinedDif = to.prim.joinSiblings(wDif);
console.log(wJoinedDif);
*/
/*
const dif = [to.del(0, 3, 3)];
const wDif = to.prim.wrapDif(dif);
const transformer = [to.add(0, 3, 'a')];
const wTransformer = to.prim.wrapDif(transformer);
const wTransformed = to.prim.LET(wDif, wTransformer);
const wLITTransformed = to.prim.LIT(wTransformed, wTransformer);
dlog('wTransformed', wTransformed, mode = 'wDif');
dlog('wLITTransformed', wLITTransformed, mode = 'wDif');
*/
/*
const dif = [to.del(0, 3, 3)];
  const transformer = [to.del(0, 3, 1)];
  const wTransformed = compositeLITWrapped(dif, transformer);
  const transformed = to.prim.unwrapDif(wTransformed);
  const expected = [to.del(0, 3, 2)]; // losing info

dlog('wTransformed', wTransformed, mode = 'wDif');
console.log(transformed);
console.log(expected);

*/

/*
const dif = [[0, 0, 'a'], [0, 0, 'bc'], [0, 0, 'defg']];
const wiDif = to.prim.makeIndependant(to.prim.wrapDif(dif));
const wdDif = to.prim.makeDependant(wiDif);
const dif2 = to.prim.unwrapDif(wdDif);
console.log(JSON.stringify(dif));
console.log(JSON.stringify(wiDif));
console.log(JSON.stringify(wdDif));
console.log(JSON.stringify(dif2));
*/

/*
const dif = [1, [1, 1, 1]];
const wiDif = to.prim.makeIndependant(to.prim.wrapDif(dif));
const wdDif = to.prim.makeDependant(wiDif);
const dif2 = indepDep(dif);
console.log(JSON.stringify(dif));
console.log(JSON.stringify(wiDif));
console.log(JSON.stringify(wdDif));
console.log(JSON.stringify(dif2));
*/

/*
const dif = [1, [1, 1, 1]];
  const wiDif = to.prim.makeIndependant(to.prim.wrapDif(dif));
  const wTransformer = to.prim.wrapDif([5]);
  const wTransformed = to.prim.LIT(wiDif, wTransformer);
  const transformed = to.prim.unwrapDif(wTransformed);
  console.log(JSON.stringify(dif));
  console.log(JSON.stringify(transformed));
  */