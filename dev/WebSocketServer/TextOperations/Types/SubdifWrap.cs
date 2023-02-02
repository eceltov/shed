using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TextOperations.Types
{
    internal class SubdifWrap
    {
        static int nextWrapID = 0; ///TODO: this should either by Interlocked or instanced to document
        public int ID;
        public Subdif Sub;
        public bool InformationLost = false;
        public bool Relative = false;
        public Subdif? Original = null;
        public SubdifWrap? wTransformer = null;
        public SubdifWrap? Addresser = null;
        public List<int> Siblings = new();
        public bool ConsumedSibling = false;

        /// <summary>
        /// Wraps should only be produced from the factory methods.
        /// </summary>
        SubdifWrap() { }

        public static SubdifWrap FromSubdif(Subdif subdif)
        {
            return new SubdifWrap()
            {
                ID = nextWrapID++,
                Sub = subdif,
            };
        }

        public static SubdifWrap FromSubdif(Subdif subdif, int id, List<int> siblings)
        {
            return new SubdifWrap()
            {
                ID = id,
                Sub = subdif,
                Siblings = siblings,
            };
        }

        public static List<SubdifWrap> FromDif(List<Subdif> dif)
        {
            List<SubdifWrap> wDif = new List<SubdifWrap>(dif.Count);
            foreach (var subdif in dif)
            {
                wDif.Add(FromSubdif(subdif));
            }
            return wDif;
        }

        public static List<Subdif> UnwrapDif(List<SubdifWrap> wDif)
        {
            List<Subdif> dif = new List<Subdif>(wDif.Count);
            foreach (var wrap in wDif)
            {
                dif.Add(wrap.Sub);
            }
            return dif;
        }

        public SubdifWrap Copy()
        {
            return new SubdifWrap
            {
                ID = ID,
                Sub = Sub.Copy(),
                InformationLost = InformationLost,
                Relative = Relative,
                Original = Original,
                wTransformer = wTransformer,
                Addresser = Addresser,
                Siblings = Siblings,
            };
        }

        bool BothNullOrBothNotNull(object? obj1, object? obj2)
        {
            return ((obj1 == null) && (obj2 == null)) || ((obj1 != null) && obj2 != null);
        }

        public bool SameAs(SubdifWrap? other)
        {
            if (other == null
                || ID != other.ID
                || !Sub.SameAs(other.Sub)
                || InformationLost != other.InformationLost
                || ConsumedSibling != other.ConsumedSibling
                || Relative != other.Relative)
                return false;

            if (!BothNullOrBothNotNull(Original, other!.Original)
                || !BothNullOrBothNotNull(wTransformer, other!.wTransformer)
                || !BothNullOrBothNotNull(Addresser, other!.Addresser))
                return false;

            if (Original != null && !Original.SameAs(other.Original))
                return false;
            if (wTransformer != null && !wTransformer.SameAs(other.wTransformer))
                return false;
            if (Addresser != null && !Addresser.SameAs(other.Addresser))
                return false;

            if (Siblings.Count != other.Siblings.Count)
                return false;
            for (int i = 0; i < Siblings.Count; i++)
            {
                if (Siblings[i] != other.Siblings[i])
                    return false;
            }

            return true;
        }

        public override string ToString()
        {
            string result = $"w[{Sub}, ID:{ID}";
            if (InformationLost)
                result += ", IL";
            if (Relative)
                result += ", R";
            if (Siblings.Count > 0)
            {
                result += $", S{{{Siblings[0]}";
                for (int i = 1; i < Siblings.Count; i++)
                    result += $",{Siblings[i]}";
                result += "}";
            }
            result += "]";
            return result;
        }
    }
}
