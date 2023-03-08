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

        [TestMethod]
        public void LocalDependency3()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(1, -1, -1))
                .SetMessage(new(0, 0, 0, new Add(0, 1, "a")))
                .CreateSOFromHB()
                .SetResult(new(0, 0, 0, new Add(0, 2, "a")))
                .Run();
        }

        [TestMethod]
        public void LocalDependency4()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(1, -1, -1),
                    new(0, 0, 0))
                .SetMessage(new(0, 0, 1, new Add(0, 1, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void LocalDependency5()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(1, -1, -1),
                    new(0, -1, -1),
                    new(0, 0, 0))
                .SetMessage(new(0, 0, 1, new Add(0, 1, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void DelIT1()
        {
            var HBDel = new Del(0, 0, 1);
            var messageSubdif = new Add(0, 1, "a");

            // the result will have lost information because transforming add(0, 1, "a") against
            // del(0, 0, 1) loses information (the same result could be obtained when transforming
            // add(0, 0, "a") agains del(0, 0, 1), meaning that excluding del(0, 0, 1) from
            // add(0, 0, "a") could be either add(0, 1, "a") or add(0, 0, "a"))
            var resultWrap = new Add(0, 0, "a").Wrap();
            resultWrap.Original = messageSubdif.Copy();
            resultWrap.InformationLost = true;
            resultWrap.wTransformer = HBDel.Wrap();

            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(1, 0, 0, HBDel))
                .SetMessage(new(0, 0, 0, messageSubdif))
                .CreateSOFromHB()
                .SetResultWrapped(new(0, 0, 0, resultWrap))
                .Run();
        }

        [TestMethod]
        public void DelIT2()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(1, 0, 0, new Del(0, 1, 1)))
                .SetMessage(new(0, 0, 0, new Add(0, 1, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void NewlineIT1()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(1, 0, 0, new Newline(0, 0)))
                .SetMessage(new(0, 0, 0, new Add(0, 1, "a")))
                .CreateSOFromHB()
                .SetResult(new(0, 0, 0, new Add(1, 1, "a")))
                .Run();
        }

        [TestMethod]
        public void NewlineIT2()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(1, 0, 0, new Newline(0, 1)))
                .SetMessage(new(0, 0, 0, new Add(0, 1, "a")))
                .CreateSOFromHB()
                .SetResult(new(0, 0, 0, new Add(1, 0, "a")))
                .Run();
        }

        [TestMethod]
        public void NewlineIT3()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(1, 0, 0, new Newline(0, 2)))
                .SetMessage(new(0, 0, 0, new Add(0, 1, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void LocalDependency6()
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
                .SetMessage(new(0, 0, 2, new Add(0, 4, "a"), new Add(0, 5, "a"), new Add(0, 6, "a"), new Add(0, 7, "a")))
                .CreateSOFromHB()
                .SetMessageAsResult()
                .Run();
        }

        [TestMethod]
        public void LocalDependency7()
        {
            GOTCAScenarioBuilder.Create(2)
                .AddHBOperations(
                    new(0, -1, -1),
                    new(0, -1, -1),
                    new(1, -1, -1, new Newline(0, 4)),
                    new(0, 0, 0, new Add(0, 2, "a")),
                    new(0, 0, 0, new Add(0, 3, "a")),
                    new(1, 0, 0, new Newline(0, 1)))
                .SetMessage(new(0, 0, 1, new Add(0, 4, "a"), new Add(0, 5, "a"), new Add(0, 6, "a"), new Add(0, 7, "a")))
                .CreateSOFromHB()
                .SetResult(new(0, 0, 1, new Add(1, 3, "a"), new Add(1, 4, "a"), new Add(1, 5, "a"), new Add(1, 6, "a")))
                .Run();
        }
    }
}
