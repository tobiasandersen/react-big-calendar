export default class Row {
  constructor (firstEvent) {
    this.events = [firstEvent]
    firstEvent.setRow(this, 0)
  }

  get firstEvent () {
    return this.events[0]
  }

  get startSlot () {
    return this.firstEvent.startSlot
  }

  get endSlot () {
    return this.firstEvent.endSlot
  }

  get columns () {
    return this.events.length
  }

  addEvent = (event) => {
    event.setRow(this)
    this.events.push(event)
  }
}
