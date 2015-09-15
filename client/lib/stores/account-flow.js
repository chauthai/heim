var _ = require('lodash')
var Reflux = require('reflux')
var Immutable = require('immutable')
var Entropizer = require('entropizer')

var chat = require('./chat')
var ui = require('./ui')


var entropizer = new Entropizer()

var storeActions = Reflux.createActions([
  'reset',
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

passwordStrong = new PasswordStrengthRecord({
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
  passwordStrength: null,
  working: false,
})

module.exports.store = Reflux.createStore({
  listenables: [
    storeActions,
    {chatUpdate: chat.store},
  ],

  mixins: [require('./immutable-mixin')],

  init: function() {
    this.state = new StateRecord()
  },

  getInitialState: function() {
    return this.state
  },

  chatUpdate: function(chatState) {
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
      error =  'please provide an email'
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
      error = 'please provide a password'
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
      error = 'please accept the agreements above.'
    }

    if (!error || fatal) {
      state.set('agreementError', error)
    }
  },

  _isValid: function(state) {
    if (state.get('emailError')) {
      return false
    }

    if (state.get('step') == 'register' && (state.get('passwordError') || state.get('agreementError') || state.get('error'))) {
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
      }
    }))
  },
})
