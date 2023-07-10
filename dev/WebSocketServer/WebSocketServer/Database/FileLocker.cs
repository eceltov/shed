using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Database
{
    internal class FileLocker<T> where T : notnull
    {
        // a lazily initialized dictionary of locks, the key is the entity identifier
        ConcurrentDictionary<T, SemaphoreSlim> locks = new();

        /// <summary>
        /// Retrieves a lock, or creates it if not present.
        /// </summary>
        /// <param name="identifier">The identifier of the entity.</param>
        /// <returns>Returns the lock.</returns>
        SemaphoreSlim GetLock(T identifier)
        {
            // get the lock if present
            if (locks.ContainsKey(identifier))
            {
                return locks[identifier];
            }

            // Add the lock. If this failed, it means a lock is already present and can be retrieved.
            locks.TryAdd(identifier, new SemaphoreSlim(1));
            return locks[identifier];
        }

        /// <summary>
        /// Asynchronously waits to enter a lock.
        /// </summary>
        /// <param name="identifier">The identifier of the entity.</param>
        /// <returns>Returns a task specifying whether the lock was obtained.</returns>
        public async Task WaitAsync(T identifier)
        {
            var semaphore = GetLock(identifier);
            await semaphore.WaitAsync();
        }

        /// <summary>
        /// Releases the lock.
        /// </summary>
        /// <param name="identifier">The identifier of the entity.</param>
        public void Release(T identifier)
        {
            var semaphore = GetLock(identifier);
            semaphore.Release();
        }
    }
}
