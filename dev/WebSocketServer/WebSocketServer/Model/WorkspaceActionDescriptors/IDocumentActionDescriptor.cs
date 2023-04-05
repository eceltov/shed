using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Model.WorkspaceActionDescriptors
{
    internal interface IDocumentActionDescriptor
    {
        public int DocumentID { get; init; }

        /// <summary>
        /// Executes an action in the given document instance.
        /// </summary>
        /// <param name="documentInstance">The document instance in which the action should be executed.</param>
        /// <returns>Returns whether the action produced the intended result.</returns>
        public bool Execute(DocumentInstance documentInstance);
    }
}
