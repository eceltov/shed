using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;

namespace TextOperations.Operations
{
    public static class OperationExtensions
    {
        static List<T> JoinLists<T>(List<List<T>> lists)
        {
            List<T> result = new();
            foreach (var list in lists)
                result.AddRange(list);
            return result;
        }

        static List<T> Slice<T>(this List<T> source)
        {
            return source.GetRange(0, source.Count);
        }

        static List<T> Slice<T>(this List<T> source, int start)
        {
            return source.GetRange(start, source.Count - start);
        }

        static List<T> Slice<T>(this List<T> source, int start, int end)
        {
            return source.GetRange(start, end - start);
        }

        public static WrappedOperation Wrap(this Operation operation)
        {
            return new(operation.Metadata, operation.Dif.Wrap());
        }

        public static List<SubdifWrap> CopyAndReverse(this List<SubdifWrap> wDif)
        {
            var wReversed = wDif.DeepCopy();
            wReversed.Reverse();
            return wReversed;
        }

        public static List<List<SubdifWrap>> CopyAndReverse(this List<List<SubdifWrap>> wDifs)
        {
            List<List<SubdifWrap>> wReversed = new();
            for (int i = wDifs.Count - 1; i >= 0; i--)
                wReversed.Add(wDifs[i].CopyAndReverse());
            return wReversed;
        }

        public static List<List<SubdifWrap>> CopyAndReverse(this List<WrappedOperation> wHB)
        {
            List<List<SubdifWrap>> wReversed = new();
            for (int i = wHB.Count - 1; i >= 0; i--)
                wReversed.Add(wHB[i].wDif.CopyAndReverse());
            return wReversed;
        }

        public static WrappedOperation GOTCA(this WrappedOperation wdMessage, List<WrappedOperation> wdHB, List<OperationMetadata> SO)
        {
            // the last index in SO to look for dependent operations
            int DDIndex = SO.FindIndex((meta) => wdMessage.Metadata.DirectlyDependent(meta));

            // the index of the last dependent operation unpreceded by an independent message
            int dependentSectionEndIdx = -1;
            bool dependentSection = true;

            List<int> postDependentSectionDependentIndices = new();

            for (int i = 0; i < wdHB.Count; i++)
            {
                bool dependent = false;
                // handle local dependency
                if (wdHB[i].LocallyDependent(wdMessage))
                    dependent = true;
                // finding out directly dependent operations
                else
                {
                    // because additional operations could be totally ordered before the DD,
                    // flagging the whole HB block up to the DD as dependent would be wrong
                    // (due to possible, unreceived at the time of generation, operation chains
                    // that were inserted before the DD)
                    for (int j = 0; j <= DDIndex; j++)
                    {
                        // deep comparison between the HB operation metadata and SO operation metadata
                        if (wdHB[i].Metadata.Equals(SO[j]))
                        {
                            dependent = true;
                            break;
                        }
                    }
                }

                if (dependent)
                {
                    if (dependentSection)
                        dependentSectionEndIdx = i;
                    else
                        postDependentSectionDependentIndices.Add(i);
                }
                else
                {
                    // handle message chains
                    if (dependentSection && wdMessage.PartOfSameChain(wdHB[i]))
                        dependentSectionEndIdx = i;
                    // message chains can be present after the dependent section as well
                    else if (!dependentSection && wdMessage.PartOfSameChain(wdHB[i]))
                        postDependentSectionDependentIndices.Add(i);
                    else
                        dependentSection = false;
                }
            }

            // there are no independent messages, therefore no transformation is needed
            if (dependentSection)
                return wdMessage;

            // the operations in the dependent section are not needed by the algorithm
            var wdReducedHB = wdHB.Slice(dependentSectionEndIdx + 1);
            // reduce the indices by the number of elements omitted
            for (int i = 0; i < postDependentSectionDependentIndices.Count; i++)
                postDependentSectionDependentIndices[i] -= dependentSectionEndIdx + 1;

            List<List<SubdifWrap>> wdReversedHBDifs = CopyAndReverse(wdReducedHB);

            List<List<SubdifWrap>> wiExcludedDependentOps = new();

            // the difs in the reduced HB will be aggregated one by one from the oldest to the newest and used in
            // a LET on remaining dependent operations
            foreach (int i in postDependentSectionDependentIndices)
            {
                var wdLETDif = JoinLists(wdReversedHBDifs.Slice(
                    wdReversedHBDifs.Count - i));

                var wiExcludedDependentOp = wdReducedHB[i].DeepCopy().wDif.MakeIndependent().LET(wdLETDif);
                wiExcludedDependentOps.Add(wiExcludedDependentOp);
            }

            // make the dependent ops be in the same form as they were when the message was created
            // they are all joined into a single dif for easier application
            List<SubdifWrap> wdJoinedIncludedDependentOps = new();
            foreach (var wiExcludedDependentOp in wiExcludedDependentOps)
                wdJoinedIncludedDependentOps.AddRange(wiExcludedDependentOp.LIT(wdJoinedIncludedDependentOps));

            // reverse the dependent operations so they can be excluded
            wdJoinedIncludedDependentOps.Reverse();
            // exclude the dependent ops from the message so that it has the same context as wdReducedHB[0].wDif
            var wiExcludedMessage = wdMessage.wDif.MakeIndependent().LET(wdJoinedIncludedDependentOps);

            // include all operations in the reduced HB
            List<SubdifWrap> wdMergedHB = new();
            foreach (var operation in wdReducedHB)
                wdMergedHB.AddRange(operation.wDif);

            wdMessage.wDif = wiExcludedMessage.LIT(wdMergedHB);
            return wdMessage;
        }

        /// <summary>
        /// The undo/do/redo algorithm. Applies a message to a document.
        /// </summary>
        /// <param name="dMessage">An operation to be applied.</param>
        /// <param name="document">The document which is about to be changed.</param>
        /// <param name="wdInitialHB">The wrapped HB corresponding to the current document.</param>
        /// <param name="initialSO">The serverOrdering corresponding to the current document.</param>
        /// <returns>Returns an object: { document, HB }, containing the new document and updated HB.</returns>
        public static (List<string> document, List<WrappedOperation> HB) UDR(
            this Operation dMessage, List<string> document, List<WrappedOperation> wdInitialHB,
            List<OperationMetadata> initialSO)
        {
            var wdHB = wdInitialHB.DeepCopy();
            List<OperationMetadata> SO = new(initialSO)
            {
                dMessage.Metadata,
            };

            // find the total ordering of the message relative to the local HB and SO
            int undoIndex = wdHB.FindTotalOrderingHBIndex(dMessage, SO);

            WrappedOperation wdMessage = dMessage.Wrap();
            WrappedOperation wdTransformedMessage;

            // case when no operations need to be undone, only the message is transformed and directly applied
            if (undoIndex == wdHB.Count)
            {
                wdTransformedMessage = wdMessage.GOTCA(wdHB, SO);

                document.ApplyDif(wdTransformedMessage.wDif);

                wdHB.Add(wdTransformedMessage);
                return (document, wdHB);
            }

            // undoing independent operations
            var wdUndoneHB = wdHB.Slice(undoIndex);
            wdHB = wdHB.Slice(0, undoIndex);
            for (int i = wdUndoneHB.Count - 1; i >= 0; i--)
            {
                document.UndoDif(wdUndoneHB[i].wDif);
            }

            // transforming and applying message

            // giving GOTCA only the relevant part of HB (from start to the last dependent operation)
            wdTransformedMessage = wdMessage.GOTCA(wdHB, SO);
            document.ApplyDif(wdTransformedMessage.wDif);

            // creating a list of undone difs for transformation
            List<List<SubdifWrap>> wdUndoneDifs = new();
            for (int i = 0; i < wdUndoneHB.Count; i++)
            {
                wdUndoneDifs.Add(wdUndoneHB[i].wDif.DeepCopy());
            }

            // creating a list of undone difs but reversed
            List<List<SubdifWrap>> wdReversedUndoneDifs = new();
            for (int i = wdUndoneHB.Count - 1; i >= 0; i--)
            {
                List<SubdifWrap> wdUndoneDif = wdUndoneHB[i].wDif.DeepCopy();
                wdUndoneDif.Reverse();
                wdReversedUndoneDifs.Add(wdUndoneDif);
            }

            // transforming undone difs
            List<List<SubdifWrap>> wdTransformedUndoneDifs = new(); // undone difs that are transformed
            List<SubdifWrap> wiFirstUndoneDif = wdUndoneDifs[0].MakeIndependent();

            // the first one is only transformed agains the message
            var wdFirstTransformedUndoneDif = wiFirstUndoneDif.LIT(wdTransformedMessage.wDif);
            wdTransformedUndoneDifs.Add(wdFirstTransformedUndoneDif);
            List<SubdifWrap> wdLETDif = new(); // chronologically reversed
            List<SubdifWrap> wdLITDif = new(wdTransformedMessage.wDif);
            for (int i = 1; i < wdUndoneDifs.Count; i++)
            {
                // excluding the older undone difs so that the message
                // and all transformed older undone difs can be included
                wdLETDif.InsertRange(0, wdReversedUndoneDifs[^i]);
                var wiUndoneDif = wdUndoneDifs[i].MakeIndependent();
                var wiExcludedDif = wiUndoneDif.LET(wdLETDif);

                // including the message and transformed older undone difs
                wdLITDif.AddRange(wdTransformedUndoneDifs[i - 1]);
                var wdTransformedUndoneDif = wiExcludedDif.LIT(wdLITDif);
                wdTransformedUndoneDifs.Add(wdTransformedUndoneDif);
            }

            // redoing transformed undone difs
            wdTransformedUndoneDifs.ForEach((wdDif) => {
                document.ApplyDif(wdDif);
            });

            // creating operations from undone difs (for HB)
            List<WrappedOperation> wdTransformedUndoneOperations = new();
            for (int i = 0; i < wdTransformedUndoneDifs.Count; i++)
            {
                var wDif = wdTransformedUndoneDifs[i];
                WrappedOperation wdTransformedOperation = new(wdUndoneHB[i].Metadata, wDif);
                wdTransformedUndoneOperations.Add(wdTransformedOperation);
            };

            // pushing the message and transformed undone difs to HB
            wdHB.Add(wdTransformedMessage);
            wdTransformedUndoneOperations.ForEach((wdOperation) => wdHB.Add(wdOperation));

            return (document, wdHB);
        }
    }
}
