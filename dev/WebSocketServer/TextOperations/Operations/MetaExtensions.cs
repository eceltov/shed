using TextOperations.Types;

namespace TextOperations.Operations
{
    internal static class MetaExtensions
    {
        public static SubdifWrap SaveLI(this SubdifWrap wrap, SubdifWrap wTransformer)
        {
            // An Add and Newline with LI will still add its content to the document (all of the content)
            // A Del with LI can have Count == 0, meaning that it should be ignored for the purposes of
            //      application of the deletion to the document (as it could reference a non-existing row)
            // A Remline with LI has to have no effect on the document and should be ignored (when applying
            //      changes to the document)
            wrap.InformationLost = true;
            wrap.Original = wrap.Sub.Copy();
            wrap.wTransformer = wTransformer.Copy();
            return wrap;
        }

        public static SubdifWrap SaveRA(this SubdifWrap wrap, SubdifWrap addresser)
        {
            wrap.Relative = true;
            wrap.Addresser = addresser;
            return wrap;
        }

        public static SubdifWrap SaveSibling(this SubdifWrap wrap, SubdifWrap sibling)
        {
            wrap.Siblings.Add(sibling.ID);
            return wrap;
        }

        public static bool CheckRA(this SubdifWrap wrap)
        {
            return wrap.Relative;
        }

        public static bool CheckLI(this SubdifWrap wrap, SubdifWrap wTransformer)
        {
            if (!wrap.InformationLost)
                return false;

            return wrap.wTransformer!.ID == wTransformer.ID;
        }

        public static SubdifWrap RecoverLI(this SubdifWrap wrap)
        {
            wrap.InformationLost = false;
            wrap.Sub = wrap.Original!;
            return wrap;
        }

        public static bool CheckBO(this SubdifWrap wrap, SubdifWrap wTransformer)
        {
            return wrap.Addresser!.ID == wTransformer.ID;
        }

        /// <param name="wrap">The wrap to be converted.</param>
        /// <param name="wAddresser">The wrapped addresser of the wrap.</param>
        /// <returns>Returns the wrap that had been converted from relative addressing to absolute.</returns>
        public static SubdifWrap ConvertAA(this SubdifWrap wrap, SubdifWrap wAddresser)
        {
            if (wrap.Sub is Add || wrap.Sub is Del)
            {
                if (wAddresser.Sub is Add || wAddresser.Sub is Del)
                {
                    // add the position of the addresser to the relative offset of the wrap
                    wrap.Sub.Row = wAddresser.Sub.Row;
                    wrap.Sub.Position += wAddresser.Sub.Position;
                    wrap.Relative = false;
                    wrap.Addresser = null;
                }
                else if (wAddresser.Sub is Newline)
                {
                    wrap.Sub.Row = wAddresser.Sub.Row;
                    wrap.Sub.Position += wAddresser.Sub.Position;
                    wrap.Relative = false;
                    wrap.Addresser = null;
                }
                else
                {
                    ///TODO: Conversion not implemented
                }
            }
            else if (wrap.Sub is Newline)
            {
                if (wAddresser.Sub is Add)
                {
                    wrap.Sub.Row = wAddresser.Sub.Row;
                    wrap.Sub.Position += wAddresser.Sub.Position;
                    wrap.Relative = false;
                    wrap.Addresser = null;
                }
                else if (wAddresser.Sub is Newline)
                {
                    wrap.Sub.Row = wAddresser.Sub.Row;
                    wrap.Sub.Position += wAddresser.Sub.Position;
                    wrap.Relative = false;
                    wrap.Addresser = null;
                }
                else
                {
                    ///TODO: Conversion not implemented
                }
            }
            else if (wrap.Sub is Remline)
            {
                if (wAddresser.Sub is Newline)
                {
                    wrap.Sub.Row = wAddresser.Sub.Row;
                    wrap.Sub.Position += wAddresser.Sub.Position;
                    wrap.Relative = false;
                    wrap.Addresser = null;
                }
                else
                {
                    ///TODO: Conversion not implemented
                }
            }
            else
            {
                throw new InvalidOperationException("Unknown addresser in convertAA!");
            }
            return wrap;
        }

        /// <summary>
        /// Recursively joins all siblings of the first element.
        /// </summary>
        /// <param name="wSlice">A wDif slice, where the first element has siblings.</param>
        /// <returns>Returns a joined wDif.</returns>
        static SubdifWrap InternalJoinSiblings(List<SubdifWrap> wSlice)
        {
            SubdifWrap wMain = wSlice[0];
            List<SubdifWrap> wSiblings = new();
            var siblingIDs = wMain.Siblings;
            int i = 1;
            while (siblingIDs.Count > 0)
            {
                SubdifWrap wrap = wSlice[i];
                // check if wrap is sibling
                if (siblingIDs.Contains(wrap.ID))
                {
                    // siblings will be defined, because this sibling could not be consumed yet
                    if (wrap.Siblings.Count > 0)
                    {
                        List<SubdifWrap> wNewSlice = wSlice.Skip(i).ToList();
                        // join any nested siblings, making this have no more siblings
                        InternalJoinSiblings(wNewSlice);
                    }
                    wSiblings.Add(wrap);
                    siblingIDs.RemoveAt(siblingIDs.IndexOf(wrap.ID));
                }
                i++;
            }

            List<Subdif> dif = new();
            dif.Add(wMain.Sub);
            foreach (var wSibling in wSiblings)
            {
                dif.Add(wSibling.Sub);
                wSibling.Siblings = new();
                wSibling.ConsumedSibling = true;

                // siblings should not have lost information or be relative, because they will be deleted
                if (wSibling.InformationLost || wSibling.Relative)
                {
                    throw new InvalidOperationException("Error: InternalJoinSiblings: A sibling lost information or is relative.");
                }
            }

            List<Subdif> compressed = dif.Compress();
            if (compressed.Count != 1)
            {
                throw new InvalidOperationException("Error: InternalJoinSiblings: The length of joined siblings is not 1.");
            }
            wMain.Sub = compressed[0];
            return wMain;
        }

        public static List<SubdifWrap> JoinSiblings(this List<SubdifWrap> wDif)
        {
            List<SubdifWrap> wNewDif = new();
            for (int i = 0; i < wDif.Count; i++)
            {
                SubdifWrap wrap = wDif[i];
                // consumed siblings will have their ConsumedSibling attribute set to true
                if (!wrap.ConsumedSibling)
                {
                    List<int> siblings = wrap.Siblings;
                    if (siblings.Count > 0)
                    {
                        ///TODO: this differs from the js implementation
                        ///TODO: slicing the list may be too slow
                        wrap = InternalJoinSiblings(wDif.GetRange(i, wDif.Count - i));
                    }
                    wNewDif.Add(wrap);
                }
            }

            return wNewDif;
        }
    }
}
