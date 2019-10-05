import YAML from 'yaml'

const protocol = 'fernspielctl'

/**
 * @typedef ConnectOpts
 * @property {string} url - Websockets URL, e.g. `ws://127.0.0.1:38397
 * @property {function} [onTransition] - callback on transitions between two states
 * @property {function} [onStart] - callback after initial state of new phonebook entered
 * @property {function} [onClose] - callback after successful closing of the connection
 */

/**
 * @typedef Connection
 * @property {string} url - Websockets URL, e.g. `ws://127.0.0.1:38397`
 * @property {function} onTransition - callback on transitions between two states
 * @property {function} onStart - callback after initial state of new phonebook entered
 * @property {function} onClose - callback after successful closing of the connection
 * @property {function} close - call this parameterless function to close the connection
 * @property {function} dial - dials a given string of symbols like `"1 h 123"`
 */

/**
 * Connect to fernspielapparat server running at the websockets url
 * provided with the options object.
 * 
 * @param {ConnectOpts} opts sets url to connect to and optional callbacks
 * @returns {Promise<Connection>} promise for a connections object after successful connection
 */
export default function connect(opts) {
  if (!opts || !opts.url) {
    throw new Error(
      `Expected parameters object containing at least an url, but got ${JSON.stringify(opts)}`
    )
  }

  return new Promise((resolve, reject) => {
    const url = opts.url
    let socket = new window.WebSocket(url, protocol)
    const connection = {
      url,
      onTransition: opts.onTransition || (() => {}),
      onStart: opts.onStart || (() => {}),
      onClose: opts.onClose || (() => {}),
      close () {
        socket.close()
        socket = undefined
      },
      dial (symbols) {
        socket.send(JSON.stringify({
          invoke: 'dial',
          with: symbols
        }))
      }
    }
    Object.freeze(connection)

    socket.onopen = _evt => {
      resolve(connection)
    }
    socket.onerror = () => {
      // errors after onopen are ignored by reject
      reject(new Error(`Could not connect to ${url}.`))
    }
    socket.onclose = () => {
      connection.onClose(connection)
    }
    socket.onmessage = ({ data }) => {
      handleMessage(
        YAML.parse(data)
      )
    }

    function handleMessage (message) {
      if (message.type === 'transition') {
        const { from, to: { id: to } } = message
        if (typeof to === 'string' && typeof from === 'string') {
          connection.onTransition({ connection, from, to })
        }
      } else if (message.type === 'start') {
        const { initial: { id } } = message
        if (typeof id === 'string') {
          connection.onStart({ connection, id })
        }
      }
    }    
  })
}
