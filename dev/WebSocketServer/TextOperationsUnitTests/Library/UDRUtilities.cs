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

        public static WrappedOperation WOFactory(int clientID, int csn, int prevClientID, int prevCSN, params Subdif[] subdifs)
        {
            if (subdifs.Length <= 0)
                throw new ArgumentException($"Error: {nameof(WOFactory)}: Cannot create WrappedOperation with no subdifs.");

            return new(new(clientID, csn, prevClientID, prevCSN), subdifs.ToList().Wrap());
        }

        public static WrappedOperation WOFactory(int clientID, int csn, int prevClientID, int prevCSN, params SubdifWrap[] wraps)
        {
            if (wraps.Length <= 0)
                throw new ArgumentException($"Error: {nameof(WOFactory)}: Cannot create WrappedOperation with no wraps.");

            return new(new(clientID, csn, prevClientID, prevCSN), wraps.ToList());
        }

        public static SO SOFromHB(WrappedHB wdHB)
        {
            SO SO = new();
            foreach (var wOperation in wdHB)
            {
                SO.Add(wOperation.Metadata);
            }

            return SO;
        }

        internal class WrappedOperationGenerator
        {
            int clientID;
            int commitSerialNumber;

            public WrappedOperationGenerator(int clientID, int initialCommitSerialNumber = 0)
            {
                this.clientID = clientID;
                commitSerialNumber = initialCommitSerialNumber;
            }

            public WrappedOperation Generate(int prevClientID, int prevCSN, params Subdif[] subdifs)
            {
                return WOFactory(clientID, commitSerialNumber++, prevClientID, prevCSN, subdifs);
            }

            public WrappedOperation Generate(int prevClientID, int prevCSN, params SubdifWrap[] wraps)
            {
                return WOFactory(clientID, commitSerialNumber++, prevClientID, prevCSN, wraps);
            }
        }
    }
}
