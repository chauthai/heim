module.exports = function clamp(min, v, max) {
  return Math.min(Math.max(min, v), max)
}
