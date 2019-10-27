export default class ApplicationError implements Error {
  public name = 'ApplicationError'

  // eslint-disable-next-line no-useless-constructor
  constructor(public message: string) {}

  toString() {
    return this.name + ': ' + this.message
  }
}
