class EditableFile extends React.Component {
    constructor(props) {
        super(props);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    handleKeyPress(e) {
        if (e.key === "Enter") {
            const name = e.target.value;
            if (fsOps.validateFileName(name)) {
                this.props.onFinalize(name);
            }
            else {
                window.alert("This file name is invalid.");
            }
        }
    }

    handleKeyDown(e) {
        if (e.key === "Escape") {
            this.props.abortFileOp();
        }
    }

    componentDidMount() {
        document.getElementById("editableFile").focus();
    }


    render() {
        return (
            <input type="text" id="editableFile" onKeyPress={this.handleKeyPress} onKeyDown={this.handleKeyDown} defaultValue={(this.props.name !== null) ? this.props.name : "" } />
        );
    }
}
