﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TextOperations.Types
{
    public class OperationMetadata
    {
        public int ClientID;
        public int CommitSerialNumber;
        public int PrevClientID;
        public int PrevCommitSerialNumber;

        public OperationMetadata(int clientID, int commitSerialNumber, int prevUserID, int prevCommitSerialNumber)
        {
            ClientID = clientID;
            CommitSerialNumber = commitSerialNumber;
            PrevClientID = prevUserID;
            PrevCommitSerialNumber = prevCommitSerialNumber;
        }

        public override bool Equals(object? obj)
        {
            return obj is OperationMetadata other && Equals(other);
        }

        public bool Equals(OperationMetadata other)
        {
            return ClientID == other.ClientID
                && CommitSerialNumber == other.CommitSerialNumber
                && PrevClientID == other.PrevClientID
                && PrevCommitSerialNumber == other.PrevCommitSerialNumber;
        }

        public bool LocallyDependent(OperationMetadata other)
        {
            return ClientID == other.ClientID;
        }

        public bool DirectlyDependent(OperationMetadata other)
        {
            return PrevClientID == other.ClientID
                && PrevCommitSerialNumber == other.CommitSerialNumber;
        }

        public bool PartOfSameChain(OperationMetadata other)
        {
            return ClientID == other.ClientID
                && PrevClientID == other.PrevClientID
                && PrevCommitSerialNumber == other.PrevCommitSerialNumber;
        }

        public override string ToString()
        {
            return $"[{ClientID}, {CommitSerialNumber}, {PrevClientID}, {PrevCommitSerialNumber}]";
        }
    }
}
