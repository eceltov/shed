using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Model.WorkspaceActionDescriptors
{
    internal interface IWorkspaceActionDescriptor
    {
        /// <summary>
        /// Executes an action in the given workspace.
        /// </summary>
        /// <param name="workspace">The workspace in which the action should be executed.</param>
        /// <returns>Returns whether the action produced the intended result.</returns>
        public bool Execute(Workspace workspace);
    }
}
