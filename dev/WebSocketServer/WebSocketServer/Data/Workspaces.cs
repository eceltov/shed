using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Model;

namespace WebSocketServer.Data
{
    internal static class Workspaces
    {
        static List<Workspace> workspaces;

        static Workspaces()
        {
            workspaces = new List<Workspace>();
        }
    }
}
