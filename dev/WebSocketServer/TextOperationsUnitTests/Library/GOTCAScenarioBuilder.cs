using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Operations;
using TextOperations.Types;

namespace TextOperationsUnitTests.Library
{
    internal record GOTCAOperationDescriptor(
        int ClientID, int PrevClientID, int PrevCommitSerialNumber, params Subdif[] Dif)
    {
        public GOTCAOperationDescriptorWrapped Wrap()
        {
            return new GOTCAOperationDescriptorWrapped(
                ClientID,
                PrevClientID,
                PrevCommitSerialNumber,
                Dif.ToList().Wrap().ToArray());
        } 
    }

    internal record GOTCAOperationDescriptorWrapped(
        int ClientID, int PrevClientID, int PrevCommitSerialNumber, params SubdifWrap[] wDif);

    internal class GOTCAScenarioBuilder
    {
        int clientCount;
        GOTCAOperationDescriptorWrapped? messageDescriptor = null;
        GOTCAOperationDescriptorWrapped? resultDescriptor = null;
        List<GOTCAOperationDescriptor> HBDescriptor = new();
        SO SO = new();
        bool automaticSO = false;
        bool resultEqualToMessage = false;

        GOTCAScenarioBuilder(int clientCount)
        {
            this.clientCount = clientCount;
        }

        /// <summary>
        /// Creates a new GOTCA scenario.
        /// The scenario requires a Message, HB, SO, and Result.
        /// </summary>
        /// <param name="clientCount">
        /// The number of clients that partake in the scenario.
        /// The clients are numbered from 0 onwards.
        /// </param>
        /// <returns>Returns the scenario builder.</returns>
        public static GOTCAScenarioBuilder Create(int clientCount)
        {
            return new(clientCount);
        }

        /// <summary>
        /// Sets the Message for the scenario.
        /// </summary>
        /// <param name="descriptor">An operation descriptor. The dif must be non empty.</param>
        /// <returns>Returns the scenario builder.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the Message was already set.</exception>
        /// <exception cref="ArgumentException">Thrown when the dif is empty.</exception>
        public GOTCAScenarioBuilder SetMessage(GOTCAOperationDescriptor descriptor)
        {
            if (messageDescriptor != null)
                throw new InvalidOperationException($"Error: {nameof(SetMessage)}: Message descriptor is already set.");
            if (descriptor.Dif == null)
                throw new ArgumentException($"Error: {nameof(SetMessage)}: Message descriptor dif cannot be null.");

            messageDescriptor = descriptor.Wrap();
            return this;
        }

        /// <summary>
        /// Sets the Message for the scenario.
        /// </summary>
        /// <param name="descriptor">An operation descriptor. The wDif must be non empty.</param>
        /// <returns>Returns the scenario builder.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the Message was already set.</exception>
        /// <exception cref="ArgumentException">Thrown when the wDif is empty.</exception>
        public GOTCAScenarioBuilder SetMessageWrapped(GOTCAOperationDescriptorWrapped descriptor)
        {
            if (messageDescriptor != null)
                throw new InvalidOperationException($"Error: {nameof(SetMessage)}: Message descriptor is already set.");
            if (descriptor.wDif == null)
                throw new ArgumentException($"Error: {nameof(SetMessage)}: Message descriptor wDif cannot be null.");

            messageDescriptor = descriptor;
            return this;
        }

        /// <summary>
        /// Adds operations to the HB.
        /// </summary>
        /// <param name="descriptors">
        /// An operation descriptor.
        /// If empty, a default dif will be provided.
        /// </param>
        /// <returns>Returns the scenario builder.</returns>
        public GOTCAScenarioBuilder AddHBOperations(params GOTCAOperationDescriptor[] descriptors)
        {
            foreach (var descriptor in descriptors)
                HBDescriptor.Add(descriptor);
            return this;
        }

        /// <summary>
        /// Adds metadata to the SO.
        /// </summary>
        /// <param name="metadata">The metadata to be added.</param>
        /// <returns>Returns the scenario builder.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the SO was already derived from the HB.</exception>
        public GOTCAScenarioBuilder AddSOMetadata(params OperationMetadata[] metadata)
        {
            if (automaticSO)
                throw new InvalidOperationException($"Error: {nameof(CreateSOFromHB)}: SO is already set.");

            foreach (var metadatum in metadata)
                SO.Add(metadatum);
            return this;
        }

        /// <summary>
        /// Creates the SO from the metadata in HB, in the same order.
        /// </summary>
        /// <returns>Returns the scenario builder.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the SO is already initialized.</exception>
        public GOTCAScenarioBuilder CreateSOFromHB()
        {
            if (SO.Count != 0 || automaticSO)
                throw new InvalidOperationException($"Error: {nameof(CreateSOFromHB)}: SO is already set.");

            automaticSO = true;
            return this;
        }

        /// <summary>
        /// Sets the expected value of the transformed Message.
        /// </summary>
        /// <param name="descriptor">An operation descriptor. The dif must be non empty.></param>
        /// <returns>Returns the scenario builder.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the Result was already set.</exception>
        /// <exception cref="ArgumentException">Thrown when the dif is empty.</exception>
        public GOTCAScenarioBuilder SetResult(GOTCAOperationDescriptor descriptor)
        {
            if (resultDescriptor != null || resultEqualToMessage)
                throw new InvalidOperationException($"Error: {nameof(SetResult)}: Result descriptor is already set.");
            if (descriptor.Dif == null)
                throw new ArgumentException($"Error: {nameof(SetResult)}: Result descriptor dif cannot be null.");

            resultDescriptor = descriptor.Wrap();
            return this;
        }

        /// <summary>
        /// Sets the expected value of the transformed Message.
        /// </summary>
        /// <param name="descriptor">An operation descriptor. The wDif must be non empty.></param>
        /// <returns>Returns the scenario builder.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the Result was already set.</exception>
        /// <exception cref="ArgumentException">Thrown when the wDif is empty.</exception>
        public GOTCAScenarioBuilder SetResultWrapped(GOTCAOperationDescriptorWrapped descriptor)
        {
            if (resultDescriptor != null || resultEqualToMessage)
                throw new InvalidOperationException($"Error: {nameof(SetResult)}: Result descriptor is already set.");
            if (descriptor.wDif == null)
                throw new ArgumentException($"Error: {nameof(SetResult)}: Result descriptor wDif cannot be null.");

            resultDescriptor = descriptor;
            return this;
        }

        /// <summary>
        /// Set the original form of the Message as the result, meaning that GOTCA did not change the Message.
        /// </summary>
        /// <returns>Returns the scenario builder.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the Result was already set.</exception>
        public GOTCAScenarioBuilder SetMessageAsResult()
        {
            if (resultDescriptor != null || resultEqualToMessage)
                throw new InvalidOperationException($"Error: {nameof(SetMessageAsResult)}: Result descriptor is already set.");

            resultEqualToMessage = true;
            return this;
        }

        /// <summary>
        /// Runs the scenario, asserting that the transformed Message is the same as the Result.
        /// </summary>
        /// <param name="ignoreIDs">Whether wrap IDs of the Result and the Transformer shall be compared.></param>
        /// <exception cref="InvalidOperationException">Thrown when the Message or Result is not set.</exception>
        public void Run(bool ignoreIDs = true)
        {
            if (messageDescriptor == null)
                throw new InvalidOperationException($"Error: {nameof(Run)}: Message descriptor is not set.");
            if (!resultEqualToMessage && resultDescriptor == null)
                throw new InvalidOperationException($"Error: {nameof(Run)}: Result descriptor is not set.");


            var woGenerators = new UDRUtilities.WrappedOperationGenerator[clientCount];
            for (int i = 0; i < clientCount; i++)
                woGenerators[i] = new(i);

            WrappedHB wdHB = new();
            for (int i = 0; i < HBDescriptor.Count; i++)
            {
                var opDescriptor = HBDescriptor[i];
                var dif = opDescriptor.Dif.Length == 0 ? new[] { new Add(0, 0, i.ToString()) } : opDescriptor.Dif;
                var operation = woGenerators[opDescriptor.ClientID].Generate(
                    opDescriptor.PrevClientID, opDescriptor.PrevCommitSerialNumber, dif);
                wdHB.Add(operation);
            }

            if (automaticSO)
                SO = UDRUtilities.SOFromHB(wdHB);

            var original = woGenerators[messageDescriptor.ClientID].Generate(
                messageDescriptor.PrevClientID, messageDescriptor.PrevCommitSerialNumber, messageDescriptor.wDif);

            if (resultEqualToMessage)
            {
                WrappedOperation transformed = original.DeepCopy().GOTCA(wdHB, SO);
                Assert.IsTrue(original.SameAs(transformed, ignoreIDs));
            }
            else
            {
                var result = UDRUtilities.WOFactory(
                    resultDescriptor!.ClientID,
                    original.Metadata.CommitSerialNumber,
                    resultDescriptor.PrevClientID,
                    resultDescriptor.PrevCommitSerialNumber,
                    resultDescriptor.wDif);

                WrappedOperation transformed = original.GOTCA(wdHB, SO);
                Assert.IsTrue(result.SameAs(transformed, ignoreIDs));
            }

        }
    }
}
