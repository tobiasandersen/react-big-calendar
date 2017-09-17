export default class Row {
  constructor (island, firstEvent) {
    this.island = island
    this.title = firstEvent.title
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
    // console.log(`Adding ${event.title} to ${this.title}`)
    event.setRow(this , this.events.length)
    this.events.push(event)
  }
}
