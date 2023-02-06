using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;
using TextOperations.Operations;
using TextOperationsUnitTests.Library;

namespace TextOperationsUnitTests.Tests.UDRTests
{
    [TestClass]
    public class Simple
    {
        [TestMethod]
        public void SingleOperation()
        {
            int initialNextWrapID = SubdifWrap.nextWrapID;
            WrappedHB wHB = new();
            SO SO = new();
            List<string> document = new() { "" };
            Operation operation = new(
                new OperationMetadata(0, 0, -1, -1),
                new Dif() { new Add(0, 0, "123456789") }
            );

            var (newDocument, wNewHB) = operation.UDR(document, wHB, SO);

            List<string> correctDocument = new() { "123456789" };
            WrappedOperation wCorrectOperation = new(operation.Metadata, operation.Dif.Wrap(new() { initialNextWrapID }));
            WrappedHB wCorrectHB = new() { wCorrectOperation };

            Assert.IsTrue(newDocument.SameAs(correctDocument));
            Assert.IsTrue(wNewHB.SameAs(wCorrectHB));
        }
    }
}
