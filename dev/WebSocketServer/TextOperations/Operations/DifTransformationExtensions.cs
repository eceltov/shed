using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;

namespace TextOperations.Operations
{
    internal static class DifTransformationExtensions
    {
        public static List<SubdifWrap> LIT(this List<SubdifWrap> wiDif, List<SubdifWrap> wdTransformationDif)
        {
            if (wiDif.Count == 0) return wiDif;
            if (wdTransformationDif.Count == 0) return wiDif.MakeDependent();
            List<SubdifWrap> wdTransformedDif = new();
            // array of wraps, updated after each applied transformer, because transformed wraps
            // may fall apart
            List<SubdifWrap> wraps = new(wiDif);
            // LIT makes dependent wraps, therefore finished wraps made in the previous steps are
            // added to the transformer. A shallow copy of the original transformer is made.
            List<SubdifWrap> wNewTransformationDif = new(wdTransformationDif);
            // the number of completed transformations (how many elements of the transformer have been
            // applied)
            int transformations = 0;
            while (wraps.Count > 0)
            {
                for (int i = transformations; i < wNewTransformationDif.Count; i++, transformations++)
                {
                    // proxy wrap array so that one transformation step always works with the same data
                    List<SubdifWrap> newWraps = new();
                    // apply a transformer to each wrap
                    foreach (SubdifWrap wrap in wraps)
                    {
                        if (wrap.CheckRA() && !wrap.CheckBO(wNewTransformationDif[i]))
                        {
                            newWraps.Add(wrap);
                        }
                        else if (wrap.CheckRA() && wrap.CheckBO(wNewTransformationDif[i]))
                        {
                            wrap.ConvertAA(wNewTransformationDif[i]);
                            newWraps.Add(wrap);
                        }
                        else
                        {
                            newWraps.AddRange(wrap.IT(wNewTransformationDif[i]));
                        }
                    }
                    // update wraps
                    wraps = newWraps;
                }
                // the end of the for cycle signals that the first wrap of @wraps was fully transformed,
                // however, more wraps might have spawned. The new wraps need to be transformed against the
                // first one, so it is pushed to the respective arrays and is removed from @wraps.
                // In order to not transform the wraps agains a transformer multiple times, the for cycle
                // will start at the first transformer not yet applied (the first wrap).
                wNewTransformationDif.Add(wraps[0]);
                wdTransformedDif.Add(wraps[0]);
                wraps.RemoveAt(0);
            }
            return wdTransformedDif;
        }

        /// <summary>
        /// Excludes a dif from another dif.
        /// </summary>
        /// <param name="wiDif">The dif to be transformed.</param>
        /// <param name="wdReversedTransformationDif">
        /// The dif to be excluded.
        /// This dif should be chronologically reversed, so that the application of the first
        /// subdif of this dif resulted in the final document state from which the dif to be
        /// transformed was generated.
        /// </param>
        /// <returns>Returns the transformed dif.</returns>
        public static List<SubdifWrap> LET(this List<SubdifWrap> wiDif, List<SubdifWrap> wdReversedTransformationDif)
        {
            if (wiDif.Count == 0) return wiDif;
            if (wdReversedTransformationDif.Count == 0) return wiDif;
            List<SubdifWrap> wiTransformedDif = new();
            foreach (SubdifWrap originalWrap in wiDif)
            {
                // the originalWrap may fall apart, therefore an array is used
                List<SubdifWrap> wraps = new() { originalWrap };
                // apply each transformer one by one
                foreach (SubdifWrap wTransformer in wdReversedTransformationDif)
                {
                    // proxy array of wraps, so that newly fragmented wraps are not pushed immediately to @wraps
                    List<SubdifWrap> newWraps = new();
                    // transform each wrap that originated from the @originalWrap
                    foreach (SubdifWrap wrap in wraps)
                    {
                        if (wrap.CheckRA())
                        {
                            newWraps.Add(wrap);
                        }
                        else
                        {
                            newWraps.AddRange(wrap.ET(wTransformer));
                        }
                    }
                    // update wraps
                    wraps = newWraps;
                }
                // push the transformed @originalWrap
                wiTransformedDif.AddRange(wraps);
            }
            return wiTransformedDif;
        }

        /// <summary>
        /// Takes a wDif of chronologically dependent subdifs and returns a new wDif of independent subdifs.
        /// </summary>
        /// <param name="wDif">The wDif to be made independent.</param>
        /// <returns>Returns the independent wDif.</returns>
        public static List<SubdifWrap> MakeIndependent(this List<SubdifWrap> wDif)
        {
            var wDifCopy = wDif.DeepCopy();
            List<SubdifWrap> wIndependentDif = new();

            for (int i = wDif.Count - 1; i >= 1; i--)
            {
                wIndependentDif.Insert(0, wDifCopy[i]);
                wIndependentDif = wIndependentDif.LET(new() { wDif[i - 1] });
            }
            wIndependentDif.Insert(0, wDifCopy[0]);

            return wIndependentDif;
        }

        /// <summary>
        /// Takes a wDif of independent subdifs and returns a new wDif of chronologically dependent subdifs.
        /// </summary>
        /// <param name="wDif">The wDif to be made dependent.</param>
        /// <returns>Returns the dependent wDif.</returns>
        public static List<SubdifWrap> MakeDependent(this List<SubdifWrap> wDif)
        {
            var wDifCopy = wDif.DeepCopy();
            var wDependentSubdifs = wDifCopy.GetRange(1, wDifCopy.Count - 1).LIT(new() { wDifCopy[0] });
            List<SubdifWrap> wdDif = new() { wDifCopy[0] };
            wdDif.AddRange(wDependentSubdifs);
            return wdDif;
        }

    }
}
