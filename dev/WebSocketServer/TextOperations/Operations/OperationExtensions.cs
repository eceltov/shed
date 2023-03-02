﻿using System;
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

        static WrappedOperation GOTCA(this WrappedOperation wdMessage, List<WrappedOperation> wdHB, List<OperationMetadata> SO)
        {
            // the last index in SO to look for directly dependent operations
            int lastDirectlyDependentIndex = SO.FindIndex((meta) => (
              meta.ClientID == wdMessage.Metadata.PrevClientID && meta.CommitSerialNumber == wdMessage.Metadata.PrevCommitSerialNumber));

            // the index of the last directly dependent operation unpreceded by an independent message
            int dependentSectionEndIdx = -1;
            bool dependentSection = true;

            List<int> postDependentSectionDDIndices = new();

            for (int i = 0; i < wdHB.Count; i++)
            {
                bool directlyDependent = false;
                // filtering out directly dependent operations
                for (int j = 0; j <= lastDirectlyDependentIndex; j++)
                {
                    // deep comparison between the HB operation metadata and SO operation metadata
                    if (wdHB[i].Metadata.Equals(SO[j]))
                    {
                        directlyDependent = true;
                        break;
                    }
                }

                if (directlyDependent)
                {
                    if (dependentSection)
                        dependentSectionEndIdx = i;
                    else
                        postDependentSectionDDIndices.Add(i);
                }
                else
                    dependentSection = false;
            }

            // there are no independent messages, therefore no transformation is needed
            if (dependentSection)
            {
                return wdMessage;
            }

            // the section of DD operations are not needed by the algorithm
            var wdReducedHB = wdHB.Slice(dependentSectionEndIdx + 1);
            // reduce the indices by the number of elements omitted
            for (int i = 0; i < postDependentSectionDDIndices.Count; i++)
                postDependentSectionDDIndices[i] -= dependentSectionEndIdx + 1;

            ///TODO: this should be a function
            List<List<SubdifWrap>> wdReversedHBDifs = new();
            for (int i = wdReducedHB.Count - 1; i >= 0; i--)
            {
                var wdDif = wdReducedHB[i].wDif.DeepCopy();
                wdDif.Reverse();
                wdReversedHBDifs.Add(wdDif);
            }

            List<List<SubdifWrap>> wiExcludedDDs = new();

            // the difs in the reduced HB will be aggregated one by one from the oldest to the newest and used in
            // a LET on remaining DD operations
            foreach (int i in postDependentSectionDDIndices)
            {
                var wdLETDif = JoinLists(wdReversedHBDifs.Slice(
                    wdReversedHBDifs.Count - i));

                var wiExcludedDD = wdReducedHB[i].wDif.MakeIndependent().LET(wdLETDif);
                wiExcludedDDs.Add(wiExcludedDD);
            }

            // make the DDs be in the same form as they were when the message was created
            // they are all joined into a single dif for easier application
            List<SubdifWrap> wdJoinedIncludedDDs = new();
            foreach (var wiExcludedDD in wiExcludedDDs)
                wdJoinedIncludedDDs.AddRange(wiExcludedDD.LIT(wdJoinedIncludedDDs));

            // reverse the DDs so they can be excluded
            wdJoinedIncludedDDs.Reverse();
            // exclude the DDs from the message so that it has the same context as wdReducedHB[0].wDif
            var wiExcludedMessage = wdMessage.wDif.MakeIndependent().LET(wdJoinedIncludedDDs);

            // include all operations in the reduced HB
            List<SubdifWrap> wdMergedHB = new();
            foreach (var operation in wdReducedHB)
                wdMergedHB.AddRange(operation.wDif);

            wdMessage.wDif = wiExcludedMessage.LIT(wdMergedHB);
            return wdMessage;



            /*{

                // there are no locally dependent operations in HB, therefore all independent
                // operations can be included directly
                /// TODO: or if all locally dependent difs are empty
                if (wdLocallyDependentDifs.Count == 0)
                {
                    List<SubdifWrap> wdTransformationDif = new();
                    wdIndependentDifs.ForEach((wdDif) => wdTransformationDif.AddRange(wdDif));
                    var wTransformedMessageDif = wiMessageDif.LIT(wdTransformationDif);
                    wdMessage.wDif = wTransformedMessageDif;
                    return wdMessage;
                }

                // preparing difs for transformation
                int dependentHBIndex = wdHB.FindLastDependencyIndex(wdMessage);
                List<List<SubdifWrap>> wdReversedTransformerDifs = new();
                for (int i = dependentHBIndex; i > lastDirectlyDependentIndex; i--)
                {
                    var wdDif = wdHB[i].wDif.DeepCopy();
                    wdDif.Reverse();
                    wdReversedTransformerDifs.Add(wdDif);
                }

                // if(log) console.log('wdLocallyDependentDifs:', JSON.stringify(wdLocallyDependentDifs));
                // if(log) console.log('wdReversedTransformerDifs:', JSON.stringify(wdReversedTransformerDifs));

                // [..., last_dep_index=20, indep1, indep2, loc_dep0=23, indep3, loc_dep1=25]

                // transformation
                List<List<SubdifWrap>> wdTransformedDifs = new(); // EOL' in wrapped dif form
                List<SubdifWrap> wdLETDif = JoinLists(wdReversedTransformerDifs.Slice(
                    wdReversedTransformerDifs.Count
                    - (locallyDependentIndices[0]
                    - (lastDirectlyDependentIndex + 1))
                ));
                List<SubdifWrap> wdLITDif = new();

                var wiFirstTransformedDif = wdLocallyDependentDifs[0].MakeIndependent().LET(wdLETDif);

                // this now has mutually independent subdifs, they need to be made dependent
                var wdFirstTransformedDif = wiFirstTransformedDif.MakeDependent();
                wdTransformedDifs.Add(wdFirstTransformedDif);
                for (int i = 1; i < wdLocallyDependentDifs.Count; i++)
                {
                    wdLETDif = JoinLists(wdReversedTransformerDifs.Slice(
                        wdReversedTransformerDifs.Count
                        - (locallyDependentIndices[i]
                        - (lastDirectlyDependentIndex + 1))
                    ));

                    // this is also mutually independent
                    var wiIndependentExcludedDif = wdLocallyDependentDifs[i].MakeIndependent().LET(wdLETDif);
                    wdLITDif.AddRange(wdTransformedDifs[i - 1]);
                    var wdTransformedDif = wiIndependentExcludedDif.LIT(wdLITDif);
                    wdTransformedDifs.Add(wdTransformedDif);
                }
                var wdReversedTransformedDifs = wdTransformedDifs.DeepCopy();
                wdReversedTransformedDifs.Reverse();
                wdReversedTransformedDifs.ForEach((wdDif) => wdDif.Reverse());

                var wiExcludedMessageDif = wiMessageDif.LET(JoinLists(wdReversedTransformedDifs));


                // independent difs between the last directly and first locally dependent dif
                ///TODO: unused

                List<SubdifWrap> wdHBLITDif = new();
                for (int i = lastDirectlyDependentHBIndex + 1; i < wdHB.Count; i++)
                {
                    wdHBLITDif.AddRange(wdHB[i].wDif);
                }
                var wdTransformedMessageDif = wiExcludedMessageDif.LIT(wdHBLITDif);
                wdMessage.wDif = wdTransformedMessageDif;
                return wdMessage;
            }*/
        }

        ///TODO: document is being changed and not copied
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
