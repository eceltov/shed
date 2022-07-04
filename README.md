# ShEd - Collaborative Shared Editor and Repository

A shared web editor and repository supporting real-time collaborative editing sessions.

## Features
  - Document Convergence: If multiple users edit the same document at the same time, the document state will converge.
  - Document Intention Preservation: If users edit the same part of a document, the intentions of their (possibly conflicting) changes will be preserved at least on a syntactic level.
  - Authentication: Users can be authenticated using an external authentication component.
  - Repository: Users can create workspaces in their repository comprised of folders and documents.
  - Workspace and Document Sharing: Workspaces and Documents can be shared between users with an option to restrict access to only a subset of users. 

##  Work in Progress
The project is not finished yet. The authentication and workspace/document sharing modules have not been implemented yet as well as user creation. However, the collaborative editing features and workspace management work on a given set of workspaces, which can be freely shared amongst users.

## Installation

```bash 
npm run init
```

This installs all necessary node modules and [Ace Editor][1], on which this project depends.

## Usage

```bash
npm run start-controller-server
```

This starts an [Express][2] server handling routing and SSR.

```bash
npm run start-workspace-server
```

This starts a WebSocket server handling real-time user operations.

By default, the website runs on port 8060 and the WebSocket server on port 8080. This can be changed in the ```package.json``` file.


[1]: https://github.com/ajaxorg/ace-builds
[2]: https://expressjs.com/
