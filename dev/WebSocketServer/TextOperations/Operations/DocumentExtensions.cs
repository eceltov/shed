using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;

namespace TextOperations.Operations
{
    internal static class DocumentExtensions
    {
        public static void ApplyDif(this List<string> document, List<SubdifWrap> wDif)
        {
            foreach (SubdifWrap wrap in wDif)
            {
                Subdif subdif = wrap.Sub;
                if (subdif is Add add)
                {
                    string row = document[add.Row];
                    document[add.Row] = row[..add.Position] + add.Content + row[add.Position..];
                }
                else if (subdif is Del del && del.Count > 0)
                {
                    string row = document[del.Row];
                    document[del.Row] = row[..del.Position] + row[(del.Position + del.Count)..];
                }
                else if (subdif is Newline newline)
                {
                    string prefix = document[newline.Row][..newline.Position];
                    string trailingText = document[newline.Row][newline.Position..];
                    document[newline.Row] = prefix;
                    document.Insert(newline.Row + 1, trailingText);
                }
                else if (subdif is Remline remline && !wrap.InformationLost)
                {
                    document[remline.Row] += document[remline.Row + 1];
                    document.RemoveAt(remline.Row + 1);
                }
                else if (subdif is Del del2 && del2.Count <= 0)
                {
                    // do nothing
                }
                else if (subdif is Remline && wrap.InformationLost)
                {
                    // do nothing
                }
                else
                {
                    throw new InvalidOperationException("Error: ApplyDif: Received unknown subdif.");
                }
            }
        }

        public static void UndoDif(this List<string> document, List<SubdifWrap> wDif)
        {
            var wDifCopy = wDif.DeepCopy();
            wDifCopy.Reverse(); // subdifs need to be undone in reverse order
            foreach (SubdifWrap wrap in wDifCopy)
            { 
                Subdif subdif = wrap.Sub;
                if (subdif is Add add)
                {
                    string row = document[add.Row];
                    document[add.Row] = row[..add.Position] + row[(add.Position + add.Content.Length)..];
                }
                else if (subdif is Del del && del.Count > 0)
                {
                    string row = document[del.Row];
                    document[del.Row] = row[..del.Position] + new string('#', del.Count) + row[del.Position..];
                }
                else if (subdif is Newline newline)
                {
                    document[newline.Row] += document[newline.Row + 1];
                    document.RemoveAt(newline.Row + 1);
                }
                else if (subdif is Remline remline && !wrap.InformationLost)
                {
                    string prefix = document[remline.Row][..remline.Position];
                    string trailingText = document[remline.Row][remline.Position..];
                    document[remline.Row] = prefix;
                    document.Insert(remline.Row + 1, trailingText);
                }
                else if (subdif is Del del2 && del2.Count <= 0)
                {
                    // do nothing
                }
                else if (subdif is Remline && wrap.InformationLost)
                {
                    // do nothing
                }
                else
                {
                    throw new InvalidOperationException("Error: UndoDif: Received unknown subdif.");
                }
            }
        }
    }
}
