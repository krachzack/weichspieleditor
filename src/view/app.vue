<script>
import connect from './connect'
import serverStartup from '../server/startup.js'

export default {
  data () {
    return {
      url: '',
      connection: null,
      connectError: null
    }
  },
  created () {
    serverStartup.then(url => {
      this.url = url
      return connect({
        url,
        onStart ({ id }) { console.log(`starting phonebook at initial state ${id}`) },
        onTransition ({ from, to }) { console.log(`transitioning from ${from} to ${to}`) },
        onClose() { console.log('disconnected') }
      })
    }).then(
      connection => {
        this.connection = connection
      },
      err => {
        let connection = this.url ? `Connection to ${this.url}` : 'Connection'
        connectError = `${connection} could not be established. Error: ${err.message}`
        console.error(err)
      }
    )
  },
  computed: {
    phase () {
      if (this.url === '') {
        // waiting for server startup
        return 'waiting'
      } else if (this.connectError) {
        return 'failure'
      } else if (this.connection !== null) {
        return 'connected'
      } else if (this.connection === null) {
        return 'connecting'
      } else {
        throw new Error('inconsistent state')
      }
    }
  }
}
</script>

<template>
  <section class="main-content-outer-wrapper">
    <transition name="fade-out">
      <div class="overlay-load" v-if="phase != 'connected'">
        <header v-if="phase == 'waiting'">
          <p>weichspielapparat is getting ready...</p>
          <p>Some Software needs to be downloaded on the first run.</p>
          <p>Hang on tight, this will not take long.</p>
        </header>
        <header v-if="phase == 'connecting'">
          <p>Almost done, connecting to {{url}}.</p>
        </header>
        <header v-if="phase == 'failure'">
          <p>Fatal error when trying to connect to server: {{connectError}}.</p>
        </header>
      </div>
    </transition>
    <transition name="fade-out">
      <div class="main-content-wrapper" v-if="phase == 'connected'">
        <header class="header-bar">
          weichspielapparat
        </header>
        <main class="main-content">
          <p>Server running on {{connection.url}}, all systems ready.</p>
        </main>
      </div>
    </transition>
  </section>
</template>

<style scoped>
.main-content-outer-wrapper {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.main-content-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  align-items: stretch;
  align-content: stretch;
}

.overlay-load {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: #444444;
}

.overlay-load header {
  color: white;
  font-size: 2em;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.fade-out-enter-active, .fade-out-leave-active {
  transition: opacity .5s;
}
.fade-out-enter, .fade-out-leave-to {
  opacity: 0;
}

.header-bar {
  background-color: #555;
  flex-grow: 1;
  padding: 1em 2em;
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.main-content {
  flex-grow: 1000;
  padding: 1em 2em;
  background-color: white;
  font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;
}
</style>