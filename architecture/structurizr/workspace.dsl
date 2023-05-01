workspace {

    model {
        user = person "User"

        main = softwareSystem "Shared Web Editor" {
            mainView = container "Main View" "Authenticates users and allows them to access workspaces." "JavaScript, React" "Browser"
            workspaceView = container "Workspace View" "Displays a workspace and allows the user to make changes." "JavaScript, React" "Browser"
            database = container "Database" "Stores workspaces, user data and configurations." "File System" "Database"

            controllerServer = container "Controller Server" "Manages user authentication and workspace creation/deletion." "Express.js" {
                restAPI = component "REST API" "Received user requests and returns responses."
                controllerComponent = component "Controller" "Resolves requests, serves pages or JSON data."
                databaseAdapterController = component "Database Adapter" "Handles database communication."
            }

            workspaceServer = container "Workspace Server" "Supervises clients, provides workspace managment and document editing functionality." "Node.js" {
                clientInterface = component "Client Interface" "Accepts WebSocket connections and forwards requests."
                workspaceController = component "WorkspaceController" "Handles workspace operations."
                documentController = component "Document Controller" "Handles document operations."
                workspaceModel = component "Workspace Model" "Holds workspace data."
                documentModel = component "Document Model" "Holds document data."
                clientModel = component "Client Model" "Holds information about clients."
                databaseAdapterWebSocket = component "Database Adapter" "Handles database communication."
            }
        }

        user -> main "Uses"

        user -> mainView "Visits the main page"
        user -> workspaceView "Edits documents using"

        mainView -> workspaceView "Redirects"
        mainView -> controllerServer "Sends requests" "HTTP/JSON"
        mainView -> restAPI "Sends requests" "HTTP/JSON"

        workspaceView -> clientInterface "Sends changes" "JSON/WebSocket"

        //controllerServer
        controllerServer -> database "Persists user and workspace data"

        restAPI -> controllerComponent "Forwards requests"

        controllerComponent -> databaseAdapterController "Receives/Changes data using"

        databaseAdapterController -> database "Persists data"

        // workspaceServer
        clientInterface -> workspaceController "Forwards workspace requests"
        clientInterface -> documentController "Forwards document requests"
        clientInterface -> clientModel "Adds clients"

        workspaceController -> workspaceModel "Manages workspace data"
        workspaceController -> documentController "Initializes documents."
        workspaceController -> clientModel "Verifies request authorization using"

        documentController -> documentModel "Manages document data"
        workspaceController -> clientModel "Verifies request authorization using"

        workspaceModel -> databaseAdapterWebSocket
        documentModel -> databaseAdapterWebSocket
        clientModel -> databaseAdapterWebSocket


        workspaceServer -> database "Persists user, workspace and document data"
        workspaceServer -> workspaceView "Broadcasts changes" "JSON/WebSocket"

    }

    views {
        systemContext main "System" {
            include *
        }

        container main "SharedWebEditor" {
            include *
        }

        component controllerServer "controllerServer" {
            include *
        }

        component workspaceServer "workspaceServer" {
            include *
        }

        styles {
            element "Person" {
                color #ffffff
                background #3311cc
                fontSize 22
                shape Person
            }
            element "Software System" {
                background #1168bd
                color #ffffff
            }
            element "Container" {
                background #438dd5
                color #ffffff
            }
            element "Browser" {
                shape WebBrowser
            }
            element "Mobile App" {
                shape MobileDeviceLandscape
            }
            element "Database" {
                shape Cylinder
            }
            element "Component" {
                background #85bbf0
                color #000000
            }
        }

        //theme default
    }

}