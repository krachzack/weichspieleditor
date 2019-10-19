import { app } from 'electron'
import os from 'os'
import fs from 'fs'
import { spawn } from 'child_process'
import { releaseTarballUrl } from './releases.js'
import { downloadTarball } from './github.js'
import { decompress } from 'targz'
import {
  reportGitHubQuery,
  reportDownloadTarball,
  reportExtractingTarball
} from '../progress.js'

const executableName = (os.platform() === 'win32') ? 'fernspielapparat.exe' : 'fernspielapparat'
const userDir = getUserDir()

/**
 * Tries to find in this order:
 * * a version of the `fernspielapparat` runtime on the path,
 * * a `fernspielapparat` runtime previously downloaded by weichspielapparat,
 * * the newest version on GitHub for download and reuse on the next restart.
 *
 * @param {import('./index').Dependency} vlcDep vlc dependency
 * @param {import('../progress.js').ProgressCallback} [progress] called when starting sub-task or making progress (optional)
 * @returns {Promise<import('./index').Dependency>} promise for a fernspielapparat runtime
 */
export function locateFernspielapparat (vlcDep, progress) {
  return version(executableName) // try on path
    // then try if a previous invocation downloaded to user dir and use that
    .catch(() => fernspielapparatPathInUserDir().then(version))
    // no runtime pre-installed or on PATH, download it
    // this may take some time, so report on the progress
    .catch(() => downloadBinary(progress).then(version))
    .then(({ binary, version }) => {
      return {
        binary,
        directory: '.',
        version,
        environment: new Map()
      }
    })

  function version (executable) {
    return detectVersion(vlcDep, executable)
  }
}

/**
 * Invokes the runtime with the `--version` option and resolves
 * to an object holding the `executablePathOrName` parameter as
 * `binary` and the SemVer version string of the runtime as `version`.
 *
 * @param {import('./index').Dependency} vlcDep vlc dependency
 * @param {Promise<string>} executablePathOrName
 */
function detectVersion (vlcDep, executablePathOrName) {
  return new Promise((resolve, reject) => {
    const fernspielapparat = spawn(
      executablePathOrName,
      [
        '--version' // only print version and then exit
      ],
      {
        env: (() => {
          const env = {}
          vlcDep.environment.forEach(
            (v, k) => { env[k] = v }
          )
          return env
        })()
      }
    )
    let output = ''
    fernspielapparat.stdout.on('data', (data) => {
      output += data
    })
    fernspielapparat.stderr.on('data', (data) => {
      output += data
    })
    fernspielapparat.on('error', (err) => {
      reject(new Error(`No fernspielapparat on path, error: ${err.message}`))
    })
    fernspielapparat.on('exit', (code) => {
      if (code) {
        reject(new Error(`Unsuccessful exit status: ${code}, Output: "${output}"`))
      } else {
        const outputWords = output.split(' ')

        if (outputWords.length === 2) {
          const version = output.split(' ')[1].trim() // parse "fernspielapparat 0.1.0"
          resolve(version)
        } else {
          console.log(`Unexpected output from fernspielapparat runtime: ${output}`)
          reject(new Error(`Unexpected output from fernspielapparat runtime: ${output}`))
        }
      }
    })
  }).then(version => {
    return {
      binary: executablePathOrName,
      version
    }
  })
}

function fernspielapparatPathInUserDir () {
  const binaryPath = userBinaryPath()
  // must be able to update (write), and execute (read + execute)
  const perms = (os.platform() === 'win32') ? (fs.constants.R_OK) : (fs.constants.R_OK | fs.constants.X_OK)

  return new Promise((resolve, reject) => {
    fs.access(binaryPath, perms, (err) => {
      if (err) {
        reject(new Error(`Lacking execution permissions for runtime binary at: ${binaryPath}, error: ${err.message}`))
      } else {
        console.log(`using previously downloaded runtime ${binaryPath}`)
        resolve(binaryPath)
      }
    })
  })
}

/**
 * Gets the absolute path where the runtime binary would be stored for this user
 * if `downloadBinary` has been called prior to the call and the binary has not
 * been manually deleted.
 *
 * @returns {string} path in userdir where binaries are downloaded to
 */
function userBinaryPath () {
  // FIXME this kinda sounds like a huge security hole - an attacker could manipulate the directory
  //       maybe downloading it every time into an unnamed file would be better?
  return `${userDir}/${executableName}`
}

/**
 * Downloads a fernspielapparat binary from GitHub and places it
 * in the user directory.
 *
 * @param {import('../progress.js').ProgressCallback} [progress] called when starting sub-task or making progress
 * @returns {Promise<string>} a promise for the downloaded binary in the user dir
 */
function downloadBinary (progress) {
  reportGitHubQuery(progress)
  return releaseTarballUrl()
    .then(url => {
      reportDownloadTarball(progress)
      return url
    })
    .then(url => downloadTarball(
      url,
      `fernspielapparat.tar.gz`,
      progress
    ))
    .then(tarball => {
      reportExtractingTarball(progress)
      return tarball
    })
    .then(extractExecutableToUserDir)
}

function extractExecutableToUserDir (tarPath) {
  return new Promise((resolve, reject) => {
    let binary
    decompress({
      src: tarPath,
      dest: userDir,
      tar: {
        ignore: file => {
          const isExecutable = !!(/fernspielapparat$/.test(file) || /fernspielapparat.exe$/.test(file))
          if (isExecutable) {
            binary = file
          }
          return !isExecutable
        },
        map: header => {
          if (/fernspielapparat$/.test(header.name)) {
            header.name = 'fernspielapparat'
          } else if (/fernspielapparat.exe$/.test(header.name)) {
            header.name = 'fernspielapparat.exe'
          } else {
            header = null // ignore the other files
          }

          return header
        }
      }
    }, (err) => {
      if (err) {
        const msg = err.message || err
        reject(new Error(`Failed to decompress release, error: ${msg}.`))
      } else if (!binary) {
        reject(new Error('Could not find executable in tarball'))
      } else {
        console.log(`extracted binary: ${binary}`)
        resolve(binary)
      }
    })
  })
}

/**
 * Asks electron for the `userData` directory and throws an error if it
 * did not work.
 *
 * @returns {string} a directory to store persistent data for this user
 */
function getUserDir () {
  const userDir = app.getPath('userData')
  if (!userDir) {
    throw new Error('Could not find userData directory')
  }
  return userDir
}
