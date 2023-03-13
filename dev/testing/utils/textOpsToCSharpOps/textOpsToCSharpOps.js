const fs = require('fs');
const { isAdd, isDel, isNewline, isRemline } = require('../../../lib/subdifOps');
const sourceFilePath = 'in.txt';

console.log(process(sourceFilePath));

function getFileLines(path) {
  const data = fs.readFileSync(path, 'utf8');
  return data.split(/\r?\n/);
}

function process(path) {
  output = "";
  getFileLines(path).forEach((line, idx) => {
    op = JSON.parse(line);
    output += getFirstLine(idx, op[0]);
    op[1].forEach(subdif => {
      if (isAdd(subdif)) {
        output += getAdd(subdif);
      }
      else if (isDel(subdif)) {
        output += getDel(subdif);
      }
      else if (isNewline(subdif)) {
        output += getNewline(subdif);
      }
      else if (isRemline(subdif)) {
        output += getRemline(subdif);
      }
    });
    output += getLastLines();
  });
  return output;
}

function getFirstLine(lineIdx, metadata) {
  return `var op${lineIdx + 1} = new Operation(new(${metadata.join(", ")}), new() {\n`;
}

function getAdd(add) {
  return `    new Add(${add[0]}, ${add[1]}, "${add[2]}"),\n`
}

function getDel(del) {
  return `    new Del(${del[0]}, ${del[1]}, ${del[2]}),\n`
}

function getNewline(newline) {
  return `    new Newline(${newline[0]}, ${newline[1]}),\n`
}

function getRemline(remline) {
  return `    new Remline(${remline[0]}, ${remline[1]}),\n`
}

function getLastLines() {
  return "});\n\n";
}