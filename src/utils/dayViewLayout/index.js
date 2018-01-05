import EventProxy from './event-proxy'

/**
 * Returns true if event b is considered to be "inside" event a.
 */
function contains(a, b) {
  return (
    a.startSlot <= b.startSlot && // a starts before, or at the same time as, b.
    a.endSlot >= b.endSlot // a ends after, or ar at the same time as, b.
  )
}

/**
 * Return true if event a and b overlaps.
 */
function isOverlapping(a, b) {
  const startDiff = Math.abs(b.startSlot - a.startSlot)
  const endDiff = Math.abs(b.endSlot - a.endSlot)

  if (startDiff >= 60 && endDiff >= 60) {
    return false
  }

  if (b.startSlot < a.endSlot) {
    return true
  }

  if (b.startSlot < a.startSlot && b.endSlot > a.startSlot) {
    return true
  }

  return false
}

function sortByRender(events) {
  // Sort events according to:
  // 1. start time
  // 2. duration
  const sortedByTime = events.sort((a, b) => {
    if (a.start === b.start) {
      return b.end - a.end
    }

    return a.start - b.start
  })

  const sorted = []

  while (sortedByTime.length > 0) {
    const [ event ] = sortedByTime.splice(0, 1)
    event && sorted.push(event)

    for (let i = 0; i < sortedByTime.length; i++) {
      const test = sortedByTime[i]

      // Still inside this event, look for next.
      if (event.end > test.start) {
        continue
      }

      // We've found the first event of the next event group.
      // If that event is not right next to our current event, we have to
      // move it here.
      if (i > 0) {
        const [ event ] = sortedByTime.splice(i, 1)
        event && sorted.push(event)
      }

      // We've already found the next event group, so stop looking.
      break
    }
  }

  return sorted
}

function getStyledEvents(props) {
  // Create events and order them according to render index.
  // By doing this, we don't have to fiddle with z-indexes.
  const events = props.events.map(event => new EventProxy(event, props))
  const eventsInRenderOrder = sortByRender(events)

  // TODO: Use for loop without clone?

  // Group overlapping events, while keeping order.
  // Every event is always one of: container, row or leaf.
  // Containers can contain rows, and rows can contain leaves.
  const tmp = [ ...eventsInRenderOrder ] // clone to maintain order.
  const containerEvents = []

  while (tmp.length > 0) {
    const [ event ] = tmp.splice(0, 1)

    // Check if this event can go into a container event.
    const container = containerEvents.find(c => contains(c, event))

    // Couldn't find a container — that means this event is a container.
    if (!container) {
      event.rows = []
      containerEvents.push(event)
      continue
    }

    // Found a container for the event.
    event.container = container

    // Check if the event can be placed in an existing row.
    // Start looking from behind.
    let row = null
    for (let i = container.rows.length - 1; i >= 0; i--) {
      const curr = container.rows[i]
      row = curr && isOverlapping(curr, event) ? curr : null

      if (!row) {
        continue
      }

      // Found a row for the event.
      row.leaves.push(event)
      event._row = row
      break
    }

    // Couldn't find a row for the event – that means this event is a row.
    if (!row) {
      event.leaves = []
      container.rows.push(event)
    }
  }

  // Return the original events, along with their styles.
  return eventsInRenderOrder.map(event => {
    return {
      event: event.data,
      style: {
        top: event.top,
        height: event.height,
        width: event.width,
        xOffset: event.xOffset
      }
    }
  })
}

export default getStyledEvents
export { startsBefore, positionFromDate } from './event-proxy'
