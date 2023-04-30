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

namespace WebSocketServer.MessageProcessing
{
    static class ConnectionAuthenticator
    {
        /// <summary>
        /// Validates the request JWT and accepts the connection if valid.
        /// </summary>
        /// <param name="clientConnectMessage">The connection message.</param>
        /// <returns>Returns the userID if JWT validation passed, else null.</returns>
        public static string? AcceptConnection(ClientConnectMessage clientConnectMessage)
        {
            IdentityModelEventSource.ShowPII = true;
            if (clientConnectMessage.Token == null)
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
                Console.WriteLine(e.Message);
                // return null if validation fails
                return null;
            }
        }
    }
}
