const DatabaseGateway = require('../controller/DatabaseGateway');

if (process.argv.length !== 4) {
  console.log(`The program expects 2 arguments, but got ${process.argv.length - 2} instead.`);
  console.log('Expected arguments: username password');
  process.exit(1);
}

const database = new DatabaseGateway();
database.initialize();

const result = database.addUser(process.argv[2], process.argv[3]);

if (result.userPresent) {
  console.log('Error: Username already present.');
  process.exit(1);
}

if (!result.successful) {
  console.log('Error: Database failure.');
  process.exit(1);
}

console.log('User added successfully.');
