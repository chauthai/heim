var React = require('react/addons')
var classNames = require('classnames')
var Reflux = require('reflux')

var accountFlow = require('../stores/account-flow')
var Popup = require('./popup')
var FastButton = require('./fast-button')
var Spinner = require('./spinner')


module.exports = React.createClass({
  displayName: 'AccountDialog',

  mixins: [
    Reflux.connect(accountFlow.store, 'flow'),
  ],

  onFormFocus: function(ev) {
    if (ev.target.nodeName == 'INPUT') {
      this.setState({focused: ev.target.name})
    }
  },

  onFormBlur: function() {
    this.setState({focused: null})
  },

  onChangeEmail: function(ev) {
    var isRegisterSwitch = ev.relatedTarget && ev.relatedTarget.className == 'open-register' && !ev.target.value
    accountFlow.changeEmail(ev.target.value, ev.type == 'blur' && !isRegisterSwitch)
  },

  onChangePassword: function(ev) {
    accountFlow.changePassword(ev.target.value, ev.type == 'blur')
  },

  onFocusPassword: function() {
    this.setState({passwordEntryFocused: true})
  },

  onBlurPassword: function(ev) {
    this.onChangePassword(ev)
    this.setState({passwordEntryFocused: false})
  },

  onChangeAcceptLegal(ev) {
    accountFlow.changeAcceptLegal(ev.target.checked)
  },

  onChangeAcceptCommunity(ev) {
    accountFlow.changeAcceptCommunity(ev.target.checked)
  },

  focusEmailIfEmpty: function() {
    if (!this.state.flow.email) {
      this.refs.emailField.getDOMNode().focus()
    }
  },

  onRegisterClick: function() {
    this.focusEmailIfEmpty()
    accountFlow.openRegister()
  },

  onForgotClick: function() {
    this.focusEmailIfEmpty()
    accountFlow.openForgot()
  },

  onSubmit: function(ev) {
    ev.preventDefault()
    this.refs.submit.getDOMNode().click()
  },

  render: function() {
    var flow = this.state.flow

    var title
    var dialogContent
    if (flow.step == 'register-email-sent' || flow.step == 'reset-email-sent') {
      title = 'check your email'
      dialogContent = (
        <div className="content">
          <div className="email-icon" />
          <div className="notice">{flow.step == 'register-email-sent' ? 'done! we\'ve sent you a verification email.' : 'ok! we\'ve sent you a password reset email.'}</div>
          <div className="bottom">
            <div className="action-line centered">
              <button type="button" tabIndex="3" className="continue" onClick={this.props.onClose}>{flow.step == 'register-email-sent' ? 'continue to account' : 'continue'}</button>
            </div>
          </div>
        </div>
      )
    } else {
      var passwordStrength = flow.step =='register' && flow.passwordStrength && (
        <div className={classNames('error-message', 'strength', flow.passwordStrength.level)}>
          {flow.passwordStrength.message}
        </div>
      )

      var bottom
      if (flow.step == 'register') {
        title = 'register'
        bottom = (
          <div className="bottom green-bg">
            <div className="register-fine-print">
              hey, this is important:
              <div className="check-field">
                <input type="checkbox" tabIndex="3" id="accept-legal" disabled={flow.working} checked={flow.acceptLegal} onChange={this.onChangeAcceptLegal} />
                <label htmlFor="accept-legal">I agree to Euphoria's <a href target="_blank">Terms of Service</a> and <a href target="_blank">Privacy Policy</a>.</label>
              </div>
              <div className="check-field">
                <input type="checkbox" tabIndex="3" id="accept-community" disabled={flow.working} checked={flow.acceptCommunity} onChange={this.onChangeAcceptCommunity} />
                <label htmlFor="accept-community">I will respect and uphold Euphoria's <a href target="_blank">rules</a> and <a href target="_blank">values</a>.</label>
              </div>
            </div>
            <div className="action-line">
              <div className="spacer" />
              {flow.agreementError && <div className="error-message">{flow.agreementError}</div>}
              {flow.showSignInButton && <button type="button" tabIndex="4" className="open-sign-in" onClick={accountFlow.openSignIn}>back to sign in</button>}
              <button ref="submit" type="submit" tabIndex="3" className="register" disabled={!flow.valid || flow.working} onClick={accountFlow.register}>register</button>
            </div>
          </div>
        )
      } else if (flow.step == 'forgot') {
        title = 'forgot password?'
        bottom = (
          <div className="bottom">
            <div className="action-line">
              <div className="spacer" />
              <button type="button" tabIndex="4" className="open-sign-in gray" onClick={accountFlow.openSignIn}>back to sign in</button>
              <button ref="submit" type="button" tabIndex="3" className="send-reminder" disabled={!flow.valid || flow.working} onClick={accountFlow.resetPassword}>send a password reset email</button>
            </div>
          </div>
        )
      } else {
        title = 'sign in or register'
        bottom = (
          <div className="bottom">
            <div className="action-line">
              <button type="button" tabIndex="4" className={classNames('forgot', flow.highlightForgot && 'highlight')} disabled={flow.working} onClick={this.onForgotClick}>forgot password?</button>
              <div className="spacer" />
              <button key="register" type="button" tabIndex="4" className="open-register" onClick={this.onRegisterClick}>register</button>
              <button ref="submit" key="sign-in" type="submit" tabIndex="3" className="sign-in" disabled={!flow.valid || flow.working} onClick={accountFlow.signIn}>sign in</button>
            </div>
          </div>
        )
      }

      dialogContent = (
        <form className="content" noValidate onSubmit={this.onSubmit}>
          <label className={classNames('text-field', 'email', flow.emailError && 'error')}>
            email address
            {flow.emailError && <div className="error-message">{flow.emailError}</div>}
            <input ref="emailField" type="email" name="email" tabIndex="1" autoFocus spellCheck="false" disabled={flow.working} onChange={this.onChangeEmail} onBlur={this.onChangeEmail} />
          </label>
          {flow.step != 'forgot' && <label className={classNames('text-field', 'password', flow.passwordError && 'error')}>
            password
            {flow.passwordError && !(this.state.passwordEntryFocused && passwordStrength) ?
              <div className="error-message">{flow.passwordError}</div>
              : passwordStrength
            }
            <input type="password" name="password" tabIndex="2" disabled={flow.working} onChange={this.onChangePassword} onFocus={this.onFocusPassword} onBlur={this.onBlurPassword} />
          </label>}
          {bottom}
        </form>
      )
    }

    return (
      <Popup className="dialog account-dialog">
        <div className="top-line">
          <div className="logo">
            <div className="emoji emoji-euphoria" />
            euphoria
          </div>
          <div className="title">{title}</div>
          <Spinner visible={flow.working} />
          <div className="spacer" />
          <FastButton className="close" onClick={this.props.onClose} />
        </div>
        {dialogContent}
      </Popup>
    )
  },
})
