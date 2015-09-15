var React = require('react/addons')
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup


module.exports = React.createClass({
  displayName: 'Spinner',

  getDefaultProps: function() {
    return {visible: true}
  },

  render: function() {
    return <ReactCSSTransitionGroup transitionName="spinner">{this.props.visible && <div key="spinner" className="spinner" />}</ReactCSSTransitionGroup>
  },
})

