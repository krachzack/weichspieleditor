import Vue from 'vue'
import App from '../app.vue'

waitForDomReady()
  .then(() => new Vue({
    el: document.querySelector('#app'),
    render: h => h(App)
  }))

function waitForDomReady () {
  return new Promise(resolve => {
    window.addEventListener('DOMContentLoaded', () => {
      resolve()
    })
  })
}