const React = require('react');
const epic = require('bundles/epic/client');

class Something extends React.Component {
  render () {
    const x = epic.get('Test', 'test');
    if (x) {
      return false;
    }

    return false;
  }
}

module.exports = Something;
