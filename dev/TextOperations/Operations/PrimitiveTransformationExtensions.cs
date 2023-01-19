using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;

namespace TextOperations.Operations
{
    internal static class PrimitiveTransformationExtensions
    {
        static SubdifWrap IT_AA(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Add transformer = (Add)wTransformer.Sub;
            if (wrap.Sub.Row != transformer.Row) return wrap;
            if (wrap.Sub.Position < transformer.Position) return wrap;
            wrap.Sub.Position += transformer.Content.Length;
            return wrap;
        }

        static SubdifWrap IT_AD(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Del transformer = (Del)wTransformer.Sub;
            if (wrap.Sub.Row != transformer.Row) return wrap;
            if (wrap.Sub.Position <= transformer.Position) return wrap;
            if (wrap.Sub.Position > transformer.Position + transformer.Count)
            {
                wrap.Sub.Position -= transformer.Count;
            }
            else
            {
                wrap.SaveLI(wTransformer);
                wrap.Sub.Position = transformer.Position;
            }
            return wrap;
        }

        static SubdifWrap IT_AN(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Newline transformer = (Newline)wTransformer.Sub;
            if (transformer.Row < wrap.Sub.Row)
            {
                wrap.Sub.Row++;
            }
            // the line was split before the add position
            else if (wrap.Sub.Row == transformer.Row && transformer.Position <= wrap.Sub.Position)
            {
                wrap.Sub.Row++;
                wrap.Sub.Position -= transformer.Position;
            }
            return wrap;
        }

        static SubdifWrap IT_AR(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            // case when the remline is disabled
            if (wTransformer.InformationLost)
            {
                return wrap;
            }
            Remline transformer = (Remline)wTransformer.Sub;
            if (transformer.Row < wrap.Sub.Row - 1)
            {
                wrap.Sub.Row--;
            }
            else if (transformer.Row == wrap.Sub.Row - 1)
            {
                wrap.Sub.Row--;
                wrap.Sub.Position += transformer.Position;
            }
            else if (transformer.Row == wrap.Sub.Row)
            {
                throw new NotImplementedException("IT_AR not implemented.");
                /**
                 * In order to preserve the intention of adding characters,
                   a new line has to be added and those characters will be added here.
                  * Note that those character may not make semantically sense, if they were
                    to be inserted in another set of characters that were deleted.
                  */
                /**
                 * Another idea is to do nothing, the remline was first, therefore the add might end up wrong
                 */
                /// TODO: implement this
            }
            return wrap;
        }

        static List<SubdifWrap> IT_DA(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Del subdif = (Del)wrap.Sub;
            Add transformer = (Add)wTransformer.Sub;
            if (subdif.Row != transformer.Row) return new List<SubdifWrap> { wrap };
            if (transformer.Position >= subdif.Position + subdif.Count) return new List<SubdifWrap> { wrap };
            if (subdif.Position >= transformer.Position)
            {
                wrap.Sub.Position += transformer.Content.Length;
                return new List<SubdifWrap> { wrap };
            }

            List<SubdifWrap> wraps = new() {
                new Del(
                    subdif.Row,
                    subdif.Position,
                    transformer.Position - subdif.Position)
                .Wrap(wrap.ID, wrap.Siblings),
                new Del(
                    subdif.Row,
                    transformer.Position + transformer.Content.Length,
                    subdif.Count - (transformer.Position - subdif.Position))
                .Wrap()

            };
            wraps[0].SaveSibling(wraps[1]);
            return wraps;
        }

        static SubdifWrap IT_DD(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Del subdif = (Del)wrap.Sub;
            Del transformer = (Del)wTransformer.Sub;
            if (subdif.Row != transformer.Row) return wrap;
            if (transformer.Position >= wrap.Sub.Position + subdif.Count) return wrap;
            if (wrap.Sub.Position >= transformer.Position + transformer.Count)
            {
                wrap.Sub = new Del(wrap.Sub.Row, wrap.Sub.Position - transformer.Count, subdif.Count);
            }
            else
            {
                wrap.SaveLI(wTransformer);
                if (
                  transformer.Position <= subdif.Position
                  && wrap.Sub.Position + subdif.Count <= transformer.Position + transformer.Count
                )
                {
                    wrap.Sub = new Del(wrap.Sub.Row, wrap.Sub.Position, 0);
                }
                else if (
                  transformer.Position <= wrap.Sub.Position
                  && wrap.Sub.Position + subdif.Count > transformer.Position + transformer.Count
                )
                {
                    wrap.Sub = new Del(
                      wrap.Sub.Row, transformer.Position, wrap.Sub.Position + subdif.Count - (transformer.Position + transformer.Count)
                    );
                }
                else if (
                  transformer.Position > wrap.Sub.Position
                  && transformer.Position + transformer.Count >= wrap.Sub.Position + subdif.Count
                )
                {
                    wrap.Sub = new Del(wrap.Sub.Row, wrap.Sub.Position, transformer.Position - wrap.Sub.Position);
                }
                else
                {
                    wrap.Sub = new Del(wrap.Sub.Row, wrap.Sub.Position, subdif.Count - transformer.Count);
                }
            }
            return wrap;
        }

        static List<SubdifWrap> IT_DN(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Del subdif = (Del)wrap.Sub;
            Newline transformer = (Newline)wTransformer.Sub;

            if (transformer.Row < wrap.Sub.Row)
            {
                subdif.Row++;
                return new() { wrap };
            }
            if (subdif.Row == transformer.Row)
            {
                if (transformer.Position <= subdif.Position)
                {
                    subdif.Row++;
                    subdif.Position -= transformer.Position;
                    return new() { wrap };
                }
                if (transformer.Position > subdif.Position && transformer.Position < subdif.Position + subdif.Count)
                {
                    List<SubdifWrap> wraps = new() {
                        new Del(
                            subdif.Row,
                            subdif.Position,
                            transformer.Position - subdif.Position)
                        .Wrap( wrap.ID, wrap.Siblings),
                        new Del(
                            subdif.Row + 1,
                            0,
                            subdif.Count - (transformer.Position - subdif.Position))
                        .Wrap(),

                    };
                    wraps[0].SaveSibling(wraps[1]);
                    return wraps;
                }
            }

            return new() { wrap };
        }

        static SubdifWrap IT_DR(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Del subdif = (Del)wrap.Sub;
            Remline transformer = (Remline)wTransformer.Sub;
            // case when the remline is disabled
            if (wTransformer.InformationLost)
            {
                return wrap;
            }
            if (transformer.Row < subdif.Row - 1)
            {
                subdif.Row--;
            }
            else if (transformer.Row == subdif.Row - 1)
            {
                subdif.Row--;
                subdif.Position += transformer.Position;
            }
            else if (transformer.Row == subdif.Row && subdif.Position + subdif.Count > transformer.Position)
            {
                /**
                 * The user tries to delete characters that no longer exist,
                   therefore his intention was fulfilled by someone else and
                    the deletion can be removed.
                  */
                /// TODO: check if the empty del does not corrupt the algorithm
                wrap.Sub = new Del(0, 0, 0);
            }
            return wrap;
        }

        static SubdifWrap IT_NA(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Newline subdif = (Newline)wrap.Sub;
            Add transformer = (Add)wTransformer.Sub;
            if (subdif.Row == transformer.Row && transformer.Position <= subdif.Position)
            {
                subdif.Position += transformer.Content.Length;
            }
            return wrap;
        }

        static SubdifWrap IT_ND(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Newline subdif = (Newline)wrap.Sub;
            Del transformer = (Del)wTransformer.Sub;
            if (subdif.Row == transformer.Row)
            {
                if (transformer.Position < subdif.Position && transformer.Position + transformer.Count >= subdif.Position)
                {
                    if (transformer.Position + transformer.Count > subdif.Position)
                    {
                        wrap.SaveLI(wTransformer);
                    }
                    subdif.Position = transformer.Position; // the line will break at the start of the del
                }
                else if (transformer.Position + transformer.Count < subdif.Position)
                {
                    subdif.Position -= transformer.Count; // subtract the length of the del
                }
            }
            return wrap;
        }

        static SubdifWrap IT_NN(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Newline subdif = (Newline)wrap.Sub;
            Newline transformer = (Newline)wTransformer.Sub;
            if (transformer.Row < subdif.Row)
            {
                subdif.Row++;
            }
            else if (subdif.Row == transformer.Row && transformer.Position <= subdif.Position)
            {
                subdif.Row++;
                subdif.Position -= transformer.Position;
            }
            return wrap;
        }

        static SubdifWrap IT_NR(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Newline subdif = (Newline)wrap.Sub;
            Remline transformer = (Remline)wTransformer.Sub;
            // case when the remline is disabled
            if (wTransformer.InformationLost)
            {
                return wrap;
            }
            if (transformer.Row < subdif.Row - 1)
            {
                subdif.Row--;
            }
            else if (transformer.Row == subdif.Row - 1)
            {
                subdif.Row--;
                subdif.Position += transformer.Position;
            }
            else if (transformer.Row == subdif.Row)
            {
                /**
                 * Leaving the newline as is should result in both operations canceling themselves out
                 */
            }
            return wrap;
        }

        static SubdifWrap IT_RA(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Remline subdif = (Remline)wrap.Sub;
            Add transformer = (Add)wTransformer.Sub;
            // case when the remline is disabled
            if (wrap.InformationLost)
            {
                return wrap;
            }
            if (subdif.Row == transformer.Row)
            {
                // disable the remline
                // saveLI(wrap, wTransformer);
                /// TODO: make sure that the remline should not be disabled

                // move the position so that it will again be on the end of the row
                subdif.Position += transformer.Content.Length;
            }
            return wrap;
        }

        static SubdifWrap IT_RD(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Remline subdif = (Remline)wrap.Sub;
            Del transformer = (Del)wTransformer.Sub;
            // case when the remline is disabled
            if (wrap.InformationLost)
            {
                return wrap;
            }
            if (subdif.Row == transformer.Row)
            {
                // it is assumed that the del is valid and will always delete characters
                // move the position so that it will again be on the end of the row
                subdif.Position -= transformer.Count;
            }
            return wrap;
        }

        static SubdifWrap IT_RN(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Remline subdif = (Remline)wrap.Sub;
            Newline transformer = (Newline)wTransformer.Sub;
            // case when the remline is disabled
            if (wrap.InformationLost)
            {
                return wrap;
            }
            if (transformer.Row < subdif.Row)
            {
                subdif.Row++;
            }
            else if (transformer.Row == subdif.Row)
            {
                if (transformer.Position > subdif.Position)
                {
                    Console.WriteLine("Error: IT_RN: Newline is on a bigger position than the remline.");
                }
                else
                {
                    subdif.Row++;
                    subdif.Position -= transformer.Position;
                }
            }
            return wrap;
        }

        static SubdifWrap IT_RR(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Remline subdif = (Remline)wrap.Sub;
            Remline transformer = (Remline)wTransformer.Sub;
            // case when the remline is disabled
            if (wTransformer.InformationLost || wrap.InformationLost)
            {
                return wrap;
            }
            if (transformer.Row < subdif.Row - 1)
            {
                subdif.Row--;
            }
            else if (transformer.Row == subdif.Row - 1)
            {
                subdif.Row--;
                subdif.Position += transformer.Position;
            }
            else if (transformer.Row == subdif.Row)
            {
                /**
                     * Trying to delete a row that already had been deleted. The intention was
                       fulfilled by someone else, therefore the subdif may be omitted.
                     */
                /// TODO: not sure if this is the right way to disable a remline
                wrap.SaveLI(wTransformer);
            }
            return wrap;
        }

        static SubdifWrap ET_AA(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Add subdif = (Add)wrap.Sub;
            Add transformer = (Add)wTransformer.Sub;
            if (subdif.Row != transformer.Row) return wrap;
            // equality removed because of the
            // IT(ET([0, 0, '3'], [0, 0, '2']), [0, 0, '2']) => [0, 0, '3'] example
            if (subdif.Position < transformer.Position) return wrap;
            if (subdif.Position >= transformer.Position + transformer.Content.Length)
            {
                subdif.Position -= transformer.Content.Length;
            }
            else
            {
                subdif.Position -= transformer.Position;
                wrap.SaveRA(wTransformer);
            }
            return wrap;
        }

        static SubdifWrap ET_AD(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Add subdif = (Add)wrap.Sub;
            Del transformer = (Del)wTransformer.Sub;
            if (subdif.Row != transformer.Row) return wrap;
            if (wrap.CheckLI(wTransformer))
            {
                wrap.RecoverLI();
            }
            else if (subdif.Position <= transformer.Position) return wrap;
            else
            {
                subdif.Position += transformer.Count;
            }
            return wrap;
        }

        static SubdifWrap ET_AN(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Add subdif = (Add)wrap.Sub;
            Newline transformer = (Newline)wTransformer.Sub;
            if (transformer.Row < subdif.Row - 1)
            {
                subdif.Row--;
            }
            // the add is on the line made by the newline
            else if (transformer.Row == subdif.Row - 1)
            {
                subdif.Row--;
                subdif.Position += transformer.Position;
            }
            // the add was added to the new empty space created on the original row
            else if (transformer.Row == subdif.Row && transformer.Position == subdif.Position)
            {
                // the add is relative to the newline, otherwise including the newline would push the add to the
                // next row
                wrap.SaveRA(wTransformer);
                subdif.Position = 0;
            }
            return wrap;
        }

        static SubdifWrap ET_AR(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Add subdif = (Add)wrap.Sub;
            Remline transformer = (Remline)wTransformer.Sub;
            // case when the remline is disabled
            if (wTransformer.InformationLost)
            {
                return wrap;
            }
            if (transformer.Row < subdif.Row)
            {
                subdif.Row++;
            }
            // case when the add was part of the text on the removed line
            else if (subdif.Row == transformer.Row && transformer.Position <= subdif.Position)
            {
                subdif.Row++;
                subdif.Position -= transformer.Position;
            }
            return wrap;
        }

        static List<SubdifWrap> ET_DA(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Del subdif = (Del)wrap.Sub;
            Add transformer = (Add)wTransformer.Sub;
            if (subdif.Row != transformer.Row) return new() { wrap };
            if (subdif.Position + subdif.Count <= transformer.Position) return new() { wrap };
            if (subdif.Position >= transformer.Position + transformer.Content.Length)
            {
                subdif.Position -= transformer.Content.Length;
            }
            else if (
              transformer.Position <= subdif.Position
              && subdif.Position + subdif.Count <= transformer.Position + transformer.Content.Length
            )
            {
                subdif.Position -= transformer.Position;
                wrap.SaveRA(wTransformer);
            }
            else if (
              transformer.Position <= subdif.Position
              && subdif.Position + subdif.Count > transformer.Position + transformer.Content.Length
            )
            {
                SubdifWrap delWrap1 = new Del(
                    subdif.Row,
                    subdif.Position - transformer.Position,
                    transformer.Position + transformer.Content.Length - subdif.Position)
                .Wrap(wrap.ID, wrap.Siblings);
                SubdifWrap delWrap2 = new Del(
                    subdif.Row,
                    transformer.Position,
                    subdif.Position + subdif.Count - transformer.Position - transformer.Content.Length)
                .Wrap();
                delWrap1.SaveRA(wTransformer);
                delWrap1.SaveSibling(delWrap2);
                return new() { delWrap1, delWrap2 };
            }
            else if (
              transformer.Position > subdif.Position
              && transformer.Position + transformer.Content.Length <= subdif.Position + subdif.Count
            )
            {
                SubdifWrap delWrap1 = new Del(
                    subdif.Row, 0, transformer.Content.Length)
                .Wrap(wrap.ID, wrap.Siblings);
                SubdifWrap delWrap2 = new Del(
                    subdif.Row, subdif.Position, subdif.Count - transformer.Content.Length)
                .Wrap();
                delWrap1.SaveRA(wTransformer);
                delWrap1.SaveSibling(delWrap2);
                return new() { delWrap1, delWrap2 };
            }
            else
            {
                SubdifWrap delWrap1 = new Del(
                    subdif.Row, 0, subdif.Position + subdif.Count - transformer.Position)
                .Wrap(wrap.ID, wrap.Siblings);
                SubdifWrap delWrap2 = new Del(
                    subdif.Row, subdif.Position, transformer.Position - subdif.Position)
                .Wrap();
                delWrap1.SaveRA(wTransformer);
                delWrap1.SaveSibling(delWrap2);
                return new() { delWrap1, delWrap2 };
            }
            return new() { wrap };
        }

        static List<SubdifWrap> ET_DD(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Del subdif = (Del)wrap.Sub;
            Del transformer = (Del)wTransformer.Sub;
            if (subdif.Row != transformer.Row) return new() { wrap };
            if (wrap.CheckLI(wTransformer))
            {
                wrap.RecoverLI();
            }
            else if (transformer.Position >= subdif.Position + subdif.Count) return new() { wrap };
            else if (subdif.Position >= transformer.Position)
            {
                subdif.Position += transformer.Count;
            }
            else
            {
                SubdifWrap delWrap1 = new Del(
                    subdif.Row, subdif.Position, transformer.Position - subdif.Position)
                .Wrap(wrap.ID, wrap.Siblings);
                SubdifWrap delWrap2 = new Del(
                    subdif.Row, transformer.Position + transformer.Count, subdif.Position + subdif.Count - transformer.Position)
                .Wrap();
                delWrap1.SaveSibling(delWrap2);
                return new() { delWrap1, delWrap2 };
            }
            return new() { wrap };
        }

        static SubdifWrap ET_DN(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Del subdif = (Del)wrap.Sub;
            Newline transformer = (Newline)wTransformer.Sub;
            if (transformer.Row < subdif.Row - 1)
            {
                subdif.Row--;
            }
            else if (transformer.Row == subdif.Row - 1)
            {
                subdif.Row--;
                subdif.Position += transformer.Position;
            }
            // nothing has to be done if the del and newline are on the same row,
            // because the only dels that moved are on the next line and only those need
            // to be transformed
            return wrap;
        }

        static List<SubdifWrap> ET_DR(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Del subdif = (Del)wrap.Sub;
            Remline transformer = (Remline)wTransformer.Sub;
            // case when the remline is disabled
            if (wTransformer.InformationLost)
            {
                return new() { wrap };
            }
            if (transformer.Row < subdif.Row)
            {
                subdif.Row++;
            }
            // case when the del was part of the text on the removed line
            else if (subdif.Row == transformer.Row && transformer.Position <= subdif.Position)
            {
                subdif.Row++;
                subdif.Position -= transformer.Position;
            }
            // case when the removed remline splits the del
            else if (subdif.Row == transformer.Row
              && subdif.Position < transformer.Position
              && subdif.Position + subdif.Count > transformer.Position
            )
            {
                SubdifWrap delWrap1 = new Del(
                    subdif.Row, subdif.Position, transformer.Position - subdif.Position)
                .Wrap(wrap.ID, wrap.Siblings);
                SubdifWrap delWrap2 = new Del(
                    subdif.Row + 1, 0, subdif.Position + subdif.Count - transformer.Position)
                .Wrap();
                delWrap1.SaveSibling(delWrap2);
                return new() { delWrap1, delWrap2 };
            }
            return new() { wrap };
        }

        static SubdifWrap ET_NA(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Newline subdif = (Newline)wrap.Sub;
            Add transformer = (Add)wTransformer.Sub;
            if (subdif.Row == transformer.Row)
            {
                /// TODO: should that inequality be sharp instead (like in ET_AA)?
                // case when the whole add is in front of the newline
                if (transformer.Position + transformer.Content.Length <= subdif.Position)
                {
                    subdif.Position -= transformer.Content.Length;
                }
                // case when the newline is in the middle of the add, relative addressing needs to be used
                else if (
                  transformer.Position <= subdif.Position
                  && transformer.Position + transformer.Content.Length > subdif.Position
                )
                {
                    wrap.SaveRA(wTransformer);
                    subdif.Position -= transformer.Position;
                }
            }
            return wrap;
        }

        static SubdifWrap ET_ND(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Newline subdif = (Newline)wrap.Sub;
            Del transformer = (Del)wTransformer.Sub;
            if (wrap.CheckLI(wTransformer))
            {
                wrap.RecoverLI();
            }
            /// TODO: should the inequality be sharp?
            else if (subdif.Row == transformer.Row && transformer.Position < subdif.Position)
            {
                subdif.Position += transformer.Count;
            }
            return wrap;
        }

        static SubdifWrap ET_NN(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Newline subdif = (Newline)wrap.Sub;
            Newline transformer = (Newline)wTransformer.Sub;
            if (transformer.Row < subdif.Row - 1)
            {
                subdif.Row--;
            }
            else if (transformer.Row == subdif.Row - 1)
            {
                subdif.Row--;
                subdif.Position += transformer.Position;
            }
            // the newline was added to the new empty space created on the original row
            else if (transformer.Row == subdif.Row && transformer.Position == subdif.Position)
            {
                // the wrap is relative to the transformer, otherwise including the transformer would push
                // the wrap to the next row
                wrap.SaveRA(wTransformer);
                subdif.Position = 0;
            }
            return wrap;
        }

        static SubdifWrap ET_NR(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Newline subdif = (Newline)wrap.Sub;
            Remline transformer = (Remline)wTransformer.Sub;
            // case when the remline is disabled
            if (wTransformer.InformationLost)
            {
                return wrap;
            }
            if (transformer.Row < subdif.Row)
            {
                subdif.Row++;
            }
            // case when the newline was part of the text on the removed line
            else if (subdif.Row == transformer.Row && transformer.Position <= subdif.Position)
            {
                subdif.Row++;
                subdif.Position -= transformer.Position;
            }
            return wrap;
        }

        static SubdifWrap ET_RA(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Remline subdif = (Remline)wrap.Sub;
            Add transformer = (Add)wTransformer.Sub;
            // case when the remline is disabled
            if (wrap.InformationLost)
            {
                return wrap;
            }
            if (subdif.Row == transformer.Row)
            {
                // the remline is dependent on the add, therefore it has to be positioned before the remline
                // move the position so that it will again be on the end of the row
                subdif.Position -= transformer.Content.Length;
            }
            return wrap;
        }

        static SubdifWrap ET_RD(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Remline subdif = (Remline)wrap.Sub;
            Del transformer = (Del)wTransformer.Sub;
            // case when the remline is disabled
            if (wrap.InformationLost)
            {
                return wrap;
            }
            if (subdif.Row == transformer.Row)
            {
                // the remline is dependent on the add, therefore it has to be positioned before the remline
                // move the position so that it will again be on the end of the row
                subdif.Position += transformer.Count;
            }
            return wrap;
        }

        static SubdifWrap ET_RN(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Remline subdif = (Remline)wrap.Sub;
            Newline transformer = (Newline)wTransformer.Sub;
            // case when the remline is disabled
            if (wrap.InformationLost)
            {
                return wrap;
            }
            if (transformer.Row < subdif.Row - 1)
            {
                subdif.Row--;
            }
            else if (transformer.Row == subdif.Row - 1)
            {
                subdif.Row--;
                subdif.Position += transformer.Position;
            }
            // the remline makes sense only in combination with the newline, it has to be made relative
            else if (transformer.Row == subdif.Row)
            {
                wrap.SaveRA(wTransformer);
            }
            return wrap;
        }


        static SubdifWrap ET_RR(SubdifWrap wrap, SubdifWrap wTransformer)
        {
            Remline subdif = (Remline)wrap.Sub;
            Remline transformer = (Remline)wTransformer.Sub;
            // case when the remline is disabled
            if (wrap.CheckLI(wTransformer))
            {
                wrap.RecoverLI();
                return wrap;
            }
            if (wTransformer.InformationLost || wrap.InformationLost)
            {
                return wrap;
            }
            if (transformer.Row < subdif.Row)
            {
                subdif.Row++;
            }
            // the positional check is not done here because the wrap needs to be part of the text
            // of the deleted row, else it would not be dependent on the transformer
            else if (subdif.Row == transformer.Row)
            {
                subdif.Row++;
                subdif.Position -= transformer.Position;
            }
            return wrap;
        }

        public static List<SubdifWrap> IT(this SubdifWrap wrap, SubdifWrap wTransformer)
        {
            List<SubdifWrap> transformedWraps = new();
            if (wrap.Sub is Add)
            {
                if (wTransformer.Sub is Add) transformedWraps.Add(IT_AA(wrap, wTransformer));
                else if (wTransformer.Sub is Del) transformedWraps.Add(IT_AD(wrap, wTransformer));
                else if (wTransformer.Sub is Newline) transformedWraps.Add(IT_AN(wrap, wTransformer));
                else if (wTransformer.Sub is Remline) transformedWraps.Add(IT_AR(wrap, wTransformer));
            }
            else if (wrap.Sub is Del)
            {
                if (wTransformer.Sub is Add)
                {
                    foreach (SubdifWrap newWrap in IT_DA(wrap, wTransformer))
                        transformedWraps.Add(newWrap);
                }
                else if (wTransformer.Sub is Del) transformedWraps.Add(IT_DD(wrap, wTransformer));
                else if (wTransformer.Sub is Newline)
                {
                    foreach (SubdifWrap newWrap in IT_DN(wrap, wTransformer))
                        transformedWraps.Add(newWrap);
                }
                else if (wTransformer.Sub is Remline) transformedWraps.Add(IT_DR(wrap, wTransformer));
            }
            else if (wrap.Sub is Newline)
            {
                if (wTransformer.Sub is Add) transformedWraps.Add(IT_NA(wrap, wTransformer));
                else if (wTransformer.Sub is Del) transformedWraps.Add(IT_ND(wrap, wTransformer));
                else if (wTransformer.Sub is Newline) transformedWraps.Add(IT_NN(wrap, wTransformer));
                else if (wTransformer.Sub is Remline) transformedWraps.Add(IT_NR(wrap, wTransformer));
            }
            else if (wrap.Sub is Remline)
            {
                if (wTransformer.Sub is Add) transformedWraps.Add(IT_RA(wrap, wTransformer));
                else if (wTransformer.Sub is Del) transformedWraps.Add(IT_RD(wrap, wTransformer));
                else if (wTransformer.Sub is Newline) transformedWraps.Add(IT_RN(wrap, wTransformer));
                else if (wTransformer.Sub is Remline) transformedWraps.Add(IT_RR(wrap, wTransformer));
            }

            return transformedWraps;
        }

        public static List<SubdifWrap> ET(this SubdifWrap wrap, SubdifWrap wTransformer)
        {
            List<SubdifWrap> transformedWraps = new();
            if (wrap.Sub is Add)
            {
                if (wTransformer.Sub is Add) transformedWraps.Add(ET_AA(wrap, wTransformer));
                else if (wTransformer.Sub is Del) transformedWraps.Add(ET_AD(wrap, wTransformer));
                else if (wTransformer.Sub is Newline) transformedWraps.Add(ET_AN(wrap, wTransformer));
                else if (wTransformer.Sub is Remline) transformedWraps.Add(ET_AR(wrap, wTransformer));
            }
            else if (wrap.Sub is Del)
            {
                if (wTransformer.Sub is Add)
                {
                    foreach (SubdifWrap newWrap in ET_DA(wrap, wTransformer))
                        transformedWraps.Add(newWrap);
                }
                else if (wTransformer.Sub is Del)
                {
                    foreach (SubdifWrap newWrap in ET_DD(wrap, wTransformer))
                        transformedWraps.Add(newWrap);
                }
                else if (wTransformer.Sub is Newline) transformedWraps.Add(ET_DN(wrap, wTransformer));
                else if (wTransformer.Sub is Remline)
                {
                    foreach (SubdifWrap newWrap in ET_DR(wrap, wTransformer))
                        transformedWraps.Add(newWrap);
                }
            }
            else if (wrap.Sub is Newline)
            {
                if (wTransformer.Sub is Add) transformedWraps.Add(ET_NA(wrap, wTransformer));
                else if (wTransformer.Sub is Del) transformedWraps.Add(ET_ND(wrap, wTransformer));
                else if (wTransformer.Sub is Newline) transformedWraps.Add(ET_NN(wrap, wTransformer));
                else if (wTransformer.Sub is Remline) transformedWraps.Add(ET_NR(wrap, wTransformer));
            }
            else if (wrap.Sub is Remline)
            {
                if (wTransformer.Sub is Add) transformedWraps.Add(ET_RA(wrap, wTransformer));
                else if (wTransformer.Sub is Del) transformedWraps.Add(ET_RD(wrap, wTransformer));
                else if (wTransformer.Sub is Newline) transformedWraps.Add(ET_RN(wrap, wTransformer));
                else if (wTransformer.Sub is Remline) transformedWraps.Add(ET_RR(wrap, wTransformer));
            }

            return transformedWraps;
        }
    }
}
