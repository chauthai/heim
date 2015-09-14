var React = require('react/addons')
var classNames = require('classnames')
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup

var Popup = require('./popup')


module.exports = React.createClass({
  displayName: 'Bubble',

  mixins: [require('react-immutable-render-mixin')],

  getDefaultProps: function() {
    return {
      edgeSpacing: 10,
    }
  },

  render: function() {
    return (
      <ReactCSSTransitionGroup transitionName="bubble">
        {this.props.visible &&
          <Popup ref="bubble" key="bubble" className={classNames('bubble', this.props.className)} onDismiss={this.onDismiss}>
            {this.props.children}
          </Popup>
        }
      </ReactCSSTransitionGroup>
    )
  },

  onDismiss: function(ev) {
    if (this.props.visible) {
      this.props.onDismiss(ev)
    }
  },

  componentDidMount: function() {
    this.reposition()
  },

  componentDidUpdate: function() {
    this.reposition()
  },

  reposition: function() {
    // FIXME: only handles left anchors. expand/complexify to work for multiple
    // orientations when necessary.
    if (this.props.visible && this.props.anchorEl) {
      var box = this.props.anchorEl.getBoundingClientRect()
      var node = this.refs.bubble.getDOMNode()

      var top = box.top
      top -= Math.max(0, top + node.clientHeight + this.props.edgeSpacing - uiwindow.innerHeight)

      var left = box.right

      if (this.props.offset) {
        var offsetBox = this.props.offset(box)
        left -= offsetBox.left || 0
        top -= offsetBox.top || 0
      }

      node.style.left = left + 'px'
      node.style.top = top + 'px'
    }
  },
})
