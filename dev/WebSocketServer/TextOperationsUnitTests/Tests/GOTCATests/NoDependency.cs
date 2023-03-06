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
    public class NoDependency
    {
        [TestMethod]
        public void NoDependency1()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(1, -1, -1),
                    new(1, -1, -1))
                .SetMessage(new(0, -1, -1, new Add(0, 0, "a")))
                .CreateSOFromHB()
                .SetResult(new(0, -1, -1, new Add(0, 2, "a")))
                .Run();
        }

        [TestMethod]
        public void NoDependency2()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(1, -1, -1),
                    new(1, 1, 0))
                .SetMessage(new(0, -1, -1, new Add(0, 0, "a")))
                .CreateSOFromHB()
                .SetResult(new(0, -1, -1, new Add(0, 2, "a")))
                .Run();
        }

        [TestMethod]
        public void NoDependency3()
        {
            GOTCAScenarioBuilder.Create(3)
                .AddHBOperations(
                    new(1, -1, -1),
                    new(2, -1, -1))
                .SetMessage(new(0, -1, -1, new Add(0, 0, "a")))
                .CreateSOFromHB()
                .SetResult(new(0, -1, -1, new Add(0, 2, "a")))
                .Run();
        }

        [TestMethod]
        public void NoDependency4()
        {
            GOTCAScenarioBuilder.Create(4)
                .AddHBOperations(
                    new(1, -1, -1),
                    new(1, 1, 0),
                    new(2, -1, -1),
                    new(2, 1, 0),
                    new(3, 1, 0),
                    new(3, 3, 0))
                .SetMessage(new(0, -1, -1, new Add(0, 0, "a")))
                .CreateSOFromHB()
                .SetResult(new(0, -1, -1, new Add(0, 6, "a")))
                .Run();
        }

        [TestMethod]
        public void NoDependency5()
        {
            GOTCAScenarioBuilder.Create(3)
                .AddHBOperations(
                    new(1, -1, -1),
                    new(2, -1, -1))
                .SetMessage(new(0, -1, -1,
                    new Remline(0, 0)))
                .CreateSOFromHB()
                .SetResult(new(0, -1, -1,
                    new Remline(0, 2)))
                .Run();
        }

        [TestMethod]
        public void NoDependency6()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new GOTCAOperationDescriptor(1, -1, -1))
                .SetMessage(new(0, -1, -1,
                    new Newline(0, 0),
                    new Remline(0, 0)))
                .CreateSOFromHB()
                .SetResult(new(0, -1, -1,
                    new Newline(0, 1),
                    new Remline(0, 1)))
                .Run();
        }

        [TestMethod]
        public void NoDependency7()
        {
            GOTCAScenarioBuilder.Create(4)
                .AddHBOperations(
                    new(1, -1, -1),
                    new(1, 1, 0),
                    new(2, -1, -1),
                    new(2, 1, 0),
                    new(3, 1, 0),
                    new(3, 3, 0))
                .SetMessage(new(0, -1, -1,
                    new Add(0, 0, "a"),
                    new Del(0, 0, 1),
                    new Newline(0, 0),
                    new Add(1, 0, "a"),
                    new Del(1, 0, 1),
                    new Remline(0, 0)))
                .CreateSOFromHB()
                .SetResult(new(0, -1, -1,
                    new Add(0, 6, "a"),
                    new Del(0, 6, 1),
                    new Newline(0, 6),
                    new Add(1, 0, "a"),
                    new Del(1, 0, 1),
                    new Remline(0, 6)))
                .Run();
        }
    }
}
