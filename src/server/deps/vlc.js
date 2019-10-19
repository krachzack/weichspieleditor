import { join, delimiter } from 'path'
import os from 'os'
import { spawn } from 'child_process'

const platform = os.platform()
const executableName = (platform === 'win32') ? 'vlc.exe' : 'vlc'

/**
 * Tries to find a VLC installation on this system.
 *
 * @returns {Promise<import('./index').Dependency>} promise for VLC dependency, if present on the system
 */
export function locateVlc () {
  return Promise.all([
    vlcLibDir(),
    vlcPluginDir(),
    vlcBinary()
  ])
    .then(([directory, pluginDir, { binary, version }]) => {
      return {
        version,
        directory: vlcBinaryDir(),
        binary,
        environment: environment(directory, pluginDir)
      }
    })
}

function environment (vlcLibDir, vlcPluginDir) {
  const map = new Map()

  const env = {
    ...process.env
  }

  const vlcRegex = /vlc/i
  if (platform === 'darwin') {
    // Set DYLD_PATH and vlc plugin dir if not set by user
    // to facilitate linking to libvlc
    if (!vlcRegex.exec(env.DYLD_LIBRARY_PATH)) {
      const prefix = env.DYLD_LIBRARY_PATH
        ? `${env.DYLD_LIBRARY_PATH}${delimiter}`
        : ''
      map.set('DYLD_LIBRARY_PATH', `${prefix}${vlcLibDir}`)
    }
    // And plugin dir
    if (!env.VLC_PLUGIN_PATH) {
      map.set('VLC_PLUGIN_PATH', `${vlcPluginDir}`)
    }
  } else if (platform === 'win32') {
    if (!vlcRegex.exec(env.Path)) {
      // No VLC on the path, add the detected lib directory to path
      // so dynamic linking works
      map.set('Path', `${env.Path}${delimiter}${vlcLibDir}`)
    }

    if (!env.VLC_PLUGIN_PATH) {
      map.set('VLC_PLUGIN_PATH', `${vlcPluginDir}`)
    }
  }
  // rely on default values on linux and other platforms

  return map
}

/**
 * Executable binary of VLC and its version, if installed.
 *
 * @returns {Promise<Object>} object with absolute path to VLC `binary`, and the `version` of the binary
 */
function vlcBinary (vlcDir) {
  // vlcdir is empty on linux, this is ok, just use the version on the path
  const binary = join(
    vlcBinaryDir(),
    executableName
  )

  return vlcVersion(binary)
    .then(version => {
      return {
        binary,
        version
      }
    })
}

/**
 * Starts a VLC instance with the `--version` flag and collects stderr output.
 *
 * @param {string} vlcBinary absolute path to VLC binary
 * @returns {Promise<string>} version output like `"VLC media player 2.2.5.1 Umbrella (revision 2.2.5.1-0-gad4656a)"`
 */
function vlcVersion (vlcBinary) {
  return new Promise((resolve, reject) => {
    let output = ''
    const vlc = spawn(
      vlcBinary,
      ['--version'],
      {}
    )
    vlc.stdout.on('data', (data) => {
      output += data.toString()
    })
    vlc.on('exit', (code) => {
      if (code) {
        reject(new Error(`vlc exited with code ${code}`))
      } else {
        const version = output.split('\n')[0]
        console.log('version', version)
        resolve(version)
      }
    })
    vlc.on('error', (err) => {
      const style = 'style="display:block; margin-top: 0.5em; color: white; border-radius: 1em; border: 0.2em solid white; padding: 0.4em 0.8em"'
      reject(new Error(`vlc could not be started: ${err.message} - Consider downloading a recent 64-bit version of VLC and then restarting. <a ${style} href="https://www.videolan.org/vlc">Download VLC</a>`))
    })
  })
}

function vlcPluginDir () {
  if (platform === 'darwin') {
    return '/Applications/VLC.app/Contents/MacOS/plugins'
  } else if (platform === 'win32') {
    return `${process.env.ProgramFiles}\\VideoLAN\\VLC\\plugins`
  } else {
    return ''
  }
}

/**
 * @returns {string} absolute path to the VLC installation, _excluding_ a trailing path separator
 */
function vlcLibDir () {
  if (platform === 'darwin') {
    // without the lib, the loader searches in that subdirectory automatically
    return '/Applications/VLC.app/Contents/MacOS:/Applications/VLC.app/Contents/MacOS/lib'
  } else if (platform === 'win32') {
    return `${process.env.ProgramFiles}\\VideoLAN\\VLC`
  } else {
    return ''
  }
}

function vlcBinaryDir () {
  if (platform === 'darwin') {
    // without the lib, the loader searches in that subdirectory automatically
    return '/Applications/VLC.app/Contents/MacOS'
  } else if (platform === 'win32') {
    return `${process.env.ProgramFiles}\\VideoLAN\\VLC`
  } else {
    return ''
  }
}
