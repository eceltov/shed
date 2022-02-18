function onInitDocument(message) {
    if (!this.requestedDocuments.has(message.fileID)) {
        console.log('The server sent an unrequested document, message: ', message);
    }
    else {
        this.requestedDocuments.delete(message.fileID);

        const name = fsOps.getFileNameFromID(this.state.fileStructure, this.pathMap, message.fileID);
        const mode = modelist.getModeForPath(name).mode;
        const session = new EditSession(message.serverDocument, mode);

        // check if a commitSerialNumber exists for this document
        let commitSerialNumber = 0;
        if (this.savedCommitSerialNumbers.has(message.fileID)) {
            commitSerialNumber = this.savedCommitSerialNumbers.get(message.fileID);
        }

        const managedSession = new ManagedSession(
            session, this.clientID, commitSerialNumber, this.sendMessageToServer, message,
        );

        this.openedDocuments.set(message.fileID, managedSession);
        this.setState((prevState) => ({
            tabs: [message.fileID, ...prevState.tabs],
            activeTab: message.fileID,
        }));
    }
}

bad syntax
