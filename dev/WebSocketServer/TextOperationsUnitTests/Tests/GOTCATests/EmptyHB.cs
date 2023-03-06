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
    public class EmptyHB
    {
        [TestMethod]
        public void EmptyHB1()
        {
            GOTCAScenarioBuilder.Create(1)
                .SetMessage(new(0, -1, -1, new Add(0, 0, "a")))
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void EmptyHB2()
        {
            GOTCAScenarioBuilder.Create(1)
                .SetMessage(new(0, 2, 7, new Add(3, 5, "a")))
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void EmptyHB3()
        {
            GOTCAScenarioBuilder.Create(1)
                .SetMessage(new(0, -1, -1, new Add(0, 0, "a"), new Add(0, 0, "a"), new Add(0, 0, "a")))
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void EmptyHB4()
        {
            GOTCAScenarioBuilder.Create(1)
                .SetMessage(new(0, -1, -1, new Add(0, 0, "a"), new Del(0, 0, 1), new Newline(0, 0)))
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void EmptyHB5()
        {
            GOTCAScenarioBuilder.Create(1)
                .SetMessage(new(0, -1, -1,
                    new Add(0, 0, "a"),
                    new Del(0, 0, 1),
                    new Newline(0, 0),
                    new Add(1, 0, "a"),
                    new Del(1, 0, 1),
                    new Remline(0, 0)))
                .SetMessageAsResult()
                .Run();
        }
    }
}
