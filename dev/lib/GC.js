/**
 * @brief Removes entries from SO and HB.
 * @param {*} serverOrdering The local server ordering.
 * @param {*} HB The local history buffer.
 * @param {*} SOGarbageIndex The index of the first preserved entry in server ordering.
 * @param {*} loggingEnabled If true, debug messages will be printed to standard output.
 * @returns Returns { HB, serverOrdering } with removed entries.
 */
function GCRemove(serverOrdering, HB, SOGarbageIndex, loggingEnabled) {
  if (SOGarbageIndex < 0 || SOGarbageIndex >= serverOrdering.length) {
    if (loggingEnabled) console.log('GC Bad SO index');
    return {
      HB,
      serverOrdering,
    };
  }

  // find matching elements in HB to those in SO
  const HBRemovalIndices = [];
  for (let SOIndex = 0; SOIndex < SOGarbageIndex; SOIndex++) {
    const GCClientID = serverOrdering[SOIndex][0];
    const GCCommitSerialNumber = serverOrdering[SOIndex][1];
    for (let HBIndex = 0; HBIndex < HB.length; HBIndex++) {
      const HBClientID = HB[HBIndex][0][0];
      const HBCommitSerialNumber = HB[HBIndex][0][1];
      if (HBClientID === GCClientID && HBCommitSerialNumber === GCCommitSerialNumber) {
        HBRemovalIndices.push(HBIndex);
        break;
      }
    }
  }

  // filter out all the GC'd operations
  const newHB = HB.filter((operation, index) => !HBRemovalIndices.includes(index));
  const newServerOrdering = serverOrdering.slice(SOGarbageIndex);

  return {
    HB: newHB,
    serverOrdering: newServerOrdering,
  };
}

module.exports = { GCRemove };
