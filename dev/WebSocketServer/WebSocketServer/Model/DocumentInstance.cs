using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using WebSocketServer.Data;
using WebSocketServer.MessageProcessing;
using WebSocketServer.Parsers.DatabaseParsers;

namespace WebSocketServer.Model
{
    internal class DocumentInstance
    {
        // Maps client IDs to Client instances.
        Dictionary<int, Client> clients = new();
        List<string> content = new();
        Document document;
        List<object> serverHB = new(); ///TODO: change type
        List<int[]> serverOrdering = new();
        int firstSOMessageNumber = 0; ///TODO: change value


        DocumentInstance(Document document, List<string> content)
        {
            this.document = document;
            this.content = content;
        }

        public static DocumentInstance? CreateDocumentInstance(Document document, string workspaceID, string absolutePath)
        {
            if (GetInitialDocument(workspaceID, absolutePath) is not List<string> initialContent)
            {
                return null;
            }

            return new DocumentInstance(document, initialContent);
        }

        static List<string>? GetInitialDocument(string workspaceID, string absolutePath)
        {
            try
            {
                string contentString = DatabaseProvider.Database.GetDocumentData(workspaceID, absolutePath);
                return Regex.Split(contentString, "\r\n|\r|\n").ToList();
            }
            catch
            {
                return null;
            }
        }

        public bool ClientPresent(int clientID)
        {
            return clients.ContainsKey(clientID);
        }

        public void AddClient(Client client)
        {
            if (clients.ContainsKey(client.ID))
            {
                Console.WriteLine($"Error: Adding already present client to ${nameof(DocumentInstance)}");
                return;
            }

            clients.Add(client.ID, client);

            var initMsg = new InitDocumentMessage(content, document.ID, serverHB, serverOrdering, firstSOMessageNumber);
            client.ClientInterface.Send(initMsg);
        }

        public void Delete()
        {
            ///TODO
            throw new NotImplementedException();
        }
    }
}
