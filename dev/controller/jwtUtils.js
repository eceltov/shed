const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const appConfigPath = path.join(__dirname, '../../config.json');
const appConfig = JSON.parse(fs.readFileSync(appConfigPath));

/**
 * @brief Checks if the JWT cookie is valid. The cookie is cleared if invalid.
 * @param {*} req The express req parameter.
 * @param {*} res The express res parameter.
 * @returns Returns the JWT payload. If the token signature is invalid, returns null.
 */
function verifyJWTCookie(req, res) {
  if (req.cookies.jwt !== undefined) {
    try {
      const payload = jwt.verify(req.cookies.jwt, appConfig.jwtSecret);
      /// TODO: make sure the payload has the correct shape
      /// TODO: check expiration
      return payload;
    }
    catch {
      res.clearCookie('jwt');
      return null;
    }
  }

  return null;
}

module.exports = {
  verifyJWTCookie,
};
