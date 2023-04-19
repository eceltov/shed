using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Operations;
using TextOperations.Types;
using TextOperationsUnitTests.Library;

namespace TextOperationsUnitTests.Tests.ILTests
{
    [TestClass]
    public class Tests
    {
        [TestMethod]
        public void SameOriginLISideEffectsProblem_TwoAddsOnSameRow()
        {
            // a dif extracted from an op with metadata: (0, 0, -1, -1)
            // it was the first operation received by the server
            var wdIncludeDif = new Dif()
            {
                new Del(0, 0, 7),
            }.Wrap();

            // a dif extracted from an op with metadata: (1, 0, -1, -1)
            var wdExternalDif1 = new Dif()
            {
                new Add(0, 5, "a"),
            }.Wrap();

            // a dif extracted from an op with metadata: (1, 1, -1, -1)
            var wdExternalDif2 = new Dif()
            {
                new Add(0, 4, "b"),
            }.Wrap();

            // this should result in Add(0, 0, "a")
            var wdTransformedDif1 = wdExternalDif1.MakeIndependent().LIT(wdIncludeDif);

            wdIncludeDif.AddRange(wdTransformedDif1);

            // this should result in Add(0, 0, "b"), because Dif2 took place before Dif1
            var wdTransformedDif2 = wdExternalDif2.MakeIndependent()
                // exclude the previous operation by the same client, this should not have any impact
                .LET(wdExternalDif1.CopyAndReverse())
                // include HB
                .LIT(wdIncludeDif);

            Assert.AreEqual(0, wdTransformedDif1[0].Sub.Row);
            Assert.AreEqual(0, wdTransformedDif1[0].Sub.Position);
            Assert.AreEqual("a", ((Add)wdTransformedDif1[0].Sub).Content);

            Assert.AreEqual(0, wdTransformedDif2[0].Sub.Row);
            Assert.AreEqual(0, wdTransformedDif2[0].Sub.Position);
            Assert.AreEqual("b", ((Add)wdTransformedDif2[0].Sub).Content);
        }

        [TestMethod]
        public void SameOriginLISideEffectsProblem_AddNewline()
        {
            // a dif extracted from an op with metadata: (0, 0, -1, -1)
            // it was the first operation received by the server
            var wdIncludeDif = new Dif()
            {
                new Del(0, 0, 7),
            }.Wrap();

            // a dif extracted from an op with metadata: (1, 0, -1, -1)
            var wdExternalDif1 = new Dif()
            {
                new Newline(0, 0),
            }.Wrap();

            // a dif extracted from an op with metadata: (1, 1, -1, -1)
            var wdExternalDif2 = new Dif()
            {
                new Add(0, 4, "b"),
            }.Wrap();

            // this should result in Newline(0, 0)
            var wdTransformedDif1 = wdExternalDif1.MakeIndependent().LIT(wdIncludeDif);

            wdIncludeDif.AddRange(wdTransformedDif1);

            // this should result in Add(0, 0, "b")
            var wdTransformedDif2 = wdExternalDif2.MakeIndependent().LET(wdExternalDif1.CopyAndReverse()).LIT(wdIncludeDif);

            Assert.AreEqual(0, wdTransformedDif2[0].Sub.Row);
            Assert.AreEqual(0, wdTransformedDif2[0].Sub.Position);
            Assert.AreEqual("b", ((Add)wdTransformedDif2[0].Sub).Content);
        }

        [TestMethod]
        public void SameOriginLISideEffectsProblem_TwoAddsOnDifferentRows()
        {
            // a dif extracted from an op with metadata: (0, 0, -1, -1)
            // it was the first operation received by the server
            var wdIncludeDif = new Dif()
            {
                new Del(0, 0, 7),
            }.Wrap();

            // a dif extracted from an op with metadata: (1, 0, -1, -1)
            var wdExternalDif1 = new Dif()
            {
                new Newline(0, 0),
                new Add(1, 5, "a"),
            }.Wrap();

            // a dif extracted from an op with metadata: (1, 1, -1, -1)
            var wdExternalDif2 = new Dif()
            {
                new Add(0, 4, "b"),
            }.Wrap();

            // this should result in Newline(0, 0), Add(1, 0, "a")
            var wdTransformedDif1 = wdExternalDif1.MakeIndependent().LIT(wdIncludeDif);

            wdIncludeDif.AddRange(wdTransformedDif1);

            // this should result in Add(0, 0, "b")
            var wdTransformedDif2 = wdExternalDif2.MakeIndependent().LET(wdExternalDif1.CopyAndReverse()).LIT(wdIncludeDif);

            Assert.AreEqual(1, wdTransformedDif1[1].Sub.Row);
            Assert.AreEqual(0, wdTransformedDif1[1].Sub.Position);
            Assert.AreEqual("a", ((Add)wdTransformedDif1[1].Sub).Content);

            Assert.AreEqual(0, wdTransformedDif2[0].Sub.Row);
            Assert.AreEqual(0, wdTransformedDif2[0].Sub.Position);
            Assert.AreEqual("b", ((Add)wdTransformedDif2[0].Sub).Content);
        }

        [TestMethod]
        public void AddNewlineRelativeOnly()
        {
            var wdDif1 = new Dif()
            {
                new Newline(0, 0),
            }.Wrap();

            var wdDif2 = new Dif()
            {
                new Add(0, 0, "a"),
            }.Wrap();

            var wdTransformedDif = wdDif2.MakeIndependent().LET(wdDif1.CopyAndReverse()).LIT(wdDif1);

            Assert.AreEqual(0, wdTransformedDif[0].Sub.Row);
            Assert.AreEqual(0, wdTransformedDif[0].Sub.Position);
            Assert.AreEqual("a", ((Add)wdTransformedDif[0].Sub).Content);
        }

        [TestMethod]
        public void MultiLevelLIProblem_DoubleLI()
        {
            var wdDif1 = new Dif()
            {
                new Del(0, 2, 5),
                new Del(0, 0, 2),
            }.Wrap();

            var wdDif2 = new Dif()
            {
                new Add(0, 3, "a"),
            }.Wrap();

            var wdTransformedDif = wdDif2.MakeIndependent().LIT(wdDif1);
            var wdTransformedDif2 = wdTransformedDif.MakeIndependent().LET(wdDif1).MakeDependent();

            Assert.IsTrue(wdTransformedDif2.SameAs(wdDif2));
        }
    }
}
