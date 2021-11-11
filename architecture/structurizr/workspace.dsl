workspace {

    model {
        user = person "User"

        main = softwareSystem "Shared Web Editor" {
            mainPage = container "Main Page" "Authenticates users and allows them to create and view documents." "JavaScript and React" "Browser"
            documentPage = container "Document Page" "Shows the contents of a document and allows users to edit it." "JavaScript and React" "Browser"
            database = container "Document Database" "Stores documents." "" "Database"

            phpServer = container "PHP Server" "Manages user authentication, document creation/deletion and document access." "PHP Apache" {
                frontController = component "Front Controller" "Processes user requests and generates HTML pages." "PHP"
                loginController = component "Login Controller" "Processes user authentication requests."
                documentManagementController = component "Document Management Controller" "Processes document creation and deletion requests."
                documentAccessController = component "Document Access Controller" "Processes document access requests. If the user has access, returns the access parameters for the document."
                userModel = component "User Model" "Holds information about users (privileges, document ownerships, document names, document access parameters)"
            }

            controlServer = container "Document Control Server" "Starts/closes Document Instance Servers based on user requests. Sends connection information to users." "Node.js" {
                httpServer = component "HTTP Server" "" "HTTP Server"
                documentController = component "Document Controller" "Starts/closes Document instance Servers"
            }

            documentServer = container "Document Instance Server" "Provides main document editing functionality." "Node.js" {
                websocketServer = component "WebSocket Server" "" "WebSocket Server"
                operationController = component "Operation Controller" "Relays operations to other users and updates local document state. Also manages garbage collection."
                clientController = component "Client Controller" "Initializes or removes clients."
                clientModel = component "Client Model" "Holds information about clients."
                documentModel = component "Document Model" "Holds the document's content and metadata."
            }
        }

        authenticator = softwareSystem "Authentication Service"

        user -> main "Uses"
        main -> authenticator "Authenticates user"

        user -> mainPage "Visits the main page"
        user -> documentPage "Edits documents using"

        mainPage -> documentPage 
        mainPage -> phpServer "Sends requests to" "HTTP"
        mainPage -> frontController "Sends requests to" "HTTP"

        documentPage -> websocketServer "Sends changes to the document" "JSON/WebSocket"
        documentPage -> controlServer "Requests Document Instance Server port from" "Websocket?"


        

        //phpServer
        phpServer -> database "Creates and deletes files from"
        phpServer -> authenticator "Authenticates users using"

        frontController -> loginController "Authenticates using"
        frontController -> documentManagementController "Creates and deletes documents using"
        frontController -> documentAccessController "Validates access using"

        loginController -> authenticator "Authenticates users using"

        documentManagementController -> database "Creates or deletes documents from"
        documentManagementController -> userModel "Checks for permissions"

        documentAccessController -> userModel "Checks for permissions and gets access parameters from"

        //controlServer
        documentPage -> httpServer "Requests Document Instance Server port from"
        controlServer -> documentServer "Starts/closes"
        httpServer -> documentController "Makes API calls to"
        documentController -> documentServer "Starts/closes"


        // documentServer
        documentServer -> database "Reads from and writes to"
        documentServer -> documentPage "Updates client's document" "JSON/WebSocket"

        websocketServer -> operationController "Uses to process operations"
        websocketServer -> clientController "Uses to manage clients"

        operationController -> documentModel "Updates the document"
        operationController -> clientModel "Uses to access client metadata"
        operationController -> documentPage "Updates client's document"

        clientController -> documentModel "Reads the document"
        clientController -> clientModel "Updates client metadata"
        clientController -> documentPage "Initializes local client document"

        documentModel -> database "Persists the document"

    }

    views {
        systemContext main "System" {
            include *
        }

        container main "SharedWebEditor" {
            include *
        }

        component phpServer "phpServer" {
            include *
        }

        component controlServer "documentControlServer" {
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