var _ = require('lodash')
var Reflux = require('reflux')
var Immutable = require('immutable')
var Entropizer = require('entropizer')

var chat = require('./chat')


var entropizer = new Entropizer()

var storeActions = Reflux.createActions([
  'reset',
  'openSignIn',
  'openRegister',
  'openForgot',
  'changeEmail',
  'changePassword',
  'changeAcceptLegal',
  'changeAcceptCommunity',
  'signIn',
  'register',
  'resetPassword',
])
_.extend(module.exports, storeActions)

var PasswordStrengthRecord = Immutable.Record({
  level: null,
  message: null,
  ok: false,
})

var passwordWeak = new PasswordStrengthRecord({
  level: 'weak',
  message: 'too simple — add more!',
  ok: false,
})

var passwordStrong = new PasswordStrengthRecord({
  level: 'strong',
  message: 'strong password',
  ok: true,
})

var StateRecord = Immutable.Record({
  step: 'signin',
  email: null,
  password: null,
  passwordStrength: null,
  acceptLegal: false,
  acceptCommunity: false,
  strict: false,
  valid: true,
  emailError: null,
  passwordError: null,
  agreementError: null,
  highlightForgot: false,
  showSignInButton: false,
  passwordResetError: false,
  passwordResetSent: false,
  working: false,
})

module.exports.store = Reflux.createStore({
  listenables: [
    storeActions,
    {loginCompleted: chat.login.completed},
    {loginFailed: chat.login.failed},
    {registerCompleted: chat.registerAccount.completed},
    {registerFailed: chat.registerAccount.failed},
    {resetPasswordCompleted: chat.resetPassword.completed},
    {resetPasswordFailed: chat.resetPassword.failed},
  ],

  mixins: [require('./immutable-mixin')],

  init: function() {
    this.state = new StateRecord()
  },

  getInitialState: function() {
    return this.state
  },

  _reloadPage: function() {
    // FIXME: a page navigation seems to be the most reliable way to get
    // Chrome to offer to save the password. when this is resolved, we should
    // use this.socket.reconnect().
    //
    // see: https://code.google.com/p/chromium/issues/detail?id=357696#c37

    // note: using location.replace instead of reload here so that resources
    // are loaded from cache.
    if (uiwindow.location.hash) {
      uiwindow.location.reload()
    } else {
      uiwindow.location.replace(uiwindow.location)
    }
  },

  loginCompleted: function() {
    if (this.state.get('step') == 'signin') {
      this._reloadPage()
    }
  },

  loginFailed: function(data) {
    this.triggerUpdate(this.state.withMutations(state => {
      var step = state.get('step')
      if (step == 'signin' || step == 'forgot') {
        state.set('working', false)
        if (data.reason == 'account not found') {
          state.set('emailError', 'account not found')
          state.set('valid', false)
        } else if (data.reason == 'access denied') {
          state.set('passwordError', 'no dice, sorry!')
          state.set('valid', false)
          state.set('highlightForgot', true)
        }
      }
    }))
  },

  registerCompleted: function() {
    if (this.state.get('step') == 'register') {
      this.triggerUpdate(this.state.merge({
        step: 'register-email-sent',
        working: false,
      }))
    }
  },

  registerFailed: function(data) {
    this.triggerUpdate(this.state.withMutations(state => {
      if (state.get('step') == 'register') {
        state.set('working', false)
        if (data.reason == 'personal identity already in use') {
          state.set('emailError', 'this email is already in use')
          state.set('valid', false)
          state.set('showSignInButton', true)
        }
      }
    }))
  },

  resetPasswordCompleted: function() {
    if (this.state.get('step') == 'forgot') {
      this.triggerUpdate(this.state.merge({
        step: 'reset-email-sent',
        working: false,
      }))
    }
  },

  resetPasswordFailed: function(data) {
    this.validateUpdate(state => {
      if (state.get('step') == 'forgot') {
        state.set('working', false)
        if (data.error == 'account not found') {
          state.set('emailError', 'account not found')
          state.set('valid', false)
        } else {
          state.set('passwordResetError', 'error sending. try again?')
        }
      }
    })
  },

  reset: function() {
    this.triggerUpdate(new StateRecord())
  },

  openSignIn: function() {
    this.validateUpdate(state => {
      state.set('step', 'signin')
    })
  },

  openRegister: function() {
    this.validateUpdate(state => {
      state.set('step', 'register')
    })
  },

  openForgot: function() {
    this.validateUpdate(state => {
      state.set('step', 'forgot')
    })
  },

  _validateEmail: function(state, fatal) {
    var email = state.get('email')
    var error

    if (!email) {
      if (state.get('strict')) {
        error = 'please enter an email'
      }
    } else if (!/.+@.+/.test(email)) {
      error =  'is that an email address?'
    }

    if (!error || fatal) {
      state.set('emailError', error)
    }
    return !error
  },

  _validatePassword: function(state, fatal) {
    var error

    if (state.get('step') != 'forgot') {
      if (!state.get('password')) {
        if (state.get('strict')) {
          error = 'please enter a password'
        }
      } else if (state.get('step') == 'register' && state.get('passwordStrength').get('level') != 'strong') {
        error = 'please choose a stronger password'
      }
    }

    if (!error || fatal) {
      state.set('passwordError', error)
    }
    return !error
  },

  _validateAgreements: function(state, fatal) {
    var error

    if (state.get('step') == 'register') {
      if (!state.get('acceptLegal') || !state.get('acceptCommunity')) {
        error = 'please accept the agreements above'
      }
    }

    if (!error || fatal) {
      state.set('agreementError', error)
    }
    return !error
  },

  validateUpdate: function(updater) {
    this.triggerUpdate(this.state.withMutations(state => {
      updater(state)
      if (_.all(_.map([
        this._validateEmail,
        this._validatePassword,
        this._validateAgreements,
      ], validator => validator(state)))) {
        state.set('valid', true)
      }
    }))
  },

  validateSubmit: function(callback) {
    this.triggerUpdate(this.state.withMutations(state => {
      state.set('strict', true)
      var valid = _.all(_.map([
        this._validateEmail,
        this._validatePassword,
        this._validateAgreements,
      ], validator => validator(state, true, true)))

      state.set('valid', valid)

      if (valid) {
        state.set('working', true)
        state.set('strict', false)
        callback(state)
      }
    }))
  },

  changeEmail: function(email, check) {
    this.validateUpdate(state => {
      state.set('email', email)
      this._validateEmail(state, check)
    })
  },

  changePassword: function(password, check) {
    this.validateUpdate(state => {
      state.set('password', password)

      var entropy = entropizer.evaluate(password)
      if (entropy < 55) {
        state.set('passwordStrength', passwordWeak)
      } else {
        state.set('passwordStrength', passwordStrong)
      }

      this._validatePassword(state, check)
    })
  },

  changeAcceptLegal: function(value) {
    this.validateUpdate(state => {
      state.set('acceptLegal', value)
      this._validateAgreements(state, false)
    })
  },

  changeAcceptCommunity: function(value) {
    this.validateUpdate(state => {
      state.set('acceptCommunity', value)
      this._validateAgreements(state, false)
    })
  },

  signIn: function() {
    this.validateSubmit(state => {
      chat.login(state.get('email'), state.get('password'))
    })
  },

  register: function() {
    this.validateSubmit(state => {
      chat.registerAccount(state.get('email'), state.get('password'))
    })
  },

  resetPassword: function() {
    this.validateSubmit(state => {
      chat.resetPassword(state.get('email'))
    })
  },
})
