# ShEd Performace Testing

This branch is used to evaluate the performance of ShEd.

To run tests, make sure you have Docker installed and Node modules initialized.
To initialize Node modules, run:

```bash
npm install
```

To start the Workspace server, run:

```bash
docker compose up
```

To customize what test is run, see the `dev/testing/performanceTest.js` file.

To run the tests, execute:

```bash
node dev/testing/performanceTest.js 
```

After a short wait, you should be able to see that the clients connected in the debug logs of the Workspace server.

After they connected, they will automatically send messages.

The test results can be found in the `dev/volumes/Data/testOutput.csv` file.
This csv file contain four columns: `time since test started [ms]`, `time spend applying an operation [ms]`, `time spend transmitting an operation [ms]`, `1 if the operation is an addition`.

