import Event from './event'
import Group from './group'

const isOverlapping = (a, b) => {
  const startDiff = Math.abs(b.startSlot - a.startSlot)
  const endDiff = Math.abs(b.endSlot - a.endSlot)

  if (a && b && a.title === 'Event 1' && b.data.title === 'Event 11') {
    console.log('a', a)
    console.log('b', b)
    console.log({startDiff, endDiff})
  }

  if (startDiff >= 60 && endDiff <= 60) {
    if (a && b && a.title === 'Event 1' && b.data.title === 'Event 11') {
      console.log('1 false')

    }
    return false
  }

  if (b.startSlot < a.endSlot) {
    if (a && b && a.title === 'Event 1' && b.data.title === 'Event 11') {
      console.log('2 false')
    }
    return true
  }


  if (b.startSlot < a.startSlot && b.endSlot > a.startSlot) {
    if (a && b && a.title === 'Event 1' && b.data.title === 'Event 11') {
      console.log('3 false')
    }
    return true
  }

  if (a && b && a.title === 'Event 1' && b.data.title === 'Event 11') {
    console.log('last false')
  }
  return false
}

const sortByTime = events => events.sort((a, b) => {
  if (a.start === b.start) {
    return b.end - a.end
  }

  return a.start - b.start
})

const sortByRender = events => {
  const sortedByTime = sortByTime([ ...events ])
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

      // We've already found the next event island, so stop looking.
      break
    }
  }

  return sorted
}

const groupEvents = events => {
  // We want to maintain the order of the events, so since we'll be altering
  // the array, we clone it first.
  const tmp = [ ...events ]
  const groups = []

  const findNextGroup = event => {
    let next

    if (!event) {
      const [ event ] = tmp.splice(0, 1)
      next = event
    }

    if (!next) return

    // Check if this event can go into another group.
    const group = groups.find(group => isOverlapping(group, next))

    // Found a group for the event, so we add it there.
    if (group) {
      group.addEvent(next)
    } else {
      // Couldn't find a group, so we create a new.
      groups.push(new Group(next))
    }

    return next
  }

  let next = undefined
  while (tmp.length > 0 && next !== null) {
    next = findNextGroup(next)
  }
}

function getStyledEvents (props) {
  // Create events and order them according to render index.
  // By doing this, we don't have to fiddle with z-indexes.
  const events = props.events.map(event => new Event(event, props))
  const eventsInRenderOrder = sortByRender(events)

  // Group overlapping events
  groupEvents(eventsInRenderOrder)

  // Return the original events, along with their styles.
  return eventsInRenderOrder.map(event => ({
    event: event.data,
    style: {
      top: event.top,
      height: event.height,
      width: event.width,
      xOffset: event.xOffset
    }
  }))
}

export default getStyledEvents
export { startsBefore, positionFromDate } from './event'
