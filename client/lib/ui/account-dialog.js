var React = require('react/addons')
var classNames = require('classnames')
var Reflux = require('reflux')

var accountFlow = require('../stores/account-flow')
var Popup = require('./popup')
var FastButton = require('./fast-button')


module.exports = React.createClass({
  displayName: 'AccountDialog',

  mixins: [
    Reflux.connect(accountFlow.store, 'flow'),
  ],

  onChangePassword: function(ev) {
    accountFlow.changePassword(ev.target.value)
  },

  render: function() {
    var flow = this.state.flow

    var passwordStrength = flow.state =='register' && flow.passwordStrength && (
      <div className={classNames('message', 'strength', flow.passwordStrength.level)}>
        {flow.passwordStrength.message}
      </div>
    )

    var title
    var bottom
    if (flow.state == 'register') {
      title = 'register'
      bottom = (
        <div className="bottom green-bg">
          <div className="register-fine-print">
            hey, this is important:
            <div className="check-field">
              <input type="checkbox" id="accept-legal" />
              <label htmlFor="accept-legal">I agree to Euphoria's <a href target="_blank">Terms of Service</a> and <a href target="_blank">Privacy Policy</a>.</label>
            </div>
            <div className="check-field">
              <input type="checkbox" id="accept-community" />
              <label htmlFor="accept-community">I will respect and uphold Euphoria's <a href target="_blank">rules</a> and <a href target="_blank">values</a>.</label>
            </div>
          </div>
          <div className="action-line">
            <div className="spacer" />
            <button type="submit" className="register">register</button>
          </div>
        </div>
      )
    } else if (flow.state == 'forgot') {
      title = 'forgot password?'
      bottom = (
        <div className="bottom neutral-bg">
          <div className="action-line">
            <button type="button" className="send-reminder">send a password reset email</button>
            <div className="spacer" />
            <button type="submit" className="sign-in">sign in</button>
          </div>
        </div>
      )
    } else {
      title = 'sign in or register'
      bottom = (
        <div className="bottom">
          <div className="action-line">
            <button type="button" className={classNames('forgot', flow.highlightForgot && 'highlight')}>forgot password?</button>
            <div className="spacer" />
            <button type="button" className="open-register" onClick={accountFlow.openRegister}>register</button>
            <button type="submit" className="sign-in">sign in</button>
          </div>
        </div>
      )
    }

    return (
      <Popup className="dialog account-dialog" onDismiss={this.props.onClose}>
        <div className="top-line">
          <div className="logo">
            <div className="emoji emoji-euphoria" />
            euphoria
          </div>
          <div className="title">{title}</div>
          <div className="spacer" />
          <FastButton className="close" onClick={this.props.onClose} />
        </div>
        <form onSubmit={ev => ev.preventDefault()}>
          <label className={classNames('text-field', 'email', flow.emailError && 'error')}>
            email address
            {flow.emailError && <div className="message">{flow.emailError}</div>}
            <input type="email" autoFocus />
          </label>
          <label className={classNames('text-field', 'password', flow.passwordError && 'error')}>
            password
            {flow.passwordError ?
              <div className="message">{flow.passwordError}</div>
              : passwordStrength
            }
            <input type="password" onChange={this.onChangePassword} />
          </label>
          {bottom}
        </form>
      </Popup>
    )
  },
})
