using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Parsers
{
    static class ClientMessageFactory
    {
        public static ClientMessage? GetParsedMessage(string jsonString)
        {
            var genericMessage = new ClientMessage(jsonString);
            switch (genericMessage.msgType)
            {
                case 0:
                    return new ClientConnectMessage(jsonString);
                default:
                    Console.WriteLine("Received unknown message type: {0}", genericMessage.msgType);
                    return null;
            }
        }
    }
}
