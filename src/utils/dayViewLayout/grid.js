import Island from './island'
import Row from './row'

export default class Grid {
  constructor (events = []) {
    this._events = events
    this.eventsInRenderOrder = []
    this.rows = []
    this.islands = []

    // Order by earliest start time, then by duration.
    const sorted = events.sort((a, b) => {
      if (a.start === b.start) {
        return b.end - a.end
      }

      return a.start - b.start
    })

    this.sortedEvents = [...sorted]
  }

  get currentEventIndex () {
    return this.eventsInRenderOrder.length - 1
  }

  createRenderOrder = () => {
    while (this.sortedEvents.length > 0) {
      const [ event ] = this.sortedEvents.splice(0, 1)
      event && this.eventsInRenderOrder.push(event)

      for (let i = 0; i < this.sortedEvents.length; i++) {
        const test = this.sortedEvents[i]

        // Still inside this event, so look for next
        if (event.end > test.start) {
          continue
        }

        // We've found the first event of the next event island.
        // If that event is not right next to our current event, we have to
        // move it here.
        if (i > 0) {
          const [ event ] = this.sortedEvents.splice(i, 1)
          event && this.eventsInRenderOrder.push(event)
        }

        // We've already found the next event island, so stop looking.
        break
      }
    }

    this.events = [...this.eventsInRenderOrder]
    this.createIslands()
  }

  take = index => {
    const [ event ] = this.events.splice(index, 1)
    return event
  }

  createIslands = () => {
    let next = undefined

    while (this.events.length > 0 && next !== null) {
      next = this.findNextIsland(next)
    }
  }


  findNextIsland = (event) => {
    let next

    if (!event) {
      next = this.take(0)
    }

    if (!next) return

    // Check if this event can go into another island
    const island = this.islands.find(island => island.endSlot > next.startSlot)

    // Found an Island the event, so we add it there.
    if (island) {
      island.addEvent(next)
    } else {
      // Couldn't find an Island, so we create a new.
      this.islands.push(new Island(next))
    }

    return next
  }
}
