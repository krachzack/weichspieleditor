module.exports = {
  randomBetween (low, high) {
    return Math.floor(low + Math.random() * (high - low))
  }
}
