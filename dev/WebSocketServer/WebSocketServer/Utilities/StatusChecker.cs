using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Utilities
{
    internal class StatusChecker
    {
        int[] status;
        readonly Action readyCallback;
        readonly int targetCheckCount;
        int currentChecks;

        /// <summary>
        /// The status checker represents an array that invokes a callback after all elements
        /// reach a specified number of checks. The default number of checks required is one
        /// for each element.
        /// </summary>
        /// <param name="count">The number of elements in the array.</param>
        /// <param name="readyCallback">
        /// The callback to be invoked after all elements were checked sufficient number of times.
        /// </param>
        /// <param name="targetCheckCount">
        /// The target number of checks each element has to have.
        /// </param>
        public StatusChecker(int count, Action readyCallback, int targetCheckCount = 1)
        {
            status = new int[count];
            this.targetCheckCount = targetCheckCount;
            this.readyCallback = readyCallback;
            currentChecks = 0;
        }

        /// <summary>
        /// Checks the element at the specified index once.
        /// Will invoke the callback if all elements were checked sufficient number of times.
        /// </summary>
        /// <param name="index">The element index to be checked.</param>
        /// <exception cref="ArgumentException">
        /// Thrown when the index is outside of the bounds of the array.
        /// </exception>
        /// <exception cref="InvalidOperationException">
        /// Thrown when the index was already checked sufficient number of times.
        /// </exception>
        public void Check(int index)
        {
            if (index < 0 || index >= status.Length)
                throw new ArgumentException("Error: Check: The index was out of range.");

            if (status[index] >= targetCheckCount)
                throw new InvalidOperationException("Error: Check: The index specified already has the maximum amount of checks.");

            status[index]++;
            currentChecks++;

            if (Ready())
                readyCallback();
        }

        /// <summary>
        /// Resets the StatusChecker to its initial state.
        /// </summary>
        public void Reset()
        {
            currentChecks = 0;
            Array.Fill(status, 0);
        }

        /// <summary>
        /// Resets the StatusChecker to its initial state.
        /// Also changes the number of elements to be checked.
        /// </summary>
        /// <param name="newCount">The new number of elements in the array.</param>
        public void Reset(int newCount)
        {
            currentChecks = 0;
            status = new int[newCount];
        }

        bool Ready()
        {
            return currentChecks == targetCheckCount * status.Length;
        }
    }
}
