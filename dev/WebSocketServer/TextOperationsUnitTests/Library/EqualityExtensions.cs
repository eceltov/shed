using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;

namespace TextOperationsUnitTests.Library
{
    internal static class EqualityExtensions
    {
        static bool SameCount<T>(List<T> list1, List<T> list2)
        {
            return list1.Count == list2.Count;
        }

        public static bool SameAs(this Dif dif1, Dif dif2)
        {
            if (!SameCount(dif1, dif2))
                return false;

            for (int i = 0; i < dif1.Count; i++)
            {
                if (!dif1[i].SameAs(dif2[i]))
                    return false;
            }

            return true;
        }

        public static bool SameAs(this WrappedDif wDif1, WrappedDif wDif2)
        {
            if (!SameCount(wDif1, wDif2))
                return false;

            for (int i = 0; i < wDif1.Count; i++)
            {
                if (!wDif1[i].SameAs(wDif2[i]))
                    return false;
            }

            return true;
        }

        public static bool SameAs(this List<string> document1, List<string> document2)
        {
            if (!SameCount(document1, document2))
                return false;

            for (int i = 0; i < document1.Count; i++)
            {
                if (document1[i] != document2[i])
                    return false;
            }

            return true;
        }

        public static bool SameAs(this WrappedOperation wOperation1, WrappedOperation wOperation2)
        {
            if (!wOperation1.Metadata.Equals(wOperation2.Metadata))
                return false;

            if (!wOperation1.wDif.SameAs(wOperation2.wDif))
                return false;

            return true;
        }


        public static bool SameAs(this WrappedHB wHB1, WrappedHB wHB2)
        {
            if (!SameCount(wHB1, wHB2))
                return false;

            for (int i = 0; i < wHB1.Count; i++)
            {
                if (!wHB1[i].SameAs(wHB2[i]))
                    return false;
            }

            return true;
        }
    }
}
