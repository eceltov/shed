# ShEd - Collaborative Shared Editor and Repository

A shared web editor and repository supporting real-time collaborative editing sessions.

## Features
  - Document Convergence: If multiple users edit the same document at the same time, their local documents will become identical over time.
  - Document Intention Preservation: If users edit the same part of a document, the intentions of their (possibly conflicting) changes will be preserved at least on a syntactic level.
  - Repository: Users can create workspaces in their repository comprised of folders and documents.
  - Workspace and Document Sharing: Workspaces and Documents can be shared between users with an option to restrict access to only a subset of users.

## Overview

ShEd is composed of two servers that need to be running to provide full functionality.
The first one is the controller server, that serves static pages.
The second one is the workspace server, which handles the collaborative aspects.

Users do not need to interact with the endpoints of the workspace server, this is handled by the client provided by the controller server.

## Installing ShEd

This project uses [Ace Editor][1] to display documents.
In order to initialize this submodule, run the following commands.

```bash 
git submodule init
git submodule update
```

ShEd can be started either manually, or using Docker.
If you prefer to run ShEd in Docker, you can ignore the following installation steps.

### Manual Installation

In order to start ShEd manually, you will need Node.js and .NET 6 SDK installed.

To install all necessary Node packages, execute:

```bash 
npm install
```

The final step is to bundle the client.
This can be done by running:

```bash 
npm run build-client
```

## Running ShEd

### Running ShEd on Docker

In order to start ShEd in the Docker environment, make sure that you have Docker installed.

All components of ShEd can be started using a single command:

```bash 
docker compose up
```

In case you do not have the required base images downloaded, you can download them using:

```bash 
docker pull node:18.16.1-slim
docker pull mcr.microsoft.com/dotnet/runtime:6.0
```

Please note that the containers print information about which port they use inside the container, not on the host environment.
To check which ports the containers expose, open the .env file in the root of the repository.
By default, the controller server uses port  `8060` and the workspace server uses port `8061`.


### Running ShEd Manually

To run ShEd manually, you first need to do all the manual installation stept.
Once installed, you can start the controller server by running:

```bash 
npm run start-controller-server
```

And to start the workspace server, run:

```bash 
npm run start-workspace-server
```

## Configuring ShEd

ShEd can be configured to run on different ports and to use a different secret for JWT tokens.

There are two files used for configuration.
The first one is the `.env` file in the root of the repository.
The second is the `config.json` file located in `dev/volumes/Configuration/`.

When running manually, the `.env` file does not need to be changed, as it will have no effect.
When running in Docker, the `config.json` file should only be used for changing the JWT secret; the `.env` file should be used instead.

## Using ShEd

ShEd can be accessed through the controller server at <http://localhost:8060> by default.

Once you arrive at the welcome screen, you can proceed to Log In using the label at the top-right corner.
By default, two demo accounts are available.
Their credentials are `demo`, `password` and `demo2`, `password2`, respectively.

Once logged in, you will see a list of available workspaces.
You can access an existing one by clicking on its name, or create one by clicking on the `New` button.
Both default users will have access to the `Demo Workspace`.

User `demo` has all privileges inside the workspace, but user `demo2` has only the rights to view and edit documents.

Inside a workspace, you can do basic file operations using the buttons in the top left and open documents and folders by navigating through the file system.
Opening a document will create a new tab and display the contents of the file.
To edit a document and see the effects from the point of view of a different client, you can simply duplicate the window, because a single user can have multiple clients.

To add a user to an existing workspace, you have to navigate to the Options in the top right corner, type in the username, select their role, and adding them using the Add button.

The workspace can be in one of two access types.
The first one is `Privileged`, that allows only authenticated users with access to the workspace to connect to it.
The second one is `All (Read Only)`, that additionally allows unauthenticated users to connect to the workspace, but not be able to make changes to it.
Authenticated users can still make changes to the workspace, if their role is sufficient.

[1]: https://github.com/ajaxorg/ace-builds
