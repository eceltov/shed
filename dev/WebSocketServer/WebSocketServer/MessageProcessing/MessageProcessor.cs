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
    class MessageProcessor
    {
        public string? AcceptConnection(ClientConnectMessage clientConnectMessage)
        {
            string token = GenerateTestToken();
            IdentityModelEventSource.ShowPII = true;
            if (clientConnectMessage.token == null)
                return null;

            var tokenHandler = new JwtSecurityTokenHandler();
            //var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(ConfigurationManager.Configuration.JWT.Secret));
            var key = Encoding.ASCII.GetBytes(ConfigurationManager.Configuration.JWT.Secret);
            try
            {
                tokenHandler.ValidateToken(token, new TokenValidationParameters
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

        public static string GenerateTestToken()
        {
            // generate token that is valid for 7 days
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(ConfigurationManager.Configuration.JWT.Secret);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[] {
                    new Claim("id", "00000000"),
                    new Claim("firstName", "Adam"),
                    new Claim("lastName", "Tester"),
                    new Claim("mail", "adam.tester@example.com"),
                    new Claim("role", "test")
                }),
                //Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
