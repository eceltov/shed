using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;

namespace TextOperations.Operations
{
    internal static class DifCompressionExtensions
    {
        static bool SubdifsTouchOrIntersect(Subdif subdif1, int length1, Subdif subdif2, int length2)
        {
            if (subdif1.Row != subdif2.Row)
                return false;

            return (subdif1.Position >= subdif2.Position && subdif1.Position <= subdif2.Position + length2)
                || (subdif2.Position >= subdif1.Position && subdif2.Position <= subdif1.Position + length1);
        }

        static void RemoveEmptySubdifs(List<Subdif> dif)
        {
            for (int i = 0; i < dif.Count; i++)
            {
                if (dif[i] is Add add)
                {
                    if (add.Content.Length == 0)
                    {
                        dif.RemoveAt(i--);
                    }
                }
                else if (dif[i] is Del del)
                {
                    if (del.Count == 0)
                    {
                        dif.RemoveAt(i--);
                    }
                }
            }
        }

        static List<Subdif> AddAddCompression(Add first, Add second)
        {
            List<Subdif> result = new();

            if (SubdifsTouchOrIntersect(first, first.Content.Length, second, second.Content.Length))
            {
                int minPosition = first.Position < second.Position ? first.Position : second.Position;
                string newString;
                if (first.Position >= second.Position)
                {
                    // the second string will get put before the first one
                    newString = second.Content + first.Content;
                }
                else
                {
                    // the second string will be inserted into the first one
                    int firstSegmentLength = second.Position - first.Position;
                    newString = first.Content[..firstSegmentLength];
                    newString += second.Content;
                    newString += first.Content[firstSegmentLength..];
                }
                result.Add(new Add(first.Row, minPosition, newString));
            }

            return result;
        }

        static List<Subdif> DelDelCompression(Del first, Del second)
        {
            List<Subdif> result = new();

            if (first.Row == second.Row)
            {
                if (first.Position == second.Position)
                {
                    result.Add(new Del(first.Row, first.Position, first.Count + second.Count));
                }
                else if (first.Position > second.Position && second.Position + second.Count >= first.Position)
                {
                    result.Add(new Del(first.Row, second.Position, first.Count + second.Count));
                }
            }

            return result;
        }

        static List<Subdif> AddDelCompression(Add first, Del second)
        {
            List<Subdif> result = new();

            int row = first.Row;
            int posAdd = first.Position;
            string text = first.Content;
            int posDel = second.Position;
            int delRange = second.Count;

            if (first.Row != second.Row)
            {
            }
            // deleting whole add
            else if (posDel <= posAdd && posDel + delRange >= posAdd + text.Length)
            {
                // the del and add start at the same position
                if (posDel == posAdd)
                {
                    // the del exactly deletes the add, both will be removed
                    if (posDel + delRange == posAdd + text.Length)
                    {
                    }
                    // the del is longer than the add
                    else
                    {
                        result.Add(new Del(row, posDel, delRange - posAdd - text.Length));
                    }
                }
                // the del is positioned before the add
                else
                {
                    result.Add(new Del(row, posDel, delRange - text.Length));
                }
            }
            // deleting from the middle (not deleting edges)
            else if (posAdd + text.Length > posDel + delRange && posAdd < posDel)
            {
                string newText = text[..posDel] + text[(posDel + delRange)..];
                result.Add(new Add(row, posAdd, newText));
            }
            // deleting from the left
            else if (posDel <= posAdd && posDel + delRange > posAdd)
            {
                // the del and add start at the same position
                if (posDel == posAdd)
                {
                    string newText = text[delRange..];
                    result.Add(new Add(row, posAdd + delRange, newText));
                }
                // the del starts before the add
                else
                {
                    int overlap = posDel + delRange - posAdd;
                    string newText = text[overlap..];
                    result.Add(new Add(row, posAdd + overlap, newText));
                    result.Add(new Del(row, posDel, delRange - overlap));
                }
            }
            // deleting from the right
            else if (posDel > posAdd && posDel < posAdd + text.Length)
            {
                // the del and add end at the same position
                if (posAdd + text.Length == posDel + delRange)
                {
                    string newText = text[..(text.Length - delRange)];
                    result.Add(new Add(row, posAdd, newText));
                }
                // the del ends after the add
                else
                {
                    int overlap = posAdd + text.Length - posDel;
                    string newText = text[..(text.Length - overlap)];
                    result.Add(new Add(row, posAdd, newText));
                    result.Add(new Del(row, posAdd + newText.Length, delRange - overlap));
                }
            }

            return result;
        }

        static void MergeSubdifs(List<Subdif> dif)
        {
            bool changeOccurred = true;
            while (changeOccurred)
            {
                changeOccurred = false;
                // Count - 1: so that there is a next entry
                for (int i = 0; i < dif.Count - 1; i++)
                {
                    Subdif first = dif[i];
                    Subdif second = dif[i + 1];
                    List<Subdif>? compressionResult = null;

                    // merge adds together
                    if (first is Add add1 && second is Add add2)
                    {
                        compressionResult = AddAddCompression(add1, add2);
                    }
                    // merge dels together
                    else if (first is Del del1 && second is Del del2)
                    {
                        compressionResult = DelDelCompression(del1, del2);
                    }
                    // reduce adds followed by dels
                    else if (first is Add add && second is Del del)
                    {
                        compressionResult = AddDelCompression(add, del);
                    }

                    if (compressionResult != null)
                    {
                        changeOccurred = true;
                        if (compressionResult.Count == 2)
                        {
                            dif[i] = compressionResult[0];
                            dif[i + 1] = compressionResult[1];
                            if (i > 0)
                            {
                                i -= 2; // move back so that the previous subdif can be compressed against the new add
                            }
                        }
                        else if (compressionResult.Count == 1)
                        {
                            dif.RemoveAt(i);
                            dif[i] = compressionResult[0];
                            i -= (i > 0 ? 2 : 1);
                        }
                        // both subdifs got removed
                        else if (compressionResult.Count == 0)
                        {
                            dif.RemoveRange(i, 2);
                            i -= 1;
                        }
                        else
                        {
                            throw new InvalidOperationException("Error: MergeSubdifs: Invalid element count in compressionResult.");
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Creates a new dif that has the same effects as the input dif but is compressed.
        /// </summary>
        /// <param name="dif">The dif to be compressed.</param>
        /// <returns>Compressed dif.</returns>
        public static List<Subdif> Compress(this List<Subdif> dif)
        {
            List<Subdif> copy = dif.DeepCopy();
            RemoveEmptySubdifs(copy);
            MergeSubdifs(copy);
            return copy;
        }
    }
}
