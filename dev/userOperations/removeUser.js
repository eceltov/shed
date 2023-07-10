const DatabaseGateway = require('../controller/DatabaseGateway');

if (process.argv.length !== 3) {
  console.log(`The program expects 1 argument, but got ${process.argv.length - 2} instead.`);
  console.log('Expected arguments: username');
  process.exit(1);
}

const database = new DatabaseGateway();
database.initialize();

const successful = database.removeUser(process.argv[2]);

if (!successful) {
  console.log('Error: Username not found.');
  process.exit(1);
}

console.log('User removed successfully.');
