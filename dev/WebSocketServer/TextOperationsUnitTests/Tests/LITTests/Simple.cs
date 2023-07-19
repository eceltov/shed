using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;
using TextOperationsUnitTests.Library;

namespace TextOperationsUnitTests.Tests.LITTests
{
    [TestClass]
    public class Simple
    {
        [TestMethod]
        public void IncludingAddToAdd1()
        {
            DifTest test = new(
                new() { new Add(0, 1, "a") },
                new() { new Add(0, 0, "b") },
                new() { new Add(0, 2, "a") } // 'b' was inserted before 'a'
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingAddToAdd2()
        {
            DifTest test = new(
                new() { new Add(0, 0, "a") },
                new() { new Add(0, 1, "b") },
                new() { new Add(0, 0, "a") } // 'b' was inserted after 'a'
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingAddToAdd3()
        {
            DifTest test = new(
                new() { new Add(0, 0, "a") },
                new() { new Add(0, 0, "b") },
                new() { new Add(0, 1, "a") } // 'b' was inserted before 'a'
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToAdd1()
        {
            DifTest test = new(
                new() { new Add(0, 3, "a") },
                new() { new Del(0, 0, 1) },
                new() { new Add(0, 2, "a") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToAdd2()
        {
            DifTest test = new(
                new() { new Add(0, 3, "a") },
                new() { new Del(0, 1, 5) },
                new() { new Add(0, 1, "a") }, // losing info
                new() { new(true, false, 0, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToAdd3()
        {
            DifTest test = new(
                new() { new Add(0, 3, "a") },
                new() { new Del(0, 0, 5) },
                new() { new Add(0, 0, "a") }, // losing info
                new() { new(true, false, 0, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToAdd4()
        {
            DifTest test = new(
                new() { new Add(0, 3, "a") },
                new() { new Del(0, 3, 1) },
                new() { new Add(0, 3, "a") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToAdd5()
        {
            DifTest test = new(
                new() { new Add(0, 3, "a") },
                new() { new Del(0, 4, 1) },
                new() { new Add(0, 3, "a") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingAddToDel1()
        {
            DifTest test = new(
                new() { new Del(0, 3, 3) },
                new() { new Add(0, 0, "a") },
                new() { new Del(0, 4, 3) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingAddToDel2()
        {
            DifTest test = new(
                new() { new Del(0, 3, 3) },
                new() { new Add(0, 3, "a") },
                new() { new Del(0, 4, 3) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingAddToDel3()
        {
            DifTest test = new(
                new() { new Del(0, 0, 3) },
                new() { new Add(0, 1, "a") },
                new() { new Del(0, 0, 1), new Del(0, 1, 2) },
                new() { new(false, false, null, null, null, new() { 1 }), new() }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingAddToDel4()
        {
            DifTest test = new(
                new() { new Del(0, 3, 3) },
                new() { new Add(0, 6, "a") },
                new() { new Del(0, 3, 3) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingAddToDel5()
        {
            DifTest test = new(
                new() { new Del(0, 3, 3) },
                new() { new Add(0, 7, "a") },
                new() { new Del(0, 3, 3) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToDel1()
        {
            DifTest test = new(
                new() { new Del(0, 3, 3) },
                new() { new Del(0, 0, 1) },
                new() { new Del(0, 2, 3) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToDel2()
        {
            DifTest test = new(
                new() { new Del(0, 3, 3) },
                new() { new Del(0, 3, 1) },
                new() { new Del(0, 3, 2) }, // losing info
                new() { new(true, false, 0, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToDel3()
        {
            DifTest test = new(
                new() { new Del(0, 3, 3) },
                new() { new Del(0, 4, 1) },
                new() { new Del(0, 3, 2) }, // losing info
                new() { new(true, false, 0, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToDel4()
        {
            DifTest test = new(
                new() { new Del(0, 3, 3) },
                new() { new Del(0, 5, 1) },
                new() { new Del(0, 3, 2) }, // losing info
                new() { new(true, false, 0, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToDel5()
        {
            DifTest test = new(
                new() { new Del(0, 3, 3) },
                new() { new Del(0, 6, 1) },
                new() { new Del(0, 3, 3) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToNewline1()
        {
            DifTest test = new(
                new() { new Newline(0, 0) },
                new() { new Newline(0, 0) },
                new() { new Newline(1, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToNewline2()
        {
            DifTest test = new(
                new() { new Newline(0, 1) },
                new() { new Newline(0, 0) },
                new() { new Newline(1, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToNewline3()
        {
            DifTest test = new(
                new() { new Newline(0, 0) },
                new() { new Newline(0, 1) },
                new() { new Newline(0, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToNewline4()
        {
            DifTest test = new(
                new() { new Newline(0, 1) },
                new() { new Newline(0, 1) },
                new() { new Newline(1, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToNewline5()
        {
            DifTest test = new(
                new() { new Newline(1, 0) },
                new() { new Newline(0, 0) },
                new() { new Newline(2, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToNewline6()
        {
            DifTest test = new(
                new() { new Newline(1, 1) },
                new() { new Newline(0, 0) },
                new() { new Newline(2, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToNewline7()
        {
            DifTest test = new(
                new() { new Newline(1, 1) },
                new() { new Newline(0, 1) },
                new() { new Newline(2, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToNewline8()
        {
            DifTest test = new(
                new() { new Newline(0, 0) },
                new() { new Newline(1, 0) },
                new() { new Newline(0, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToRemline1()
        {
            DifTest test = new(
                new() { new Remline(0, 0) },
                new() { new Newline(0, 0) },
                new() { new Remline(1, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToRemline2()
        {
            DifTest test = new(
                new() { new Remline(0, 1) },
                new() { new Newline(0, 0) },
                new() { new Remline(1, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToRemline3()
        {
            DifTest test = new(
                new() { new Remline(0, 1) },
                new() { new Newline(0, 1) },
                new() { new Remline(1, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToRemline4()
        {
            DifTest test = new(
                new() { new Remline(0, 0) },
                new() { new Newline(1, 0) },
                new() { new Remline(0, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToRemline5()
        {
            DifTest test = new(
                new() { new Remline(0, 1) },
                new() { new Newline(1, 0) },
                new() { new Remline(0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToRemline6()
        {
            DifTest test = new(
                new() { new Remline(0, 1) },
                new() { new Newline(1, 1) },
                new() { new Remline(0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToRemline7()
        {
            DifTest test = new(
                new() { new Remline(1, 0) },
                new() { new Newline(0, 0) },
                new() { new Remline(2, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToRemline8()
        {
            DifTest test = new(
                new() { new Remline(1, 1) },
                new() { new Newline(0, 0) },
                new() { new Remline(2, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToNewline1()
        {
            DifTest test = new(
                new() { new Newline(0, 0) },
                new() { new Remline(0, 0) },
                new() { new Newline(0, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToNewline2()
        {
            DifTest test = new(
                new() { new Newline(1, 0) },
                new() { new Remline(0, 0) },
                new() { new Newline(0, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToNewline3()
        {
            DifTest test = new(
                new() { new Newline(1, 1) },
                new() { new Remline(0, 0) },
                new() { new Newline(0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToNewline4()
        {
            DifTest test = new(
                new() { new Newline(1, 1) },
                new() { new Remline(0, 1) },
                new() { new Newline(0, 2) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToNewline5()
        {
            DifTest test = new(
                new() { new Newline(2, 1) },
                new() { new Remline(0, 1) },
                new() { new Newline(1, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToNewline6()
        {
            DifTest test = new(
                new() { new Newline(0, 2) },
                new() { new Remline(0, 2) },
                new() { new Newline(0, 2) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToNewline7()
        {
            DifTest test = new(
                new() { new Newline(0, 1) },
                new() { new Remline(0, 2) },
                new() { new Newline(0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToRemline1()
        {
            DifTest test = new(
                new() { new Remline(0, 0) },
                new() { new Remline(0, 0) },
                new() { new Remline(0, 0) },
                new() { new(true, false, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToRemline2()
        {
            DifTest test = new(
                new() { new Remline(1, 1) },
                new() { new Remline(1, 1) },
                new() { new Remline(1, 1) },
                new() { new(true, false, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToRemline3()
        {
            DifTest test = new(
                new() { new Remline(1, 0) },
                new() { new Remline(0, 0) },
                new() { new Remline(0, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToRemline4()
        {
            DifTest test = new(
                new() { new Remline(1, 1) },
                new() { new Remline(0, 0) },
                new() { new Remline(0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToRemline5()
        {
            DifTest test = new(
                new() { new Remline(0, 0) },
                new() { new Remline(1, 0) },
                new() { new Remline(0, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToRemline6()
        {
            DifTest test = new(
                new() { new Remline(0, 1) },
                new() { new Remline(1, 0) },
                new() { new Remline(0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToRemline7()
        {
            DifTest test = new(
                new() { new Remline(0, 1) },
                new() { new Remline(1, 1) },
                new() { new Remline(0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToRemline8()
        {
            DifTest test = new(
                new() { new Remline(1, 0) },
                new() { new Remline(0, 1) },
                new() { new Remline(0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToRemline9()
        {
            DifTest test = new(
                new() { new Remline(1, 1) },
                new() { new Remline(0, 1) },
                new() { new Remline(0, 2) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToRemline10()
        {
            DifTest test = new(
                new() { new Remline(2, 1) },
                new() { new Remline(0, 1) },
                new() { new Remline(1, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToAdd1()
        {
            DifTest test = new(
                new() { new Add(0, 0, "a") },
                new() { new Newline(0, 0) },
                new() { new Add(1, 0, "a") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToAdd2()
        {
            DifTest test = new(
                new() { new Add(0, 0, "a") },
                new() { new Newline(0, 1) },
                new() { new Add(0, 0, "a") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToAdd3()
        {
            DifTest test = new(
                new() { new Add(0, 0, "a") },
                new() { new Newline(1, 0) },
                new() { new Add(0, 0, "a") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToAdd4()
        {
            DifTest test = new(
                new() { new Add(0, 0, "a") },
                new() { new Newline(1, 1) },
                new() { new Add(0, 0, "a") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToAdd5()
        {
            DifTest test = new(
                new() { new Add(0, 1, "a") },
                new() { new Newline(0, 0) },
                new() { new Add(1, 1, "a") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToAdd6()
        {
            DifTest test = new(
                new() { new Add(0, 1, "a") },
                new() { new Newline(0, 1) },
                new() { new Add(1, 0, "a") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToAdd7()
        {
            DifTest test = new(
                new() { new Add(0, 2, "a") },
                new() { new Newline(0, 1) },
                new() { new Add(1, 1, "a") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToAdd8()
        {
            DifTest test = new(
                new() { new Add(1, 2, "a") },
                new() { new Newline(0, 1) },
                new() { new Add(2, 2, "a") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToAdd9()
        {
            DifTest test = new(
                new() { new Add(0, 0, "ab") },
                new() { new Newline(0, 1) },
                new() { new Add(0, 0, "ab") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingAddToNewline1()
        {
            DifTest test = new(
                new() { new Newline(0, 0) },
                new() { new Add(0, 0, "a") },
                new() { new Newline(0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingAddToNewline2()
        {
            DifTest test = new(
                new() { new Newline(0, 0) },
                new() { new Add(0, 1, "a") },
                new() { new Newline(0, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingAddToNewline3()
        {
            DifTest test = new(
                new() { new Newline(0, 1) },
                new() { new Add(0, 0, "a") },
                new() { new Newline(0, 2) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingAddToNewline4()
        {
            DifTest test = new(
                new() { new Newline(1, 0) },
                new() { new Add(0, 0, "a") },
                new() { new Newline(1, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingAddToNewline5()
        {
            DifTest test = new(
                new() { new Newline(0, 0) },
                new() { new Add(1, 0, "a") },
                new() { new Newline(0, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToDel1()
        {
            DifTest test = new(
                new() { new Del(0, 0, 1) },
                new() { new Newline(0, 0) },
                new() { new Del(1, 0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToDel2()
        {
            DifTest test = new(
                new() { new Del(0, 1, 1) },
                new() { new Newline(0, 0) },
                new() { new Del(1, 1, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToDel3()
        {
            DifTest test = new(
                new() { new Del(0, 0, 1) },
                new() { new Newline(0, 1) },
                new() { new Del(0, 0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToDel4()
        {
            DifTest test = new(
                new() { new Del(0, 1, 1) },
                new() { new Newline(0, 1) },
                new() { new Del(1, 0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToDel5()
        {
            DifTest test = new(
                new() { new Del(1, 0, 1) },
                new() { new Newline(0, 0) },
                new() { new Del(2, 0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToDel6()
        {
            DifTest test = new(
                new() { new Del(1, 0, 1) },
                new() { new Newline(0, 1) },
                new() { new Del(2, 0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToDel7()
        {
            DifTest test = new(
                new() { new Del(1, 1, 1) },
                new() { new Newline(0, 0) },
                new() { new Del(2, 1, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToDel8()
        {
            DifTest test = new(
                new() { new Del(1, 1, 1) },
                new() { new Newline(0, 1) },
                new() { new Del(2, 1, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToDel9()
        {
            DifTest test = new(
                new() { new Del(0, 0, 1) },
                new() { new Newline(1, 0) },
                new() { new Del(0, 0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToDel10()
        {
            DifTest test = new(
                new() { new Del(0, 1, 1) },
                new() { new Newline(1, 0) },
                new() { new Del(0, 1, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingNewlineToDel11()
        {
            DifTest test = new(
                new() { new Del(0, 0, 2) },
                new() { new Newline(0, 1) },
                new() { new Del(0, 0, 1), new Del(1, 0, 1) },
                new() { new(false, false, null, null, null, new() { 1 }), new() }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToNewline1()
        {
            DifTest test = new(
                new() { new Newline(0, 1) },
                new() { new Del(0, 0, 1) },
                new() { new Newline(0, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToNewline2()
        {
            DifTest test = new(
                new() { new Newline(0, 2) },
                new() { new Del(0, 0, 1) },
                new() { new Newline(0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToNewline3()
        {
            DifTest test = new(
                new() { new Newline(0, 2) },
                new() { new Del(0, 1, 1) },
                new() { new Newline(0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToNewline4()
        {
            DifTest test = new(
                new() { new Newline(0, 2) },
                new() { new Del(0, 0, 2) },
                new() { new Newline(0, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToNewline5()
        {
            DifTest test = new(
                new() { new Newline(0, 0) },
                new() { new Del(0, 0, 1) },
                new() { new Newline(0, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToNewline6()
        {
            DifTest test = new(
                new() { new Newline(0, 1) },
                new() { new Del(0, 1, 1) },
                new() { new Newline(0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToNewline7()
        {
            DifTest test = new(
                new() { new Newline(0, 1) },
                new() { new Del(0, 0, 2) },
                new() { new Newline(0, 0) },
                new() { new(true, false, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToNewline8()
        {
            DifTest test = new(
                new() { new Newline(0, 1) },
                new() { new Del(1, 0, 1) },
                new() { new Newline(0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToAdd1()
        {
            DifTest test = new(
                new() { new Add(0, 0, "a") },
                new() { new Remline(0, 0) },
                new() { new Add(0, 0, "a") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToAdd2()
        {
            DifTest test = new(
                new() { new Add(0, 0, "a") },
                new() { new Remline(0, 1) },
                new() { new Add(0, 0, "a") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToAdd3()
        {
            DifTest test = new(
                new() { new Add(0, 1, "a") },
                new() { new Remline(0, 1) },
                new() { new Add(0, 1, "a") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToAdd4()
        {
            DifTest test = new(
                new() { new Add(1, 0, "a") },
                new() { new Remline(0, 0) },
                new() { new Add(0, 0, "a") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToAdd5()
        {
            DifTest test = new(
                new() { new Add(1, 1, "a") },
                new() { new Remline(0, 0) },
                new() { new Add(0, 1, "a") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToAdd6()
        {
            DifTest test = new(
                new() { new Add(1, 0, "a") },
                new() { new Remline(0, 1) },
                new() { new Add(0, 1, "a") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToAdd7()
        {
            DifTest test = new(
                new() { new Add(1, 1, "a") },
                new() { new Remline(0, 1) },
                new() { new Add(0, 2, "a") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToAdd8()
        {
            DifTest test = new(
                new() { new Add(2, 0, "a") },
                new() { new Remline(0, 0) },
                new() { new Add(1, 0, "a") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToAdd9()
        {
            DifTest test = new(
                new() { new Add(2, 0, "a") },
                new() { new Remline(0, 1) },
                new() { new Add(1, 0, "a") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToAdd10()
        {
            DifTest test = new(
                new() { new Add(2, 1, "a") },
                new() { new Remline(0, 1) },
                new() { new Add(1, 1, "a") }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingAddToRemline1()
        {
            DifTest test = new(
                new() { new Remline(0, 0) },
                new() { new Add(0, 0, "a") },
                new() { new Remline(0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingAddToRemline2()
        {
            DifTest test = new(
                new() { new Remline(0, 1) },
                new() { new Add(0, 0, "a") },
                new() { new Remline(0, 2) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingAddToRemline3()
        {
            DifTest test = new(
                new() { new Remline(0, 1) },
                new() { new Add(0, 1, "a") },
                new() { new Remline(0, 2) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingAddToRemline4()
        {
            DifTest test = new(
                new() { new Remline(0, 2) },
                new() { new Add(0, 1, "abc") },
                new() { new Remline(0, 5) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingAddToRemline5()
        {
            DifTest test = new(
                new() { new Remline(1, 0) },
                new() { new Add(0, 0, "a") },
                new() { new Remline(1, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingAddToRemline6()
        {
            DifTest test = new(
                new() { new Remline(0, 0) },
                new() { new Add(1, 0, "a") },
                new() { new Remline(0, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToDel1()
        {
            DifTest test = new(
                new() { new Del(0, 0, 1) },
                new() { new Remline(0, 1) },
                new() { new Del(0, 0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToDel2()
        {
            DifTest test = new(
                new() { new Del(1, 0, 1) },
                new() { new Remline(0, 0) },
                new() { new Del(0, 0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToDel3()
        {
            DifTest test = new(
                new() { new Del(1, 1, 1) },
                new() { new Remline(0, 0) },
                new() { new Del(0, 1, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToDel4()
        {
            DifTest test = new(
                new() { new Del(1, 0, 1) },
                new() { new Remline(0, 1) },
                new() { new Del(0, 1, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToDel5()
        {
            DifTest test = new(
                new() { new Del(1, 1, 1) },
                new() { new Remline(0, 1) },
                new() { new Del(0, 2, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToDel6()
        {
            DifTest test = new(
                new() { new Del(2, 0, 1) },
                new() { new Remline(0, 0) },
                new() { new Del(1, 0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToDel7()
        {
            DifTest test = new(
                new() { new Del(2, 0, 1) },
                new() { new Remline(0, 1) },
                new() { new Del(1, 0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToDel8()
        {
            DifTest test = new(
                new() { new Del(2, 1, 1) },
                new() { new Remline(0, 0) },
                new() { new Del(1, 1, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingRemlineToDel9()
        {
            DifTest test = new(
                new() { new Del(2, 1, 1) },
                new() { new Remline(0, 1) },
                new() { new Del(1, 1, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToRemline1()
        {
            DifTest test = new(
                new() { new Remline(0, 1) },
                new() { new Del(0, 0, 1) },
                new() { new Remline(0, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToRemline()
        {
            DifTest test = new(
                new() { new Remline(0, 2) },
                new() { new Del(0, 0, 1) },
                new() { new Remline(0, 1) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToRemline3()
        {
            DifTest test = new(
                new() { new Remline(0, 0) },
                new() { new Del(1, 0, 1) },
                new() { new Remline(0, 0) }
            );

            DifAssertions.TestLIT(test);
        }

        [TestMethod]
        public void IncludingDelToRemline4()
        {
            DifTest test = new(
                new() { new Remline(1, 0) },
                new() { new Del(0, 0, 1) },
                new() { new Remline(1, 0) }
            );

            DifAssertions.TestLIT(test);
        }



    }
}
