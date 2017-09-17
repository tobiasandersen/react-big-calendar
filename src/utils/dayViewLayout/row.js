const isOverlapping = (a, b) => {
  if (b.startSlot < a.endSlot) return true

  if (b.startSlot < a.startSlot && b.endSlot > a.startSlot) {
    return true
  }

  return false
}

export class Grid {
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
    this.events = [...sorted]
  }

  get currentEventIndex () {
    return this.eventsInRenderOrder.length - 1
  }

  createRenderOrder = () => {
    while (this.sortedEvents.length > 0) {
      const [ event ] = this.sortedEvents.splice(0, 1)
      this.eventsInRenderOrder.push(event)

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
          this.eventsInRenderOrder.push(event)
        }

        // We've already found the next event island, so stop looking.
        break
      }
    }
  }

  take = index => {
    const [ event ] = this.events.splice(index, 1)
    // this.eventsInRenderOrder.push(event)
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

      if (event.end > test.end) {
        console.log('test.start > event.end')
        next = this.take(i)
        continue
      }

      if (i > 0) {
        console.log('i > 0')
        grid.take(i)
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
    // console.log(`Add ${event.title} to island`)
    if (this.rows.length === 0) {
      this.createRow(event)
      return
    }

    // Find a place for it. Start from behind.
    for (let i = this.rows.length - 1; i >= 0; i--) {
      const lastRow = this.rows[i]
      // console.log({lastRow})

      if (isOverlapping(lastRow, event)) {
        lastRow.addEvent(event)
        return
      }
    }

    this.createRow(event)
  }
}

let rowId = 0

export class Row {
  constructor (island, firstEvent) {
    // console.log(`Create new row ${firstEvent.title}`)
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
    // console.log(`Adding ${event.title} to ${this.title}`)
    event.setRow(this.id, this.items.length)
    this.items.push(event)
  }
}
