using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TextOperations.Types
{
    public class Remline : Subdif
    {
        public Remline(int row, int position)
        {
            Row = row;
            Position = position;
        }

        public override Subdif Copy()
        {
            return new Remline(Row, Position);
        }

        public override bool SameAs(Subdif? other)
        {
            return other is Remline remline
                && base.SameAs(remline);
        }

        public override string ToString()
        {
            return $"remline({Row}, {Position})";
        }
    }
}
