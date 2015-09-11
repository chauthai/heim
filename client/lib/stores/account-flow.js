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
  'changePassword',
])
_.extend(module.exports, storeActions)

var StateRecord = Immutable.Record({
  state: 'default',
  passwordError: null,
  emailError: null,
  highlightForgot: false,
  passwordStrength: null,
})

var PasswordStrengthRecord = Immutable.Record({
  level: null,
  message: null,
  ok: false,
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
    this.triggerUpdate(this.state.set('state', 'register'))
  },

  changePassword: function(password) {
    var entropy = entropizer.evaluate(password)
    if (entropy < 55) {
      this.triggerUpdate(this.state.set('passwordStrength', new PasswordStrengthRecord({
        level: 'weak',
        message: 'too simple — add more!',
        ok: false,
      })))
    } else {
      this.triggerUpdate(this.state.set('passwordStrength', new PasswordStrengthRecord({
        level: 'strong',
        message: 'strong password',
        ok: true,
      })))
    }
  },
})
