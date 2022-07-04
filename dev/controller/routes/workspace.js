const fs = require('fs');
const path = require('path');

function register(app) {
  const appConfigPath = path.join(__dirname, '../../../config.json');
  const appConfig = JSON.parse(fs.readFileSync(appConfigPath));

  app.get('/workspace', (req, res) => {
    /* let workspaceHash = req.query.hash;
          console.log(workspaceHash); */
    const WebSocketServerURL = `${appConfig.portSettings.WebSocketDomain}:${appConfig.portSettings.workspaceServerPort}`;
    const script = `var WebSocketServerURL = "${WebSocketServerURL}";`;
    res.render('Workspace.jsx', { script });
  });
}

module.exports.register = register;
