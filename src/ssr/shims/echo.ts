/** SSR stub for laravel-echo / pusher-js */
export default class Echo {
  connector = { pusher: { connection: null } }
  channel() {
    return this
  }
  private() {
    return this
  }
  leave() {
    return this
  }
  disconnect() {
    return this
  }
  listen() {
    return this
  }
  stopListening() {
    return this
  }
}
