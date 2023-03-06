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
    public class FullDependency
    {
        [TestMethod]
        public void Empty()
        {
            GOTCAScenarioBuilder.Create(1)
                .SetMessage(new(0, -1, -1, new Add(0, 0, "a")))
                .SetMessageAsResult()
                .Run();
        }

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

            /* Example of manual testing
            UDRUtilities.WrappedOperationGenerator woGen0 = new(0);
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

            Assert.IsTrue(original.SameAs(transformed));
            */
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

        [TestMethod]
        public void FullDependency5()
        {
            GOTCAScenarioBuilder.Create(3)
                .AddHBOperations(
                    new(1, -1, -1),
                    new(1, -1, -1),
                    new(2, -1, -1),
                    new(2, -1, -1))
                .SetMessage(new(0, 2, 1, new Add(0, 0, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void FullDependency6()
        {
            GOTCAScenarioBuilder.Create(5)
                .AddHBOperations(
                    new(1, -1, -1),
                    new(2, -1, -1),
                    new(3, -1, -1),
                    new(4, -1, -1))
                .SetMessage(new(0, 4, 0, new Add(0, 0, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void FullDependency7()
        {
            GOTCAScenarioBuilder.Create(5)
                .AddHBOperations(
                    new(1, -1, -1),
                    new(2, -1, -1),
                    new(3, -1, -1),
                    new(3, 1, 0),
                    new(4, -1, -1),
                    new(2, 3, 0))
                .SetMessage(new(0, 2, 1, new Add(0, 0, "a"), new Add(0, 0, "a"), new Add(0, 0, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void FullDependency8()
        {
            GOTCAScenarioBuilder.Create(5)
                .AddHBOperations(
                    new(1, -1, -1),
                    new(2, -1, -1),
                    new(3, -1, -1),
                    new(3, 1, 0),
                    new(4, -1, -1),
                    new(2, 3, 0))
                .SetMessage(new(0, 2, 1, new Add(0, 0, "a"), new Del(0, 0, 1), new Newline(0, 0)))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void FullDependency9()
        {
            GOTCAScenarioBuilder.Create(5)
                .AddHBOperations(
                    new(1, -1, -1),
                    new(2, -1, -1),
                    new(3, -1, -1),
                    new(3, 1, 0),
                    new(4, -1, -1),
                    new(2, 3, 0))
                .SetMessage(new(0, 2, 1,
                    new Add(0, 0, "a"),
                    new Del(0, 0, 1),
                    new Newline(0, 0),
                    new Add(1, 0, "a"),
                    new Del(1, 0, 1),
                    new Remline(0, 0)))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }
    }
}
