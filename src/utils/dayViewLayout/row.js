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

    if (next.title === 'Event 10') {
      console.log
    }

    // Check if this event can go into another island
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
    event.setIsland(this)
  }

  get startSlot () {
    return this.event.startSlot
  }

  get endSlot () {
    return this.event.endSlot
  }

  get nbrOfColumns () {
    return this.rows.reduce((max, row) => {
      return Math.max(max, row.columns + 1)
    }, 1)
  }

  createRow = (firstEvent) => {
    const row = new Row(this.id, firstEvent)
    this.rows.push(row)
    return row
  }

  addEvent = (event) => {
    event.setIsland(this)

    // console.log(`Add ${event.title} to island`)
    if (this.rows.length === 0) {
      this.createRow(event)
      return
    }

    // Find a place for it. Start from behind.
    for (let i = this.rows.length - 1; i >= 0; i--) {
      const lastRow = this.rows[i]

      if (event.title === 'Event 10') {
        console.log(`Finding row for ${event.title}`)
        console.log([...this.rows])
        console.log(lastRow)
      }

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
