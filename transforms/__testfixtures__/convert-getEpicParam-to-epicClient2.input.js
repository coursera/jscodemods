const React = require('react');

class Something extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object,
    getEpicParam: React.PropTypes.func.isRequired
  }

  render () {
    const x = this.context.getEpicParam('Test', 'test');
    if (x) {
      return false;
    }
    return false;
  }
}

module.exports = Something;
