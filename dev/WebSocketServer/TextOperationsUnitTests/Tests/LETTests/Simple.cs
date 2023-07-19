using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;
using TextOperationsUnitTests.Library;

namespace TextOperationsUnitTests.Tests.LETTests
{
    [TestClass]
    public class Simple
    {
        [TestMethod]
        public void ExcludingAddFromAdd1()
        {
            DifTest test = new(
                new() { new Add(0, 1, "a") },
                new() { new Add(0, 0, "b") },
                new() { new Add(0, 0, "a") } // 'b' was inserted before 'a'
            );

            DifAssertions.TestLET(test);
        }

        [TestMethod]
        public void ExcludingAddFromAdd2()
        {
            DifTest test = new(
                new() { new Add(0, 0, "a") },
                new() { new Add(0, 1, "b") },
                new() { new Add(0, 0, "a") } // 'b' was inserted after 'a'
            );

            DifAssertions.TestLET(test);
        }

        [TestMethod]
        public void ExcludingAddFromAdd3()
        {
            DifTest test = new(
                new() { new Add(0, 0, "a") },
                new() { new Add(0, 0, "b") },
                new() { new Add(0, 0, "a") },
                new() { new(false, true, null, null, 0) }
            );

            DifAssertions.TestLET(test);
        }

        [TestMethod]
        public void ExcludingDelFromAdd1()
        {
            DifTest test = new(
                new() { new Add(0, 3, "a") },
                new() { new Del(0, 0, 1) },
                new() { new Add(0, 4, "a") }
            );

            DifAssertions.TestLET(test);
        }

        [TestMethod]
        public void ExcludingDelFromAdd2()
        {
            DifTest test = new(
                new() { new Add(0, 3, "a") },
                new() { new Del(0, 1, 5) },
                new() { new Add(0, 8, "a") }
            );

            DifAssertions.TestLET(test);
        }

        [TestMethod]
        public void ExcludingDelFromAdd3()
        {
            DifTest test = new(
                new() { new Add(0, 3, "a") },
                new() { new Del(0, 0, 5) },
                new() { new Add(0, 8, "a") }
            );

            DifAssertions.TestLET(test);
        }

        [TestMethod]
        public void ExcludingDelFromAdd4()
        {
            DifTest test = new(
                new() { new Add(0, 3, "a") },
                new() { new Del(0, 3, 1) },
                new() { new Add(0, 3, "a") }
            );

            DifAssertions.TestLET(test);
        }

        [TestMethod]
        public void ExcludingDelFromAdd5()
        {
            DifTest test = new(
                new() { new Add(0, 3, "a") },
                new() { new Del(0, 4, 1) },
                new() { new Add(0, 3, "a") }
            );

            DifAssertions.TestLET(test);
        }

        [TestMethod]
        public void ExcludingAddFromDel1()
        {
            DifTest test = new(
                new() { new Del(0, 3, 3) },
                new() { new Add(0, 0, "a") },
                new() { new Del(0, 2, 3) }
            );

            DifAssertions.TestLET(test);
        }

        [TestMethod]
        public void ExcludingAddFromDel2()
        {
            DifTest test = new(
                new() { new Del(0, 3, 3) },
                new() { new Add(0, 3, "a") },
                new() { new Del(0, 0, 1), new Del(0, 3, 2) },
                new() { new(false, true, null, null, 0, new() { 1 }), new() }
            );

            DifAssertions.TestLET(test);
        }

        [TestMethod]
        public void ExcludingAddFromDel3()
        {
            DifTest test = new(
                new() { new Del(0, 3, 3) },
                new() { new Add(0, 4, "a") },
                new() { new Del(0, 0, 1), new Del(0, 3, 2) },
                new() { new(false, true, null, null, 0, new() { 1 }), new() }
            );

            DifAssertions.TestLET(test);
        }

        [TestMethod]
        public void ExcludingAddFromDel4()
        {
            DifTest test = new(
                new() { new Del(0, 3, 3) },
                new() { new Add(0, 6, "a") },
                new() { new Del(0, 3, 3) }
            );

            DifAssertions.TestLET(test);
        }

        [TestMethod]
        public void ExcludingAddFromDel5()
        {
            DifTest test = new(
                new() { new Del(0, 3, 3) },
                new() { new Add(0, 7, "a") },
                new() { new Del(0, 3, 3) }
            );

            DifAssertions.TestLET(test);
        }

        [TestMethod]
        public void ExcludingDelFromDel1()
        {
            DifTest test = new(
                new() { new Del(0, 3, 3) },
                new() { new Del(0, 0, 1) },
                new() { new Del(0, 4, 3) }
            );

            DifAssertions.TestLET(test);
        }

        [TestMethod]
        public void ExcludingDelFromDel2()
        {
            DifTest test = new(
                new() { new Del(0, 3, 3) },
                new() { new Del(0, 3, 1) },
                new() { new Del(0, 4, 3) }
            );

            DifAssertions.TestLET(test);
        }

        [TestMethod]
        public void ExcludingDelFromDel3()
        {
            DifTest test = new(
                new() { new Del(0, 3, 3) },
                new() { new Del(0, 4, 1) },
                new() { new Del(0, 3, 1), new Del(0, 5, 2) },
                new() { new(false, false, null, null, null, new() { 1 }), new() }
            );

            DifAssertions.TestLET(test);
        }

        [TestMethod]
        public void ExcludingDelFromDel4()
        {
            DifTest test = new(
                new() { new Del(0, 3, 3) },
                new() { new Del(0, 5, 1) },
                new() { new Del(0, 3, 2), new Del(0, 6, 1) },
                new() { new(false, false, null, null, null, new() { 1 }), new() }
            );

            DifAssertions.TestLET(test);
        }

        [TestMethod]
        public void ExcludingDelFromDel5()
        {
            DifTest test = new(
                new() { new Del(0, 3, 3) },
                new() { new Del(0, 6, 1) },
                new() { new Del(0, 3, 3) }
            );

            DifAssertions.TestLET(test);
        }
    }
}
