import os from 'os'
import { spawn } from 'child_process'
import which from 'which'

const platform = os.platform()
const binary = (platform === 'win32') ? 'espeak.exe' : 'espeak'
const espeakOptional = platform === 'win32' || platform === 'darwin'

/**
 * Tries to find espeak on the path.
 *
 * If not found, resolves to `null` on platforms where espeak is optional.
 *
 * On platforms where espeak is required, resolves to an error if not found.
 *
 * @returns {Promise<import('./index').Dependency>} promise for espeak dependency
 */
export function locateEspeak () {
  return espeakVersion(which.sync(binary, {nothrow: true}) || binary)
    .then(
      ({ binary, version, directory }) => {
        return {
          version,
          directory,
          binary,
          environment: new Map()
        }
      },
      err => {
        if (espeakOptional) {
          // Windows or Mac: we can just use system-provided speech synthesis as a fallback
          return null
        } else {
          // Linux and other platforms: espeak is required for speech
          return err
        }
      }
    )
}

/**
 * @returns {Promise<Object>} `version` and data `directory` of espeak found on path
 */
function espeakVersion (binary) {
  return new Promise((resolve, reject) => {
    let output = ''
    const espeak = spawn(
      binary,
      ['--version'],
      {}
    )
    espeak.stdout.on('data', (data) => {
      output += data.toString()
    })
    espeak.on('exit', (code) => {
      if (code) {
        reject(new Error(`espeak exited with code ${code}`))
      } else {
        // typical output:
        // speak text-to-speech: 1.48.03  04.Mar.14   Data at: /usr/local/Cellar/espeak/1.48.04_1/share/espeak-data
        const words = output.split(' ')
        const version = words[2]
        const directory = words[words.length - 1].trim()

        if (version && directory) {
          resolve({
            binary,
            version,
            directory
          })
        } else {
          reject(new Error(`failed to detect version from espeak output: ${output}`))
        }
      }
    })
    espeak.on('error', (err) => {
      reject(new Error(`espeak could not be started to detect version, error: ${err.message}`))
    })
  })
}
