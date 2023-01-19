using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TextOperations.Types
{
    internal class Remline : Subdif
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
    }
}
