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
    public class Simple
    {
        

        [TestMethod]
        public void FullDependency1()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(0, 0, 0),
                    new(0, 0, 1),
                    new(0, 0, 2))
                .SetMessage(new(1, 0, 3, new Add(0, 4, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();

            /*UDRUtilities.WrappedOperationGenerator woGen0 = new(0);
            UDRUtilities.WrappedOperationGenerator woGen1 = new(1);

            WrappedHB wdHB = new()
            {
                woGen0.Generate(-1, -1, new Add(0, 0, "a")),
                woGen0.Generate(0, 0, new Add(0, 1, "b")),
                woGen0.Generate(0, 1, new Add(0, 2, "c")),
                woGen0.Generate(0, 2, new Add(0, 3, "d")),
            };

            SO SO = UDRUtilities.SOFromHB(wdHB);

            var original = woGen1.Generate(0, 3, new Add(0, 4, "e"));

            var transformed = original.DeepCopy().GOTCA(wdHB, SO);

            Assert.IsTrue(original.SameAs(transformed));*/
        }

        [TestMethod]
        public void FullDependency2()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(0, -1, -1),
                    new(0, 0, 0),
                    new(0, 0, 2))
                .SetMessage(new(1, 0, 3, new Add(0, 4, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void FullDependency3()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(0, -1, -1),
                    new(0, -1, -1),
                    new(0, -1, -1))
                .SetMessage(new(1, 0, 3, new Add(0, 4, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void FullDependency4()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(0, -1, -1),
                    new(0, -1, -1),
                    new(0, -1, -1))
                .SetMessage(new(1, 0, 3, new Add(0, 1, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }
    }
}
