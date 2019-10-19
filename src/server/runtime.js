import { spawn } from 'child_process'
import {
  delimiter
} from 'path'
import waitPort from 'wait-port'
import { locateDependencies } from './deps'

/**
 * Hostname for websockets URL. Not used for binding,
 * which is always to `0.0.0.0:38397`.
 */
const defaultBind = {
  host: '127.0.0.1',
  port: 38397
}
const wsUrl = `ws://${defaultBind.host}:${defaultBind.port}`

/**
 * Describes a fernspielapparat runtime running in a child process,
 * with a server bound to a returned URL.
 *
 * @typedef Runtime
 * @property {import('child_process').ChildProcess} process - Child process running a server-enabled runtime
 * @property {string} url - URL to the running WebSocket server for remote control
 */

/**
 * Spawns a process for the fernspielapparat runtime.
 *
 * The executable is searched for in this applications user dir.
 * If it is not found, a recent version is downloaded from GitHub.
 *
 * Returns a promise for a runtime child process in server mode,
 * bound to `0.0.0.0:38397`, which is the default configuration.
 *
 * @param {import('./progress.js').ProgressCallback} [progress] called when starting sub-task or making progress (optional)
 * @returns {Promise<Runtime>} promise for runtime process
 */
export default function launchRuntime (progress) {
  return locateDependencies(progress).then(
    ({ espeak, vlc, fernspielapparat }) => {
      return launchServer(
        fernspielapparat.binary,
        aggregateEnvironment(espeak ? [espeak, vlc, fernspielapparat] : [vlc, fernspielapparat])
      )
    }
  )
}

function aggregateEnvironment (deps) {
  // these should not be replaced but joined with the standard
  // path separator for the platform
  const envVarsToMerge = ['PATH', 'Path', 'DYLD_LIBRARY_PATH']

  return deps.map(dep => dep.environment)
    .reduce(
      (acc, next) => {
        next.forEach(
          (val, key) => {
            if (key in acc && envVarsToMerge.includes(key)) {
              // certain vars should be concatenated
              acc[key] = `${acc[key]}${delimiter}${val}`
            } else {
              // the rest is overwritten, e.g. VLC plugin path
              acc[key] = val
            }
          }
        )
        return acc
      },
      {}
    )
}

/**
 * Tries to start a child process running the fernspielapparat runtime
 * and resolves to a running child process instance, using the given
 * binary path and environment variables.
 *
 * The runtime is bound to `0.0.0.0:38397`, which is the default configuration.
 *
 * @param {string} pathToBinary Either an absolute path to a binary or `'fernspielapparat'` to use the PATH
 * @param {object} env required env vars by vernspielapparat
 * @returns {Promise<Runtime} promise for running child process with a specified ws URL
 */
function launchServer (pathToBinary, env) {
  return new Promise((resolve, reject) => {
    let starting = true
    const args = [
      '-vvvv', // print debug and info logs on stderr, not only warnings and errors
      '-s' // start in server mode
    ]
    const opts = { env }
    const server = spawn(
      pathToBinary,
      args,
      opts
    )

    server.stdout.on('data', (data) => {
      console.log(data.toString())
    })
    server.stderr.on('data', (data) => {
      console.error(data.toString())
    })

    server.on('exit', (code) => {
      if (code) {
        console.log(`server exited with code ${code}`)
      } else {
        console.log('server exited')
      }

      if (starting) {
        starting = false
        reject(new Error(`fernspielapparat unexpected exit at startup with code ${code}`))
      }
    })
    server.on('error', (err) => {
      reject(new Error(`fernspielapparat could not be started, error: ${err.message}`))
    })

    waitPort(
      {
        ...defaultBind,
        // wait 150ms before each connection attempt
        timeout: 150
      },
      5000 // wait max 5sec for successful server startup
    ).then(
      () => done(),
      () => reject(new Error(
        `fernspielapparat server not available on port ${defaultBind.port} after 5 seconds, giving up.`
      ))
    )

    function done () {
      resolve({
        process: server,
        url: wsUrl
      })
    }
  })
}
