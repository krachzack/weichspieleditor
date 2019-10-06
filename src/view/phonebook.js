import YAML from 'yaml'

/**
 * @param {File} file file to load it from
 * @returns {Promise<Object>} decoded phonebook
 */
export function load (file) {
  return validateFilename(file)
    .then(loadFile)
    .then(YAML.parse)
    .then(validateContents)

  function validateFilename (file) {
    const expectedPattern = /\.yaml$/i

    if (!expectedPattern.test(file.name)) {
      return Promise.reject(new Error('Phonebook files must end in .yaml'))
    }

    return Promise.resolve(file)
  }

  function loadFile (file) {
    if (!FileReader) {
      return Promise.reject(new Error('Your browser does not support or allow loading of local files. Consider using Firefox.'))
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = err => {
        reject(new Error(
          `File reading error: ${err}`
        ))
      }
      reader.readAsText(file)
    })
  }

  function validateContents ({ initial, states, transitions, sounds }) {
    if (!states) {
      return Promise.reject(new Error('no states in phonebook'))
    }

    return {
      initial,
      states,
      transitions,
      sounds
    }
  }
}
