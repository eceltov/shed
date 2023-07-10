const React = require('react');

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
      <div role="button" tabIndex={0} className="fileOperation" onClick={this.handleOnClick}>
        {this.props.text}
      </div>
    );
  }
}

module.exports = FileOperation;
