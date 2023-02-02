const fs = require('fs');
const sourceFilePath = '../../indepDepIdentity.test.js';
const firstTestLineIdx = 4;

console.log(processIndepDep(sourceFilePath, firstTestLineIdx));

function processIndepDep(path, firstTestLineIdx) {
  const lines = getFileLines(path);
  let output = '';
  let startIdx = firstTestLineIdx;
  let endIdx = findTestEndIdx(lines, startIdx + 1);
  while (endIdx !== -1) {
    output += getMethodIndepDep(lines.slice(startIdx, endIdx));
    startIdx = endIdx + 1;
    endIdx = findTestEndIdx(lines, startIdx + 1);
  }
  return output;
}

// converts files in format similar to LIT.test.js
// meta lines with more than one row are not supported, as well as sibling arrays
function processLIT(path, firstTestLineIdx) {
  const lines = getFileLines(path);
  let output = '';
  let startIdx = firstTestLineIdx;
  let endIdx = findTestEndIdx(lines, startIdx + 1);
  while (endIdx !== -1) {
    output += getMethodLIT(lines.slice(startIdx, endIdx));
    startIdx = endIdx + 1;
    endIdx = findTestEndIdx(lines, startIdx + 1);
  }
  return output;
}

function findTestEndIdx(lines, startIdx) {
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i] === '  ],'){
      return i;
    }
  }
  return -1;
}

function getFileLines(path) {
  const data = fs.readFileSync(path, 'utf8');
  return data.split(/\r?\n/);
}

// first line is '  [', last line is '  ],'
function getMethodIndepDep(jsTestLines) {
  const testNameQuoteIdx = jsTestLines[1].indexOf("'");
  const testName = jsTestLines[1].slice(testNameQuoteIdx + 1, -2);

  return (
`${getMethodHeaderIndepDep(testName)}
{
${getTestObjectIndepDep(jsTestLines[2])}
    DifAssertions.TestIndepDep(testDif);
}

`
  );
}

// first line is '  [', last line is '  ],'
function getMethodLIT(jsTestLines) {
  const testNameQuoteIdx = jsTestLines[1].indexOf("'");
  const testName = jsTestLines[1].slice(testNameQuoteIdx + 1, -2);

  return (
`${getMethodHeaderLIT(testName)}
{
${getTestObjectLIT(jsTestLines.slice(2))}

    DifAssertions.TestLIT(test);
}

`
  );
}

function getTestObjectIndepDep(jsLine) {
  return (
`    Dif testDif = ${getDifLine(jsLine, true)};`
  );
}

// gets dif and meta lines (without test name)
function getTestObjectLIT(lines) {
  const hasMeta = lines.length > 3;
  let output = (
`    DifTest test = new(
        ${getDifLine(lines[0])}
        ${getDifLine(lines[1])}
        ${getDifLine(lines[2], !hasMeta)}
`
  );

  if (hasMeta) {
    output += (
`        ${getMetaLine(lines[3])}
`
    );
  }

  output += '    );';
  return output;
}

function getMethodHeaderLIT(jsTestName) {
  const tokens = jsTestName.split(' ');
  tokens[1] = extractSubdifTypeFromBrackets(tokens[1]);
  tokens[3] = extractSubdifTypeFromBrackets(tokens[3]);
  tokens[4] = tokens[4].slice(0, -1);
  for (let i = 0; i < tokens.length; i++) {
    tokens[i] = capitalize(tokens[i])
  }

  const methodName = tokens.join("");

  return (
`[TestMethod]
public void ${methodName}()`
  );
}

function getMethodHeaderIndepDep(jsTestName) {
  const openingSquareIdx = jsTestName.indexOf('[');
  const closingSquareIdx = jsTestName.indexOf(']');
  const subdifs = jsTestName.slice(openingSquareIdx + 1, closingSquareIdx).split(', ');
  const number = jsTestName.slice(closingSquareIdx + 2, -1);
  const methodName = subdifs.map(subdif => capitalize(subdif)).join('') + number;

  return (
`[TestMethod]
public void ${methodName}()`
  );
}

function getDifLine(jsLine, noEndingComma = false) {
  const openingSquareIdx = jsLine.indexOf('[');
  const closingSquareIdx = jsLine.indexOf(']');
  const commentIdx = jsLine.indexOf('//');
  const comment = commentIdx !== -1 ? ' ' + jsLine.slice(commentIdx) : '';
  const subdifs = getSubdifs(jsLine.slice(openingSquareIdx + 1, closingSquareIdx));
  return `new() { ${subdifs} }${(noEndingComma ? '' : ',')}${comment}`;
}

// input: 'del(0, 0, 1), del(0, 1, 2)'
// output: 'new Del(0, 0, 1), new Del(0, 1, 2)'
function getSubdifs(jsLine) {
  // trick to split individual subdifs
  const subdifs = jsLine.split('), ');
  for (let i = 0; i < subdifs.length - 1; i++) {
    subdifs[i] = subdifs[i] + ')';
  }
  return subdifs.map((subdif) => getSubdif(subdif)).join(', ');
}

// input: 'del(0, 1, 2)'
// output: 'new Del(0, 1, 2)'
function getSubdif(jsSubdif) {
  const openingNormalIdx = jsSubdif.indexOf('(');
  const subdif = capitalize(jsSubdif.slice(0, openingNormalIdx));
  const ctor = getCtor(jsSubdif, openingNormalIdx);
  return 'new ' + subdif + ctor;
}

function getCtor(jsLine, openingIdx, closingIdx = undefined) {
  return jsLine.slice(openingIdx, (closingIdx === undefined ? undefined : closingIdx + 1)).replaceAll("'", '"');
}

function getMetaLine(jsLine) {
  const openingNormalIdx = jsLine.indexOf('(');
  const closingNormalIdx = jsLine.indexOf(')');
  const commentIdx = jsLine.indexOf('//');
  const comment = commentIdx !== -1 ? ' ' + jsLine.slice(commentIdx) : '';
  const ctor = jsLine.slice(openingNormalIdx, closingNormalIdx + 1).replaceAll("'", '"');
  return `new() { new${ctor} }${comment}`;
}

function extractSubdifTypeFromBrackets(string) {
  return string.slice(1, -1);
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}