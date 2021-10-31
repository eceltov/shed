var Server = require('./server_class');

var server = new Server();
server.initialize("../testing/document_states/docLive.txt");
server.enableLogging();
server.listen(8080);

