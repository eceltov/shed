const DatabaseGateway = require('../controller/DatabaseGateway');

if (process.argv.length !== 4) {
  console.log(`The program expects 2 arguments, but got ${process.argv.length - 2} instead.`);
  console.log('Expected arguments: username newPassword');
  process.exit(1);
}

const database = new DatabaseGateway();
database.initialize();

const successful = database.changeUserPassword(process.argv[2], process.argv[3]);

if (!successful) {
  console.log('Error: Username not found.');
  process.exit(1);
}

console.log('Password changed successfully.');
