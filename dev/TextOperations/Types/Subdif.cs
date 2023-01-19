using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TextOperations.Types
{
    internal abstract class Subdif
    {
        public int Row;
        public int Position;

        public abstract Subdif Copy();
    }
}
