const React = require('react');

class OptionsScreen extends React.Component {
  render() {
    return (
      <div className="optionsContent">
        <button type="submit" onClick={this.props.deleteWorkspace}>
          Delete Workspace
        </button>
      </div>
    );
  }
}

module.exports = OptionsScreen;
