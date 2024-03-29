﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TextOperations.Types
{
    public class Newline : Subdif
    {
        public Newline(int row, int position)
        {
            Row = row;
            Position = position;
        }

        public override Subdif Copy()
        {
            return new Newline(Row, Position);
        }

        public override bool SameAs(Subdif? other)
        {
            return other is Newline newline
                && base.SameAs(newline);
        }

        public override string ToString()
        {
            return $"newline({Row}, {Position})";
        }
    }
}
