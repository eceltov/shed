using Microsoft.IdentityModel.Logging;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Configuration;
using WebSocketServer.Parsers.MessageParsers;
using WebSocketServer.Utilities;

namespace WebSocketServer.MessageProcessing
{
    static class ConnectionAuthenticator
    {
        /// <summary>
        /// Validates the request JWT.
        /// </summary>
        /// <param name="clientConnectMessage">The connection message.</param>
        /// <returns>Returns the userID if JWT validation passed, else null.</returns>
        public static string? ValidateJWT(ClientConnectMessage clientConnectMessage)
        {
            if (clientConnectMessage.Token == "")
                return null;

            var tokenHandler = new JwtSecurityTokenHandler();
            //var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(ConfigurationManager.Configuration.JWT.Secret));
            var key = Encoding.ASCII.GetBytes(ConfigurationManager.Configuration.JWT.Secret);
            try
            {
                tokenHandler.ValidateToken(clientConnectMessage.Token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    // set clockskew to zero so tokens expire exactly at token expiration time (instead of 5 minutes later)
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                var jwtToken = (JwtSecurityToken)validatedToken;
                var userId = jwtToken.Claims.First(x => x.Type == "id").Value;

                // return user id from JWT token if validation successful
                return userId;
            }
            catch (Exception e)
            {
                Logger.DebugWriteLine(e.Message);
                // return null if validation fails
                return null;
            }
        }

        /// <summary>
        /// Gets the userID from a JWT without validating it.
        /// </summary>
        /// <param name="clientConnectMessage">The connection message.</param>
        /// <returns>Returns the userID, or null, if not present.</returns>
        public static string? GetIDFromJWT(ClientConnectMessage clientConnectMessage)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jsonToken = tokenHandler.ReadToken(clientConnectMessage.Token);
            if (jsonToken is not JwtSecurityToken JWT)
                return null;

            return JWT.Claims.FirstOrDefault(claim => claim.Type == "id")?.Value;
        }
    }
}
