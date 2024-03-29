# ShEd - Collaborative Shared Editor and Repository

A shared web editor and repository prototype supporting real-time collaborative editing sessions.

## Features
  - Document Convergence: If multiple users edit the same document at the same time, their local documents will become identical over time.
  - Document Intention Preservation: If users edit the same part of a document, the intentions of their (possibly conflicting) changes will be preserved at least on a syntactic level.
  - Repository: Users can create workspaces in their repository comprised of folders and documents.
  - Workspace and Document Sharing: Workspaces and Documents can be shared between users with an option to restrict access to only a subset of users.

## Overview

ShEd is composed of two servers that need to be running to provide full functionality.
The first one is the `controller server`, which serves static pages.
The second one is the `workspace server`, which handles the collaborative aspects.

Users do not need to interact with the endpoints of the workspace server; this is handled by the client provided by the controller server.

## Installing ShEd

To install ShEd, first, clone the repository by using `git clone`.

Then, initialize the [Ace Editor][1] submodule by running the following commands in the root of the repository.

```bash
git init
git submodule init
git submodule update
```

If the submodule initalized successfully, the `dev/controller/editor/ace-builds` folder should not be empty.

ShEd can be started either manually, or by using Docker.
If you prefer to run ShEd in Docker, you can ignore the following installation steps.

### Manual Installation

In order to start ShEd manually, you will need Node.js and .NET 6 SDK installed.

To install all necessary Node packages, execute:

```bash 
npm install
```

The final step is to bundle the client.
When running from a Linux environment, run the following command:

```bash 
npm run build-client
```

When running in Windows, run this instead:

```
New-Item -ItemType Directory -Force -Path ./dev/controller/client/bundles
npm run build-client-windows
```

## Running ShEd

### Running ShEd in Docker

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

To run ShEd manually, you first need to do all the manual installation steps.
Once installed, you can start the controller server by running:

```bash 
npm run start-controller-server
```

And to start the workspace server, run:

```bash 
npm run start-workspace-server
```

## Using ShEd

ShEd can be accessed through the controller server at <http://localhost:8060> by default.

Once you load the page, you will be prompted to log in. 
By default, two demo accounts are available.
Their credentials are `demo`, `password` and `demo2`, `password2`, respectively.

Once logged in, you will see a list of available workspaces.
You can access an existing one by clicking on its name, or create one by clicking on the `New` button.
Both default users will have access to the `Demo Workspace`.

User `demo` has all privileges inside the workspace, but user `demo2` has only the rights to view and edit documents.
Many of the features below are thus not available for user `demo2`.

Inside a workspace, you can do basic file operations using the buttons in the top left and open documents and folders by navigating through the file system.
Opening a document will create a new tab and display the contents of the file.

To edit a document and see the effects from the point of view of a different client, you can simply duplicate the window, because a single user can have multiple clients.
To see a workspace from the perspective of multiple users at once, you can open the workspace in a different browser that does not share cookies with your primary one.
Alternatively, you can also open the workspace in incognito mode, because it usually does not share cookies with the main browser.

To change the role of a user in the workspace, navigate to the `Options` in the top right corner of the workspace, type in their username, select their new role, and finally change it using the `Change Role` button.
The same interface can be used to add new users to the workspace or to delete the workspace.

The workspace can be in one of three access modes:
  - `Privileged`: allows only authenticated users with access to the workspace to connect to it.
  - `Everyone with link`: additionally allows unauthenticated users to connect to the workspace and edit documents.
  - `Everyone with link (read-only)`: does not allow unauthenticated users to edit documents.

Authenticated users can still make changes to the workspace if their role is sufficient in the latter two modes.

### Managing Users

Adding users, removing them, and changing their passwords can be done using three utility scripts.
The following example adds a user `test` with password `password`, changes its password to `new`, and finally deletes it.

```bash 
node dev/userOperations/createUser.js test password
node dev/userOperations/changeUserPassword.js test new
node dev/userOperations/removeUser.js test
```

To use the scripts, it is necessary to have Node installed and the packages initialized by running:

```bash 
npm install
```

## Configuring ShEd

ShEd can be configured to run on different ports and to use a different secret for JWT tokens.
Additionally, whether it is possible to enable debug logs and the buffering window for Workspace clients.

The servers do not support hot reloading; to see the effects of the new configuration, you need to restart them.

There are two files used for configuration.
The first one is the `.env` file in the root of the repository.
The second one is the `config.json` file located in `dev/volumes/Configuration/`.

When running manually, the `.env` file does not need to be changed, as it will have no effect.
Everything can be changed in the `config.json` file.
 - To change the JWT secret, navigate to the `JWT` section and modify its `Secret` field.
 - To change the ports and the endpoint on which the servers run, go to the `FallbackSettings` section and modify the `controllerServerPort`, `workspaceServerPort`, and `workspaceServerUrl`.
 - To see debug logs, change `ShowDebugLogs` to `true`.
 - To change the client buffering interval, navigate to the `Client` section and modify the `bufferingIntervalMilliseconds` field.

When running in Docker, the `config.json` file should be used only when configuring options that are not present in the `.env` file.

## Repository Structure

All of the source code and application data are located in the `dev` folder.

### Controller Server

The source code of the controller server can be found in the `controller` folder.
It stores the workspace client in the `client` folder, the transformation library in the `lib` folder, and the routes and views used for server-side rendering in the `routes` and `views` folder.
The main entrypoint is the `controllerServer.js` file, which initializes the `Controller` class in `Controller.js`.

### Workspace Server

The source code of the workspace server is in the `WebSocketServer` folder.
It is structured into three main parts: the server itself is in the `WebSocketServer` folder, the transformation library is in the `TextOperations` folder, and the `TextOperationsUnitTests` folder holds the unit tests of the project.

### User Operations

The `userOperations` folder holds three utility scripts for managing users.

### Testing

The `testing` folder contains tests written in JavaScript.
It contains the `randomizedTests/indepDepIdentity` subfolder that contains a generator of randomized scenarios that can be used to test the transformation library.

### Data

All of the user and workspace data is stored in the `volumes` folder.
Additionally, it also contains the configuration of the servers in the `Configuration` folder.
The `Data` folder holds the `users` and `workspaces` subfolders, that hold information users and workspaces, respectively.

## Testing

There are several test suits in this project written in JavaScript or C#.

### C# Tests

All of the C# tests can be found in the project located in `dev/WebSocketServer/TextOperationsUnitTests`.
If you want to go through them and see the results, you can open the solution file of the server located at `dev/WebSocketServer/WebSocketServer.sln` using Visual Studio and run the tests there.
Currently, 5 tests are failing due to the issues described in the thesis.

### JavaScript Tests

A randomized testing framework was devised that generates random sequences of dif elements and then tries including and excluding them.
If everything went well, the result should be identical to the input.
The framework takes a number of test scenarios to generate as an input, generates them, and them runs them.
Any failed scenarios will be saved and can be run using a different script.
Example usage:

```bash 
npm run test-randomized 123456
npm run test-randomized-failed
```

### Performance Tests

The repository contains the `performanceTesting` branch for performance testing.
Please read the README in that branch for further details.

[1]: https://github.com/ajaxorg/ace-builds
