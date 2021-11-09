workspace {

    model {
        user = person "User"

        main = softwareSystem "Shared Web Editor" {
            controlApp = container "Controller Application" "Authenticates users and allows them to create and view documents." "JavaScript and React" "Browser"
            documentApp = container "Document Application" "Shows the contents of a document and allows users to edit it." "JavaScript and React" "Browser"
            database = container "Document Database" "Stores documents." "" "Database"

            controlServer = container "Control Server" "Manages user authentication, document creation and starts/closes Document Instance Servers" "Node.js" {
                loginApi = component "Login API" "Provides API for user authentication."
                documentManagementApi = component "Document Management API" "Provides API for document creation and deletion."
                documentAccessApi = component "Document Access API" "Provides API for document access."
                documentManagementController = component "Document Management Controller" "Creates or deletes documents if the user has permission."
                documentAccessController = component "Document Access Controller" "Starts the Document Instance server (if closed) and provides access to users (if they have the priviledge)."
                userModel = component "User Model" "Holds information about users (privileges, document ownerships...)"
            }

            documentServer = container "Document Instance Server" "Provides main document editing functionality." "Node.js" {
                websocketServer = component "WebSocket Server" "Enables communication." "WebSocket Server"
                operationController = component "Operation Controller" "Relays operations to other users and updates local document state. Also manages garbage collection."
                clientController = component "Client Controller" "Initializes or removes clients."
                clientModel = component "Client Model" "Holds information about clients."
                documentModel = component "Document Model" "Holds the document's content and metadata."
            }
        }

        authenticator = softwareSystem "Authentication Service"

        user -> main "Uses"
        main -> authenticator "Authenticates user"

        user -> controlApp "Visits the main page using"
        user -> documentApp "Edits documents using"

        controlApp -> documentApp "Redirects to"
        controlApp -> controlServer "Makes API calls to" "JSON/HTTP"
        controlApp -> loginApi "Authenticates using"
        controlApp -> documentManagementApi "Creates and deletes documents using"
        controlApp -> documentAccessApi "Accesses documents using"

        documentApp -> websocketServer "Sends changes to the document" "JSON/WebSocket"


        controlServer -> database "Creates and deletes files from"
        controlServer -> authenticator "Validates users using"
        controlServer -> documentServer "Starts"

        //controlServer
        loginApi -> authenticator "Validates user"

        documentManagementApi -> documentManagementController "Uses to access functionality"

        documentAccessApi -> documentAccessController "Uses to acces functionality"

        documentManagementController -> database "Creates or deletes documents from"
        documentManagementController -> userModel "Checks for permissions"

        documentAccessController -> documentServer "Starts"
        documentAccessController -> userModel "Checks for permissions"
        documentAccessController -> controlApp "Redirects to document"

        // documentServer
        documentServer -> database "Reads from and writes to"
        documentServer -> documentApp "Updates client's document"

        websocketServer -> operationController "Uses to process operations"
        websocketServer -> clientController "Uses to manage clients"

        operationController -> documentModel "Updates the document"
        operationController -> clientModel "Uses to access client metadata"
        operationController -> documentApp "Updates client's document"

        clientController -> documentModel "Reads the document"
        clientController -> clientModel "Updates client metadata"
        clientController -> documentApp "Initializes local client document"

        documentModel -> database "Persists the document"

    }

    views {
        systemContext main "System" {
            include *
        }

        container main "SharedWebEditor" {
            include *
        }

        component controlServer "ControlServer" {
            include *
        }

        component documentServer "DocumentServer" {
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