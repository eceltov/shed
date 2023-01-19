using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;

namespace TextOperations.Operations
{
    internal static class ServerOrderingExtensions
    {
        /// <summary>
        /// Finds the server ordering index of an operation.
        /// </summary>
        /// <param name="SO">The server ordering.</param>
        /// <param name="operation">The input operation.</param>
        /// <returns>Returns the index.</returns>
        public static int SOIndex(this List<OperationMetadata> SO, WrappedOperation operation)
        {
            return SO.FindIndex((item) => 
                item.ClientID == operation.Metadata.ClientID
                && item.CommitSerialNumber == operation.Metadata.CommitSerialNumber
            );
        }
    }
}
