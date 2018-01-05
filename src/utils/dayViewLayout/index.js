import { Event, MultiDayEvent } from './event-proxy'

/**
 * Returns true if event b is considered to be "inside" event a.
 */
function contains(a, b) {
  return (
    // A starts before, or at the same time as, b.
    a.startSlot <= b.startSlot &&
     // A ends after, or ar at the same time as, b.
    a.endSlot >= b.endSlot
  )
}

/**
 * Return true if event a and b is considered to be on the same row.
 */
function onSameRow(a, b) {
  return (
    // Occupies the same start slot.
    Math.abs(b.startSlot - a.startSlot) <= 30 ||
     // A's start slot overlaps with b's end slot.
    a.startSlot > b.startSlot && a.startSlot < b.endSlot
  )
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

function getStyledEvents({ events, showMultiDayTimes, ...props }) {
  // Create proxy events and order them so that we don't have
  // to fiddle with z-indexes.
  const proxies = events.map(event => showMultiDayTimes 
    ? new MultiDayEvent(event, props)
    : new Event(event, props)
  )
  const eventsInRenderOrder = sortByRender(proxies)

  // Group overlapping events, while keeping order.
  // Every event is always one of: container, row or leaf.
  // Containers can contain rows, and rows can contain leaves.
  const containerEvents = []

  for (let i = 0; i < eventsInRenderOrder.length; i++) {
    const event = eventsInRenderOrder[i]

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
    for (let j = container.rows.length - 1; !row && j >= 0; j--) {
      if (onSameRow(container.rows[j], event)) {
        row = container.rows[j]
      }
    }

    if (row) { // Found a row, so add it.
      row.leaves.push(event)
      event.row = row
    } else { // Couldn't find a row – that means this event is a row.
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
