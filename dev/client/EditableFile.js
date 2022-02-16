class EditableFile extends React.Component {
    constructor(props) {
        super(props);
        this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    handleKeyPress(e) {
        if (e.key === "Enter") {
            const name = e.target.value;
            this.props.onFinalize(name);
        }
    }


    render() {
        return (
            <input type="text" className="editableFile" onKeyPress={this.handleKeyPress}/>
        );
    }
}
