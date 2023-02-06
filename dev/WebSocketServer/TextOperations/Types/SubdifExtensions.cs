using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TextOperations.Types
{
    internal static class SubdifExtensions
    {
        public static SubdifWrap Wrap(this Subdif subdif)
        {
            return SubdifWrap.FromSubdif(subdif);
        }

        public static SubdifWrap Wrap(this Subdif subdif, int id)
        {
            return SubdifWrap.FromSubdif(subdif, id);
        }

        public static SubdifWrap Wrap(this Subdif subdif, int id, List<int> siblings)
        {
            return SubdifWrap.FromSubdif(subdif, id, siblings);
        }

        public static List<SubdifWrap> Wrap(this List<Subdif> dif)
        {
            return SubdifWrap.FromDif(dif);
        }

        /// <summary>
        /// Creates a Wrapped Dif from a Dif and a List of specified ids.
        /// </summary>
        /// <param name="dif">The source dif.</param>
        /// <param name="ids">List of ids which will be assigned to the individual wraps.</param>
        /// <returns>Returns a Wrapped Dif.</returns>
        /// <exception cref="ArgumentException">Thrown when the counts of dif and ids do not equal.</exception>
        public static List<SubdifWrap> Wrap(this List<Subdif> dif, List<int> ids)
        {
            return SubdifWrap.FromDif(dif, ids);
        }

        public static List<Subdif> Unwrap(this List<SubdifWrap> wDif)
        {
            return SubdifWrap.UnwrapDif(wDif);
        }

        public static List<Subdif> DeepCopy(this List<Subdif> dif)
        {
            List<Subdif> newDif = new(dif.Count);
            foreach (var subdif in dif)
            {
                newDif.Add(subdif.Copy());
            }
            return newDif;
        }

        public static List<SubdifWrap> DeepCopy(this List<SubdifWrap> wDif)
        {
            List<SubdifWrap> newWDif = new(wDif.Count);
            foreach (var wrap in wDif)
            {
                newWDif.Add(wrap.Copy());
            }
            return newWDif;
        }

        public static List<List<SubdifWrap>> DeepCopy(this List<List<SubdifWrap>> wDifs)
        {
            List<List<SubdifWrap>> newWDifs = new(wDifs.Count);
            foreach (var wDif in wDifs)
            {
                newWDifs.Add(wDif.DeepCopy());
            }
            return newWDifs;
        }
    }
}
