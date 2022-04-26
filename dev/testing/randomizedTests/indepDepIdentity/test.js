const { generateTests } = require('./generatorLib');
const { DEBUGTestIndepDepArray } = require('../../primTestingLib');
const fs = require('fs');
const { fail } = require('assert');

const configString = fs.readFileSync(__dirname + '/config.json');
const config = JSON.parse(configString);
const maxTestChunk = config.maxTestChunk;

const failedScenarios = [];

function runTests(count) {
  console.log('Generating', count, 'tests...');
  const tests = generateTests(count);
  
  console.log('Running tests...');
  failedScenarios.push(...DEBUGTestIndepDepArray(tests, false));
}

if (process.argv.length <= 2) {
  console.log('Please enter the desired number of tests.');
  process.exit(1);
}

const testCount = parseInt(process.argv[2]);

if (testCount > maxTestChunk) {
  console.log('More than ' + maxTestChunk / 1000 + 'k tests, running in chunks of ' + maxTestChunk / 1000 + 'k.');
}

const chunkCount = Math.floor(testCount/maxTestChunk) + (testCount % maxTestChunk > 0 ? 1 : 0);

let remainingTestCount = testCount;
while (remainingTestCount > 0) {
  const count = (remainingTestCount >= maxTestChunk ? maxTestChunk : remainingTestCount);
  runTests(count);
  remainingTestCount -= count;
  if (remainingTestCount !== 0) {
    const currentChunk = (testCount - remainingTestCount) / maxTestChunk;
    console.log('Chunk ' + currentChunk + '/' + chunkCount + ' completed.');
  }
}

if (testCount > maxTestChunk) {
  console.log('Chunk ' + chunkCount + '/' + chunkCount + ' completed.');
}

console.log(failedScenarios.length, 'failed,', testCount, 'total');

const JSONString = JSON.stringify(failedScenarios);
fs.writeFileSync(__dirname + '/failedScenarios.json', JSONString);
