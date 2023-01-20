using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;
using TextOperationsUnitTests.Library;

namespace TextOperationsUnitTests.LITTests
{
    [TestClass]
    public class Simple
    {
        [TestMethod]
        public void Sample()
        {
            List<DifTest> tests = new()
            {
                new(
                    "Including [add] to [add] 1.",
                    new() { new Add(0, 1, "a") },
                    new() { new Add(0, 0, "b") },
                    new() { new Add(0, 2, "a") } // 'b' was inserted before 'a'
                ),
                new(
                    "Including [add] to [add] 2.",
                    new() { new Add(0, 0, "a") },
                    new() { new Add(0, 1, "b") },
                    new() { new Add(0, 0, "a") } // 'b' was inserted after 'a'
                ),
            };

            DifAssertions.TestLITList(tests);
        }
    }
}
