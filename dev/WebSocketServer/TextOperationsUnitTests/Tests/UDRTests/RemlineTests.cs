using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Operations;
using TextOperations.Types;
using TextOperationsUnitTests.Library;

namespace TextOperationsUnitTests.Tests.UDRTests
{
    [TestClass]
    public class RemlineTests
    {
        /// <summary>
        /// Tests a situation when the first user adds four lines to an empty document
        /// (the first line being "1234", the second line being "abcd", the rest being empty),
        /// a second user merges the first three rows (using two remlines) and a third user
        /// makes some changes to the text before the remlines from the second user is received.
        /// </summary>
        /// <param name="dif">The dif the third user made.</param>
        /// <param name="transformedDif">The third user's dif after transformation.</param>
        /// <param name="finalDocument">The expected final document state.</param>
        static void IncludingRemlinesToDifScenario(Dif dif, Dif transformedDif, List<string> finalDocument)
        {
            var (localNextWrapID, wHB, SO, document) = UDRUtilities.GetInitialState();

            // add four lines to the document with some text on the first two
            Operation operation1 = new(
                new OperationMetadata(0, 0, -1, -1),
                new Dif() { new Add(0, 0, "1234"), new Newline(0, 4), new Add(1, 0, "abcd"), new Newline(1, 4), new Newline(2, 0) }
            );
            var (newDocument, wNewHB) = operation1.UDR(document, wHB, SO);
            SO.Add(operation1.Metadata);

            // assert correct state
            List<string> correctDocument1 = new() { "1234", "abcd", "", "" };
            WrappedOperation wCorrectOperation1 = new(
                operation1.Metadata,
                operation1.Dif.Wrap(operation1.Dif.Select(_ => localNextWrapID++).ToList())
            );
            WrappedHB wCorrectHB1 = new() { wCorrectOperation1 };

            Assert.IsTrue(newDocument.SameAs(correctDocument1));
            Assert.IsTrue(wNewHB.SameAs(wCorrectHB1));

            // join the second and third line into the first one (deleting the newlines)
            Operation operation2a = new(
                new OperationMetadata(1, 0, 0, 0),
                new Dif() { new Remline(0, 4), new Remline(0, 8) }
            );
            (newDocument, wNewHB) = operation2a.UDR(newDocument, wNewHB, SO);
            SO.Add(operation2a.Metadata);

            // assert correct state
            List<string> correctDocument2a = new() { "1234abcd", "" };
            WrappedOperation wCorrectOperation2a = new(
                operation2a.Metadata,
                operation2a.Dif.Wrap(operation2a.Dif.Select(_ => localNextWrapID++).ToList())
            );
            WrappedHB wCorrectHB2a = new() { wCorrectOperation1, wCorrectOperation2a };

            Assert.IsTrue(newDocument.SameAs(correctDocument2a));
            Assert.IsTrue(wNewHB.SameAs(wCorrectHB2a));

            // before the lines are merged, another user writes some text
            Operation operation2b = new(
                new OperationMetadata(2, 0, 0, 0),
                dif
            );
            (newDocument, wNewHB) = operation2b.UDR(newDocument, wNewHB, SO);
            SO.Add(operation2b.Metadata);

            // assert correct state
            List<string> correctDocument2b = finalDocument;
            WrappedOperation wCorrectOperation2b = new(
                operation2b.Metadata,
                transformedDif.Wrap(transformedDif.Select(_ => localNextWrapID++).ToList())
            );
            WrappedHB wCorrectHB2b = new() { wCorrectOperation1, wCorrectOperation2a, wCorrectOperation2b };

            Assert.IsTrue(newDocument.SameAs(correctDocument2b));
            Assert.IsTrue(wNewHB.SameAs(wCorrectHB2b));
        }

        /// <summary>
        /// The third user added some text to the first line before the remline.
        /// </summary>
        [TestMethod]
        public void AddBeforeRemline()
        {
            Dif dif = new() { new Add(0, 0, "i") };
            List<string> correctDocument = new() { "i1234abcd", "" };
            IncludingRemlinesToDifScenario(dif, dif, correctDocument);
        }

        /// <summary>
        /// The third user added some text to the first line that intersects the remline.
        /// </summary>
        [TestMethod]
        public void AddIntersectsRemline()
        {
            Dif dif = new() { new Add(0, 0, "ijklmn") };
            List<string> correctDocument = new() { "ijklmn1234abcd", "" };
            IncludingRemlinesToDifScenario(dif, dif, correctDocument);
        }

        /// <summary>
        /// The third user added some text to the first line at the position of the remline.
        /// </summary>
        [TestMethod]
        public void AddAtRemline()
        {
            Dif dif = new() { new Add(0, 4, "i") };
            List<string> correctDocument = new() { "1234iabcd", "" };
            IncludingRemlinesToDifScenario(dif, dif, correctDocument);
        }

        /// <summary>
        /// The third user prepended the second line.
        /// </summary>
        [TestMethod]
        public void AddAtSecondLineStart()
        {
            Dif dif = new() { new Add(1, 0, "i") };
            Dif transformedDif = new() { new Add(0, 4, "i") };
            List<string> correctDocument = new() { "1234iabcd", "" };
            IncludingRemlinesToDifScenario(dif, transformedDif, correctDocument);
        }

        /// <summary>
        /// The third user added some text to the second line (not at the start).
        /// </summary>
        [TestMethod]
        public void AddAtSecondLineInside()
        {
            Dif dif = new() { new Add(1, 1, "i") };
            Dif transformedDif = new() { new Add(0, 5, "i") };
            List<string> correctDocument = new() { "1234aibcd", "" };
            IncludingRemlinesToDifScenario(dif, transformedDif, correctDocument);
        }

        /// <summary>
        /// The third user appended the second line.
        /// </summary>
        [TestMethod]
        public void AddAtSecondLineEnd()
        {
            Dif dif = new() { new Add(1, 4, "i") };
            Dif transformedDif = new() { new Add(0, 8, "i") };
            List<string> correctDocument = new() { "1234abcdi", "" };
            IncludingRemlinesToDifScenario(dif, transformedDif, correctDocument);
        }

        [TestMethod]
        public void MultilineAdd1()
        {
            Dif dif = new() { new Add(0, 4, "i"), new Add(1, 0, "j") };
            Dif transformedDif = new() { new Add(0, 4, "i"), new Add(0, 5, "j") };
            List<string> correctDocument = new() { "1234ijabcd", "" };
            IncludingRemlinesToDifScenario(dif, transformedDif, correctDocument);
        }

        [TestMethod]
        public void MultilineAdd2()
        {
            Dif dif = new() { new Add(0, 4, "i"), new Add(1, 0, "k"), new Add(1, 0, "j") };
            Dif transformedDif = new() { new Add(0, 4, "i"), new Add(0, 5, "k"), new Add(0, 5, "j") };
            List<string> correctDocument = new() { "1234ijkabcd", "" };
            IncludingRemlinesToDifScenario(dif, transformedDif, correctDocument);
        }
    }
}
