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

        public static SubdifWrap Wrap(this Subdif subdif, int id, List<int> siblings)
        {
            return SubdifWrap.FromSubdif(subdif, id, siblings);
        }

        public static List<SubdifWrap> Wrap(this List<Subdif> dif)
        {
            return SubdifWrap.FromDif(dif);
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
