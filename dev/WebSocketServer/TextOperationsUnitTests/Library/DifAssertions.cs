using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Operations;
using TextOperations.Types;

namespace TextOperationsUnitTests.Library
{
    internal class SubdifMeta
    {
        public int? ID = null;
        public bool? InformationLost = null;
        public bool? Relative = null;
        public Subdif? Original = null;
        public SubdifWrap? wTransformer = null;
        public SubdifWrap? Addresser = null;
        public List<int>? Siblings = null;

        readonly int? originalIndex;
        readonly int? transformerIndex;
        readonly int? addresserIndex;
        readonly List<int>? siblingIndices;

        public SubdifMeta(
            bool? informationLost = null, bool? relative = null, int? originalIndex = null,
            int? transformerIndex = null, int? addresserIndex = null,
            List<int>? siblingIndices = null, int? ID = null)
        {
            this.ID = ID;
            InformationLost = informationLost;
            Relative = relative;
            this.originalIndex = originalIndex;
            this.transformerIndex = transformerIndex;
            this.addresserIndex = addresserIndex;
            this.siblingIndices = siblingIndices;
        }

        public void Fit(Dif dif, WrappedDif? wTransformer, WrappedDif wTransformed)
        {
            Original = originalIndex == null ? null : dif[originalIndex.Value];
            if (wTransformer != null)
            {
                this.wTransformer = transformerIndex == null ? null : wTransformer[transformerIndex.Value];
                Addresser = addresserIndex == null ? null : wTransformer[addresserIndex.Value];
            }

            if (siblingIndices != null)
            {
                Siblings = new();
                siblingIndices.ForEach((index) => {
                    Siblings.Add(wTransformed[index].ID);
                });
            }
        }
    }

    internal class DifTest
    {
        public Dif Dif;
        public Dif Transformer;
        public Dif Expected;
        public List<SubdifMeta>? MetaList;

        public DifTest(Dif dif, Dif transformer, Dif expected, List<SubdifMeta>? metaList = null)
        {
            Dif = dif;
            Transformer = transformer;
            Expected = expected;
            MetaList = metaList;
        }
    }

    internal static class DifAssertions
    {
        /// <summary>
        /// Fits SubdifMeta objects with specific data derived from the other parameters.
        /// </summary>
        /// <param name="dif">The original dif, used to fit the Original attribute.</param>
        /// <param name="wTransformer">The transformer wDif, used to fit the wTransformer and Addresser attributes.</param>
        /// <param name="wTransformed">The resulting wDif, used to fit the Siblings attribute.</param>
        /// <param name="metaList">The list of SubdifMetas to be fitted.</param>
        /// <returns></returns>
        static List<SubdifMeta> FitSubdifMetas(Dif dif, WrappedDif? wTransformer, WrappedDif wTransformed, List<SubdifMeta> metaList)
        {
            metaList.ForEach((meta) => meta.Fit(dif, wTransformer, wTransformed));
            return metaList;
        }

        static void AssertSubdifMetaCorrect(WrappedDif wTransformed, List<SubdifMeta>? metaList)
        {
            // if no metaList is provided, the wrap has to have default metadata
            if (metaList == null)
            {
                foreach (var wrap in wTransformed)
                {
                    Assert.IsFalse(wrap.InformationLost);
                    Assert.IsFalse(wrap.Relative);
                    Assert.IsNull(wrap.Original);
                    Assert.IsNull(wrap.wTransformer);
                    Assert.IsNull(wrap.Addresser);
                    Assert.AreEqual(wrap.Siblings.Count, 0);
                }
            }
            // if the specific metadatum is specified in the metaList, it has to equal the wrap metadatum
            else
            {
                Assert.AreEqual(wTransformed.Count, metaList.Count);
                for (int i = 0; i < wTransformed.Count; i++)
                {
                    if (metaList[i].InformationLost != null)
                        Assert.AreEqual(wTransformed[i].InformationLost, metaList[i].InformationLost);
                    if (metaList[i].Relative != null)
                        Assert.AreEqual(wTransformed[i].Relative, metaList[i].Relative);
                    if (metaList[i].Original != null)
                        Assert.IsTrue(wTransformed[i].Original == null || wTransformed[i].Original!.SameAs(metaList[i].Original));
                    if (metaList[i].wTransformer != null)
                        Assert.IsTrue(wTransformed[i].wTransformer == null || wTransformed[i].wTransformer!.SameAs(metaList[i].wTransformer));
                    if (metaList[i].Addresser != null)
                        Assert.IsTrue(wTransformed[i].Addresser == null || wTransformed[i].Addresser!.SameAs(metaList[i].Addresser));
                    if (metaList[i].Siblings != null)
                    {
                        Assert.AreEqual(wTransformed[i].Siblings.Count, metaList[i].Siblings!.Count);
                        for (int j = 0; j < wTransformed[i].Siblings.Count; j++)
                            Assert.AreEqual(wTransformed[i].Siblings[j], metaList[i].Siblings![j]);
                    }
                }
            }
        }

        


        public static void TestLIT(DifTest test)
        {
            var wiDif = test.Dif.Wrap().MakeIndependent();
            var wTransformer = test.Transformer.Wrap();
            var wTransformed = wiDif.LIT(wTransformer);
            var transformed = wTransformed.Unwrap();
            Assert.IsTrue(test.Expected.SameAs(transformed));

            if (test.MetaList != null)
                FitSubdifMetas(test.Dif, wTransformer, wTransformed, test.MetaList);

            AssertSubdifMetaCorrect(wTransformed, test.MetaList);
        }

        public static void TestLITList(List<DifTest> tests)
        {
            tests.ForEach((test) => TestLIT(test));
        }

        public static void TestLET(DifTest test)
        {
            var wiDif = test.Dif.Wrap().MakeIndependent();
            var wTransformer = test.Transformer.Wrap();
            var wTransformed = wiDif.LET(wTransformer);
            var transformed = wTransformed.Unwrap();
            Assert.IsTrue(test.Expected.SameAs(transformed));

            if (test.MetaList != null)
                FitSubdifMetas(test.Dif, wTransformer, wTransformed, test.MetaList);

            AssertSubdifMetaCorrect(wTransformed, test.MetaList);
        }

        public static void TestIndepDep(Dif testDif, List<SubdifMeta>? metaList = null)
        {
            WrappedDif wiDif = testDif.Wrap().MakeIndependent();
            WrappedDif wdDif = wiDif.MakeDependent();
            WrappedDif wdJoinedDif = wdDif.JoinSiblings();
            Dif result = wdJoinedDif.Unwrap();
            Assert.IsTrue(result.SameAs(testDif));

            if (metaList != null)
                FitSubdifMetas(testDif, null, wiDif, metaList);

            AssertSubdifMetaCorrect(wdJoinedDif, metaList);
        }
    }
}
