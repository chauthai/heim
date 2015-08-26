var _ = require('lodash')
var Reflux = require('reflux')
var Immutable = require('immutable')

var chat = require('./chat')
var socket = require('./socket')
var ui = require('./ui')


var storeActions = Reflux.createActions([
  'reset',
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

  },
})
