using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TextOperations.Types
{
    internal class Add : Subdif
    {
        public string Content;

        public Add(int row, int position, string content)
        {
            Row = row;
            Position = position;
            Content = content;
        }

        public override Subdif Copy()
        {
            return new Add(Row, Position, Content);
        }

        public override bool SameAs(Subdif? other)
        {
            return other is Add add
                && base.SameAs(add)
                && Content == add.Content;
        }

        public override string ToString()
        {
            return $"add({Row}, {Position}, {Content})";
        }
    }
}
