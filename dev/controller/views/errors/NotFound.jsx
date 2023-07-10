const React = require('react');
const BaseError = require('./BaseError');

class NotFound extends React.Component {
  render() {
    return (
      <BaseError title='Not Found'
        heading='404 - Not Found'
        reason='The requested workspace was not found.'
      />
    );
  }
}

module.exports = NotFound;
