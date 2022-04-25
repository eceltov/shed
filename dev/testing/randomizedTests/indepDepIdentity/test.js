const { generateTests } = require('./generatorLib');
const { DEBUGTestIndepDepArray } = require('../../primTestingLib');
const fs = require('fs');
const { fail } = require('assert');

if (process.argv.length <= 2) {
  console.log('Please enter the desired number of tests.');
  process.exit(1);
}

const testCount = parseInt(process.argv[2]);

console.log('Generating', testCount, 'tests...');
const tests = generateTests(testCount);

console.log('Running tests...');
const failedScenarios = DEBUGTestIndepDepArray(tests, false);
console.log(failedScenarios.length, 'failed');

const JSONString = JSON.stringify(failedScenarios);
fs.writeFileSync(__dirname + '/failedScenarios.json', JSONString);

