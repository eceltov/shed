using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TextOperations.Types
{
    public class WrappedOperation
    {
        public OperationMetadata Metadata;
        public List<SubdifWrap> wDif;

        public WrappedOperation(OperationMetadata metadata, List<SubdifWrap> wDif)
        {
            Metadata = metadata;
            this.wDif = wDif;
        }
    }
}
