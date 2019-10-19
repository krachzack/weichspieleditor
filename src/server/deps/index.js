import { locateEspeak } from './espeak.js'
import { locateVlc } from './vlc.js'
import { locateFernspielapparat } from './fernspielapparat.js'

/**
 * @typedef Dependencies Summary of system dependencies
 * @property {Dependency} [espeak] system-provided espeak (optional dependency, except on linux)
 * @property {Dependency} vlc system-provided VLC player (required dependency)
 * @property {Dependency} fernspielapparat system-provided or downloaded fernspielapparat runtime (required)
 */

/**
 * @typedef Dependency
 * @property {string} version version of the dependency
 * @property {string} directory installation directory, where plugins, voices, etc. are, but not necessarily the executable ('.' if has no meaningful value for this dependency)
 * @property {string} binary either an absolute path to a binary or the binary name, to resolve on path with `spawn`
 * @property {Map<string, string>} environment environment variables needed by fernspielapparat to find this dependency
 */

/**
 * Tries to find the `fernspielapparat` dependencies installed on this
 * system.
 *
 * Also checks for a system-provided or pre-installed runtime.
 *
 * Unavailable dependencies have their respective property not defined
 * on the returned object.
 *
 * @param {import('./progress.js').ProgressCallback} [progress] called when starting sub-task or making progress (optional)
 * @returns {Promise<Dependencies>}  summary of system dependencies
 */
export function locateDependencies (progress) {
  return Promise.all([locateEspeak(), locateVlc()])
    .then(([espeak, vlc]) => {
      return locateFernspielapparat(vlc, progress)
        .then(fernspielapparat => {
          const dependencies = { vlc, fernspielapparat }
          if (espeak) {
            // espeak is optional on some platforms
            dependencies.espeak = espeak
          }
          return dependencies
        })
    })
}
