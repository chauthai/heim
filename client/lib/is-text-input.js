module.exports = function(el) {
  var isTextArea = el.nodeName == 'TEXTAREA'
  var isTextInput = el.nodeName == 'INPUT' && (el.type == 'text' || el.type == 'password' || el.type == 'email')
  return isTextArea || isTextInput
}
