const { DEBUGTestIndepDepArray } = require('../../primTestingLib');
const { generateTests } = require('./generatorLib');
const fs = require('fs');

const path = __dirname + '/failedScenarios.json';

try {
  fs.accessSync(path, fs.F_OK);
}
catch {
  console.log('There is no file with failed scenarios. Run test.js first.');
  process.exit(1);
}

const failedScenariosString = fs.readFileSync(path);
const failedScenarios = JSON.parse(failedScenariosString);

const tests = [];
failedScenarios.forEach((scenario) => {
  tests.push(['', scenario]);
});

console.log('Running', tests.length, 'tests...');
const newFailedScenarios = DEBUGTestIndepDepArray(tests, false);
console.log(newFailedScenarios.length, 'failed');

if (newFailedScenarios.length > 0) {
  console.log('Shortest failed scenario:');
  let shortest = newFailedScenarios[0];
  for (let i = 1; i < newFailedScenarios.length; i++) {
    if (newFailedScenarios[i].length < shortest.length) {
      shortest = newFailedScenarios[i];
    }
  }
  console.log(shortest);
}
