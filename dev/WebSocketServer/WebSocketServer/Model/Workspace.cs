using Newtonsoft.Json;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.MessageProcessing;
using WebSocketServer.Model.WorkspaceActionDescriptors;
using WebSocketServer.Parsers.DatabaseParsers;

namespace WebSocketServer.Model
{
    internal class Workspace
    {
        public FileStructure FileStructure { get; private set; }
        public WorkspaceUsers Users { get; private set; }
        public string Name { get; private set; }
        public string ID { get; private set; }
        public Dictionary<int, Client> Clients { get; private set; }

        BlockingCollection<WorkspaceActionDescriptor> actionDescriptors;
        Thread workerThread;


        public Workspace(string ID, string name, FileStructure fileStructure, WorkspaceUsers users)
        {
            this.ID = ID;
            Name = name;
            FileStructure = fileStructure;
            Users = users;
            Clients = new();
            actionDescriptors = new();

            workerThread = new Thread(() => ProcessActions(CancellationToken.None));
            workerThread.Start();
        }

        public void ScheduleAction(WorkspaceActionDescriptor actionDescriptor)
        {
            actionDescriptors.Add(actionDescriptor);
        }

        void ProcessActions(CancellationToken cancellationToken)
        {
            foreach (var actionDescriptor in actionDescriptors.GetConsumingEnumerable(cancellationToken))
            {
                if (actionDescriptor is ConnectClientDescriptor connectClientDescriptor)
                    InitializeClient(connectClientDescriptor.Client);
            }
        }

        bool ClientCanJoin(Client client)
        {
            if (client == null)
            {
                Console.WriteLine($"Error in ClientCanJoin: client is null.");
                return false;
            }

            if (client.GetWorkspaceRole(ID) == Roles.None)
            {
                Console.WriteLine($"Error in ClientCanJoin: client {client.ID} has insufficient access rights.");
                return false;
            }

            if (Clients.ContainsKey(client.ID))
            {
                Console.WriteLine($"Error in ClientCanJoin: client {client.ID} already present.");
                return false;
            }

            return true;
        }

        public bool InitializeClient(Client client)
        {
            if (!ClientCanJoin(client))
                return false;

            var initMsg = new InitWorkspaceMessage(client.ID, FileStructure, client.GetWorkspaceRole(ID));
            client.ClientInterface.Send(initMsg);

            return true;
        }
    }
}






