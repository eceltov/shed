using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;
using TextOperations.Operations;
using TextOperationsUnitTests.Library;

namespace TextOperationsUnitTests.Tests.GOTCATests
{
    [TestClass]
    public class LocalDependency
    {
        [TestMethod]
        public void LocalDependency1()
        {
            GOTCAScenarioBuilder.Create(1)
                .AddHBOperations(
                    new GOTCAOperationDescriptor(0, -1, -1))
                .SetMessage(new(0, 0, 0, new Add(0, 0, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void LocalDependency2()
        {
            GOTCAScenarioBuilder.Create(1)
                .AddHBOperations(
                    new GOTCAOperationDescriptor(0, -1, -1))
                .SetMessage(new(0, 0, 0, new Add(0, 1, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }
    }
}
