const isOverlapping = (a, b) => {
  if (b.startSlot < a.endSlot) return true

  if (b.startSlot < a.startSlot && b.endSlot > a.startSlot) {
    return true
  }

  return false
}

export class Grid {
  constructor (events = []) {
    // This is the end product.
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
    this.events = [...sorted]
  }

  get currentEventIndex () {
    return this.eventsInRenderOrder.length - 1
  }

  createRenderOrder = () => {
    let next = undefined
    let currentLevel = 0

    while (this.events.length > 0 && next !== null) {
      next = this.findNextIsland(next)
    }
  }

  take = index => {
    const [ event ] = this.events.splice(index, 1)
    this.eventsInRenderOrder.push(event)
    return event
  }

  findNextIsland = (event) => {
    let next

    if (!event) {
      next = this.take(0)
    }

    if (!next) return

    // console.log(`Finding island for ${next.title}`)

    // Check if this event can go into another row
    const island = this.islands.find(island => {
      return isOverlapping(island, next)
    })

    if (island) {
      // console.log(`${next.title} can fit in island ${island.title}`)
      island.addEvent(next)
    } else {
      // console.log(`Couldn't find an island for ${next.title}. Create new.`)
      this.islands.push(new Island(next))
    }

    for (let i = 0; i < this.events.length && !next; i++) {
      const test = this.events[i]
      if (test.start > event.end) {
        next = this.take(i)
      }
    }

    return next
  }
}

let islandId = 0

class Island {
  constructor (event) {
    this.id = islandId++
    this.title = event.title
    this.event = event
    this.rows = []
  }

  get startSlot () {
    return this.event.startSlot
  }

  get endSlot () {
    return this.event.endSlot
  }

  createRow = (firstEvent) => {
    const row = new Row(this.id, firstEvent)
    this.rows.push(row)
    return row
  }

  addEvent = (event) => {
    console.log(`Add ${event.title} to island ${this.title}`)
    if (this.rows.length === 0) {
      this.createRow(event)
    }

    // Find a place for it. Start from behind.
    for (let i = this.rows.length - 1; i >= 0; i--) {
      const lastRow = this.rows[i]
      console.log({lastRow})

      if (isOverlapping(lastRow, event)) {
        console.log(`Found overlapping event for ${event.title}`)
        // console.log(i, {lastEvent})
      }
    }
  }
}

let rowId = 0

export class Row {
  constructor (island, firstEvent) {
    console.log(`Create new row ${firstEvent.title}`)
    this.id = rowId++
    this.island = island
    this.title = firstEvent.title
    this.rows = []
    this.items = [firstEvent]
    firstEvent.setRow(this.id, 0)
  }

  get firstEvent () {
    return this.items[0]
  }

  get startSlot () {
    return this.firstEvent.startSlot
  }

  get endSlot () {
    return this.firstEvent.endSlot
  }

  addEvent = (event) => {
    event.setRow(this.id, this.items.length)
    this.items.push(event)
  }
}
