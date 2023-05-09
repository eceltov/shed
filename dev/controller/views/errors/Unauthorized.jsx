const React = require('react');
const BaseError = require('./BaseError');

class Unauthorized extends React.Component {
  render() {
    return (
      <BaseError title='Unauthorized'
        heading='401 - Unauthorized'
        reason='You do not have the minimal required access rights to view this workspace. Contact the workspace admin to request access.'
      />
    );
  }
}

module.exports = Unauthorized;
