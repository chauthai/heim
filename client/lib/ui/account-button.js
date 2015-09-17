var React = require('react/addons')

var FastButton = require('./fast-button')


module.exports = React.createClass({
  displayName: 'AccountButton',

  mixins: [require('react-immutable-render-mixin')],

  render: function() {
    if (this.props.account) {
      return (
        <FastButton className="account-button signed-in" onClick={this.props.onOpenAccountPopup}>
          <div className="account-info">
            <div className="status">signed in</div>
            <div className="name">{this.props.account.get('name')}</div>
          </div>
        </FastButton>
      )
    } else {
      return <FastButton className="account-button" onClick={this.props.onOpenAccountDialog}>sign in or register</FastButton>
    }
  },
})
