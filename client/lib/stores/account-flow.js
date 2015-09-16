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
  acceptLegal: false,
  acceptCommunity: false,
  valid: true,
  emailError: null,
  passwordError: null,
  agreementError: null,
  highlightForgot: false,
  showSignInButton: false,
  passwordStrength: null,
  working: false,
})

module.exports.store = Reflux.createStore({
  listenables: [
    storeActions,
    {loginCompleted: chat.login.completed},
    {loginFailed: chat.login.failed},
    {registerCompleted: chat.register.completed},
    {registerFailed: chat.register.failed},
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
    uiwindow.location.replace(window.location)
  },

  loginCompleted: function() {
    if (this.state.get('step') == 'signin') {
      this._reloadPage()
    }
  },

  loginFailed: function(data) {
    this.validateUpdate(state => {
      if (state.get('step') == 'signin') {
        state.set('working', false)
        if (data.reason == 'account not found') {
          state.set('emailError', 'account not found')
        } else if (data.reason == 'access denied') {
          state.set('passwordError', 'no dice, sorry!')
          state.set('highlightForgot', true)
        }
      }
    })
  },

  registerCompleted: function() {
    if (this.state.get('step') == 'register') {
      this._reloadPage()
    }
  },

  registerFailed: function(data) {
    this.validateUpdate(state => {
      if (state.get('step') == 'register') {
        state.set('working', false)
        if (data.reason == 'personal identity already in use') {
          state.set('emailError', 'this email is already in use')
          state.set('showSignInButton', true)
        }
      }
    })
  },

  reset: function() {
    this.triggerUpdate(new StateRecord())
  },

  openRegister: function() {
    this.triggerUpdate(this.state.set('step', 'register'))
  },

  openForgot: function() {
    this.triggerUpdate(this.state.set('step', 'forgot'))
  },

  _validateEmail: function(state, fatal) {
    var email = state.get('email')
    var error

    if (!email) {
      error =  'please enter an email'
    } else if (!/.+@.+/.test(email)) {
      error =  'is that an email address?'
    }

    if (!error || fatal) {
      state.set('emailError', error)
    }
  },

  _validatePassword: function(state, fatal) {
    var error

    if (!state.get('password')) {
      error = 'please enter a password'
    } else if (state.get('step') == 'register' && state.get('passwordStrength').get('level') != 'strong') {
      error = 'please choose a stronger password'
    }

    if (!error || fatal) {
      state.set('passwordError', error)
    }
  },

  _validateAgreements: function(state, fatal) {
    var error

    if (!state.get('acceptLegal') || !state.get('acceptCommunity')) {
      error = 'please accept the agreements above'
    }

    if (!error || fatal) {
      state.set('agreementError', error)
    }
  },

  _isValid: function(state) {
    if (state.get('emailError') || state.get('passwordError')) {
      return false
    }

    if (state.get('step') == 'register' && state.get('agreementError')) {
      return false
    }

    return true
  },

  validateUpdate: function(updater) {
    this.triggerUpdate(this.state.withMutations(state => {
      updater(state)
      if (this._isValid(state)) {
        state.set('valid', true)
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
    this.triggerUpdate(this.state.withMutations(state => {
      this._validateEmail(state, true)
      this._validatePassword(state, true)

      var valid = this._isValid(state)
      state.set('valid', valid)

      if (valid) {
        state.set('working', true)
        chat.login(state.get('email'), state.get('password'))
      }
    }))
  },

  register: function() {
    this.triggerUpdate(this.state.withMutations(state => {
      this._validateEmail(state, true)
      this._validatePassword(state, true)
      this._validateAgreements(state, true)

      var valid = this._isValid(state)
      state.set('valid', valid)

      if (valid) {
        state.set('working', true)
        chat.register(state.get('email'), state.get('password'))
      }
    }))
  },
})
