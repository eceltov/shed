using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;

namespace TextOperations.Operations
{
    internal static class HistoryBufferExtensions
    {
        /// <summary>
        /// Finds the index in HB at which a non present operation should be placed.
        /// </summary>
        /// <param name="HB">The history buffer.</param>
        /// <param name="dMessage">The operation whose TO index is being determined.</param>
        /// <param name="SO">The server ordering.</param>
        /// <returns>Returns the index.</returns>
        public static int FindTotalOrderingHBIndex(this List<WrappedOperation> HB, Operation dMessage, List<OperationMetadata> SO)
        {
            int totalOrderingIndex = 0;
            // handling the case when the message is part of a 'message chain'
            // if it is, it will be placed directly after the previous message in the chain (in HB)
            for (int i = 0; i < HB.Count; i++)
            {
                WrappedOperation operation = HB[i];
                // message is part of a chain
                if (
                  dMessage.Metadata.ClientID == operation.Metadata.ClientID
                  && dMessage.Metadata.PrevClientID == operation.Metadata.PrevClientID
                  && dMessage.Metadata.PrevCommitSerialNumber == operation.Metadata.PrevCommitSerialNumber
                )
                {
                    totalOrderingIndex = i + 1;
                }
            }

            // handling the case when the message is not part of a 'message chain'
            // in this case, the message is placed according to total ordering
            // the strategy is to take operations from HB from the back and determine their total ordering
            // if the operation in HB is part of a message chain, and it's first member is present in SO,
            //   then the received message will be placed after the last message chain member (the message
            //   chain effectively shares it's first member's SO)
            if (totalOrderingIndex == 0)
            {
                for (int i = HB.Count - 1; i >= 0; i--)
                {
                    WrappedOperation operation = HB[i];
                    int operationSOIndex = SO.SOIndex(operation);
                    bool partOfChain = false;

                    // the operation is not in SO, but it could be part of a chain
                    if (operationSOIndex == -1)
                    {
                        // look from the beginning of HB to find the first member of the message chain, if any
                        // if the first member is present in SO, than the message has to be
                        //    placed after the last message chain member
                        for (int j = 0; j < i; j++)
                        {
                            WrappedOperation chainMember = HB[j];
                            if (
                              chainMember.Metadata.ClientID == operation.Metadata.ClientID
                              && chainMember.Metadata.PrevClientID == operation.Metadata.PrevClientID
                              && chainMember.Metadata.PrevCommitSerialNumber == operation.Metadata.PrevCommitSerialNumber
                            )
                            {
                                // the operation is a part of a chain, but it could be a chain that has
                                //    not yet arrived (not a single member)
                                // in this case, the message chain will be placed after the message according
                                //    to total ordering
                                if (SO.SOIndex(chainMember) == -1)
                                {
                                    break;
                                }
                                // the operation is a part of a chain that partially arrived
                                partOfChain = true;
                                break;
                            }
                        }
                    }

                    // the operation is not present in SO and is not part of a chain,
                    //    therefore it will be ordered after the message
                    if (!partOfChain && operationSOIndex == -1)
                    {
                        continue;
                    }

                    // the operation is present in SO or is part of a chain that at least partially arrived,
                    //    therefore it has to be placed before the message because the HB is iterated over
                    //    from the back and this is the first occurence of such an operation,
                    //    the message must be placed directly after it
                    totalOrderingIndex = i + 1;
                    break;
                }
            }

            return totalOrderingIndex;
        }

        /// <summary>
        /// Finds the last HB index of an operation that is either locally or directly dependent on the input.
        /// </summary>
        /// <param name="HB">The history buffer.</param>
        /// <param name="operation">The input operation.</param>
        /// <returns>Returns the index.</returns>
        public static int FindLastDependencyIndex(this List<WrappedOperation> HB, WrappedOperation operation)
        {
            int client = operation.Metadata.ClientID;
            // the client the operation is directly dependent on
            int directDependencyClient = operation.Metadata.PrevClientID;
            // the commitSerialNumber the operation is directly dependent on
            int directDependencyCSN = operation.Metadata.PrevCommitSerialNumber;

            int DDIndex = -1;
            int LDIndex = -1;

            // find the last locally dependent operation and the last directly dependent operation
            for (int i = 0; i < HB.Count; i++)
            {
                WrappedOperation op = HB[i];
                if (op.Metadata.ClientID == directDependencyClient && op.Metadata.CommitSerialNumber == directDependencyCSN)
                {
                    DDIndex = i;
                }
                if (
                  op.Metadata.ClientID == client
                  && op.Metadata.PrevClientID == directDependencyClient
                  && op.Metadata.PrevCommitSerialNumber == directDependencyCSN
                )
                {
                    LDIndex = i;
                }
            }
            return Math.Max(DDIndex, LDIndex);
        }

        /// <summary>
        /// Finds the first HB index of an operation that is locally dependent on the input.
        /// </summary>
        /// <param name="HB">The history buffer.</param>
        /// <param name="operation">The input operation.</param>
        /// <returns>Returns the index.</returns>
        public static int FindFirstLocalDependencyIndex(this List<WrappedOperation> HB, WrappedOperation operation)
        {
            int clientID = operation.Metadata.ClientID;
            // the user the operation is directly dependent on
            int directDependencyClient = operation.Metadata.PrevClientID;
            // the commitSerialNumber the operation is directly dependent on
            int directDependencyCSN = operation.Metadata.PrevCommitSerialNumber;

            for (int i = 0; i < HB.Count; i++)
            {
                if (
                  HB[i].Metadata.ClientID == clientID
                  && HB[i].Metadata.PrevClientID == directDependencyClient
                  && HB[i].Metadata.PrevCommitSerialNumber == directDependencyCSN
                )
                {
                    return i;
                }
            }
            return -1;
        }

        public static List<WrappedOperation> DeepCopy(this List<WrappedOperation> HB)
        {
            return HB.Select((wOperation) =>
                new WrappedOperation(wOperation.Metadata, wOperation.wDif.DeepCopy()))
                .ToList();
        }
    }
}
