/**
 * Mock de pino para que WalletConnect (y stellar-wallets-kit) no carguen
 * las dependencias Node (thread-stream, etc.) en el bundle del cliente.
 */
const noop = () => {}
const levels = { values: { trace: 10, debug: 20, info: 30, warn: 40, error: 50 } }

function createLogger() {
  return {
    child: () => createLogger(),
    bindings: () => ({}),
    level: "silent",
    trace: noop,
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    fatal: noop,
  }
}

function pino(_opts) {
  return createLogger()
}

pino.levels = levels
export default pino
export { levels }
