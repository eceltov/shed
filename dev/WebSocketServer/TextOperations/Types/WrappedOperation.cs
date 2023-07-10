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

        public WrappedOperation DeepCopy()
        {
            return new(
                new(Metadata.ClientID, Metadata.CommitSerialNumber, Metadata.PrevClientID, Metadata.PrevCommitSerialNumber),
                wDif.DeepCopy());
        }

        public bool LocallyDependent(WrappedOperation other)
        {
            return Metadata.LocallyDependent(other.Metadata);
        }

        public bool DirectlyDependent(WrappedOperation other)
        {
            return Metadata.DirectlyDependent(other.Metadata);
        }

        public bool PartOfSameChain(WrappedOperation other)
        {
            return Metadata.PartOfSameChain(other.Metadata);
        }
    }
}
