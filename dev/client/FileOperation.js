class FileOperation extends React.Component {
    constructor(props) {
        super(props);
        this.handleOnClick = this.handleOnClick.bind(this);
    }

    handleOnClick(e) {
        this.props.func();
    }

    render() {
        return (
            <div className="fileOperation" onClick={this.handleOnClick}>
                {this.props.text}
            </div>
        );
    }
}
