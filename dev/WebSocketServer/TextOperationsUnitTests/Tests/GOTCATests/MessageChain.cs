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
    public class MessageChain
    {
        /// <summary>
        /// The following commented scenarios will never occur because it violates
        /// the Total Ordering (message chain members are places directly after each other in UDR)
        /// </summary>
        /*[TestMethod]
        public void DelIT1()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(1, 0, 0, new Del(0, 0, 1)))
                .SetMessage(new(0, -1, -1, new Add(0, 1, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void DelIT2()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(1, 0, 0, new Del(0, 1, 1)))
                .SetMessage(new(0, -1, -1, new Add(0, 1, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }*/

        [TestMethod]
        public void MessageChain1()
        {
            GOTCAScenarioBuilder.Create(1)
                .AddHBOperations(
                    new GOTCAOperationDescriptor(0, -1, -1))
                .SetMessage(new(0, -1, -1, new Add(0, 0, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void MessageChain2()
        {
            GOTCAScenarioBuilder.Create(1)
                .AddHBOperations(
                    new GOTCAOperationDescriptor(0, -1, -1))
                .SetMessage(new(0, -1, -1, new Add(0, 1, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void MessageChain3()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(0, -1, -1),
                    new(1, -1, -1, new Del(0, 0, 1)),
                    new(1, -1, -1, new Del(0, 0, 1)),
                    new(0, 0, 0),
                    new(0, 0, 0))
                .SetMessage(new(0, 0, 0, new Add(0, 1, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void MessageChain4()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(1, -1, -1, new Del(0, 0, 1)),
                    new(0, -1, -1, new Add(0, 4, "a")))
                .SetMessage(new(0, -1, -1, new Add(0, 6, "a")))
                .CreateSOFromHB()
                .SetResult(new(0, -1, -1, new Add(0, 5, "a")))
                .Run();
        }

        [TestMethod]
        public void MessageChain5()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(1, -1, -1, new Del(0, 0, 1)),
                    new(1, -1, -1, new Del(0, 0, 1)),
                    new(0, -1, -1, new Add(0, 4, "a")))
                .SetMessage(new(0, -1, -1, new Add(0, 7, "a")))
                .CreateSOFromHB()
                .SetResult(new(0, -1, -1, new Add(0, 5, "a")))
                .Run();
        }

        [TestMethod]
        public void MessageChain6()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(1, -1, -1, new Del(0, 0, 1)),
                    new(0, -1, -1, new Add(0, 3, "a")),
                    new(0, -1, -1, new Add(0, 4, "a")))
                .SetMessage(new(0, -1, -1, new Add(0, 6, "a")))
                .CreateSOFromHB()
                .SetResult(new(0, -1, -1, new Add(0, 5, "a")))
                .Run();
        }

        [TestMethod]
        public void MessageChain7()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(1, -1, -1, new Del(0, 0, 1)),
                    new(1, -1, -1, new Del(0, 0, 1)),
                    new(0, -1, -1, new Add(0, 3, "a")),
                    new(0, -1, -1, new Add(0, 4, "a")))
                .SetMessage(new(0, -1, -1, new Add(0, 7, "a")))
                .CreateSOFromHB()
                .SetResult(new(0, -1, -1, new Add(0, 5, "a")))
                .Run();
        }

        [TestMethod]
        public void MessageChain8()
        {
            GOTCAScenarioBuilder.Create(1)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(0, 0, 0, new Add(0, 1, "a")))
                .SetMessage(new(0, 0, 0, new Add(0, 2, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void MessageChain9()
        {
            GOTCAScenarioBuilder.Create(1)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(0, -1, -1))
                .SetMessage(new(0, 0, 0, new Add(0, 3, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void MessageChain10()
        {
            GOTCAScenarioBuilder.Create(1)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(0, -1, -1),
                    new(0, 0, 0, new Add(0, 2, "a")))
                .SetMessage(new(0, 0, 0, new Add(0, 3, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void MessageChain11()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(0, -1, -1),
                    new(1, -1, -1, new Del(0, 0, 1)),
                    new(1, -1, -1, new Del(0, 0, 1)),
                    new(0, 0, 0, new Add(0, 3, "a")),
                    new(0, 0, 0, new Add(0, 4, "a")))
                .SetMessage(new(0, 0, 0, new Add(0, 7, "a")))
                .CreateSOFromHB()
                .SetResult(new(0, 0, 0, new Add(0, 5, "a")))
                .Run();
        }

        [TestMethod]
        public void MessageChain12()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(0, -1, -1),
                    new(0, -1, -1),
                    new(0, -1, -1),
                    new(1, -1, -1, new Del(0, 0, 1)),
                    new(1, -1, -1, new Del(0, 0, 1)),
                    new(1, 0, 0, new Add(0, 3, "a")),
                    new(1, 0, 0, new Add(0, 4, "a")))
                .SetMessage(new(0, 0, 1, new Add(0, 10, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void MessageChain13()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(0, -1, -1),
                    // this HB state could never occur, the dels would be transformed to
                    // del(0, 2, 1)
                    new(1, -1, -1, new Del(0, 0, 1)),
                    new(1, -1, -1, new Del(0, 0, 1)),
                    new(0, 0, 0, new Add(0, 2, "a")),
                    new(0, 0, 0, new Add(0, 3, "a")))
                .SetMessage(new(0, 0, 0, new Add(0, 4, "a")))
                .CreateSOFromHB()
                .SetResult(new(0, 0, 0, new Add(0, 2, "a")))
                .Run();
        }

        [TestMethod]
        public void MessageChain14()
        {
            GOTCAScenarioBuilder.Create(3)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(0, -1, -1),
                    new(1, -1, -1, new Del(0, 2, 1)),
                    new(2, -1, -1, new Del(0, 2, 1)),
                    new(0, 0, 0, new Add(0, 2, "a")))
                .SetMessage(new(0, 0, 0, new Add(0, 3, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void MessageChain15()
        {
            GOTCAScenarioBuilder.Create(5)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(0, -1, -1),
                    new(1, -1, -1, new Del(0, 2, 1)),
                    new(2, -1, -1, new Del(0, 2, 1)),
                    new(3, -1, -1, new Del(0, 2, 1)),
                    new(4, -1, -1, new Del(0, 2, 1)),
                    new(1, 0, 0, new Del(0, 2, 1)),
                    new(0, 0, 0, new Add(0, 2, "a")),
                    new(0, 0, 0, new Add(0, 3, "a")))
                .SetMessage(new(0, 0, 0, new Add(0, 4, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void MessageChain16()
        {
            GOTCAScenarioBuilder.Create(5)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(0, -1, -1),
                    new(1, -1, -1, new Del(0, 2, 1)),
                    new(2, -1, -1, new Del(0, 2, 1)),
                    new(3, -1, -1, new Del(0, 2, 1)),
                    new(4, -1, -1, new Del(0, 2, 1)),
                    new(1, 0, 0, new Del(0, 2, 1)),
                    new(0, 0, 0, new Add(0, 2, "a")),
                    new(0, 0, 0, new Add(0, 3, "a")))
                .SetMessage(new(0, 0, 0, new Add(0, 4, "a"), new Add(0, 5, "a"), new Add(0, 6, "a"), new Add(0, 7, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }
    }
}
