using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TextOperations.Types
{
    internal class Del : Subdif
    {
        public int Count;

        public Del(int row, int position, int count)
        {
            Row = row;
            Position = position;
            Count = count;
        }

        public override Subdif Copy()
        {
            return new Del(Row, Position, Count);
        }

        public override bool SameAs(Subdif? other)
        {
            return other is Del del
                && base.SameAs(del)
                && Count == del.Count;
        }
    }
}
