using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TextOperations.Types
{
    public class Operation
    {
        public OperationMetadata Metadata;
        public List<Subdif> Dif;

        public Operation(OperationMetadata metadata, List<Subdif> dif)
        {
            Metadata = metadata;
            Dif = dif;
        }
    }
}
