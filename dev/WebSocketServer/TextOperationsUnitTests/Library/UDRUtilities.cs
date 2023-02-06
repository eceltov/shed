using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;

namespace TextOperationsUnitTests.Library
{
    internal static class UDRUtilities
    {
        public static (int localNextWrapID, WrappedHB wHB, SO SO, List<string> document) GetInitialState()
        {
            return (SubdifWrap.nextWrapID, new(), new(), new() { "" });
        }
    }
}
