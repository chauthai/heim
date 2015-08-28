var React = require('react/addons')
var classNames = require('classnames')


module.exports = React.createClass({
  displayName: 'Popup',

  componentWillMount: function() {
    Heim.addEventListener(uidocument.body, Heim.isTouch ? 'touchstart' : 'click', this.onOutsideClick, false)
  },

  componentWillUnmount: function() {
    Heim.removeEventListener(uidocument.body, Heim.isTouch ? 'touchstart' : 'click', this.onOutsideClick, false)
  },

  onOutsideClick: function(ev) {
    if (!this.getDOMNode().contains(ev.target) && this.props.onDismiss) {
      this.props.onDismiss(ev)
    }
  },

  render: function() {
    return (
      <div className={classNames('popup', this.props.className)}>
        {this.props.children}
      </div>
    )
  },
})
