/** SSR stub for @googlemaps/js-api-loader */
export class Loader {
  constructor(_opts?: unknown) {}
  load() {
    return Promise.resolve({})
  }
  importLibrary() {
    return Promise.resolve({})
  }
}

export function importLibrary(_name?: string) {
  return Promise.resolve({})
}

export function setOptions(_opts?: unknown) {}

export default { Loader, importLibrary, setOptions }
