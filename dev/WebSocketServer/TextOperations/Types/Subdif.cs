using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TextOperations.Types
{
    public abstract class Subdif
    {
        public int Row;
        public int Position;

        public abstract Subdif Copy();
        
        public virtual bool SameAs(Subdif? other)
        {
            return other != null
                && Row == other.Row
                && Position == other.Position;
        }
    }
}
