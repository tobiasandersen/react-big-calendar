import createFactory from './model'
export { startsBefore, positionFromDate } from './model'
const OVERLAP_MULTIPLIER = 0.3

let sort = events => {
  const orderedEvents = events.sort((a, b) => {
    if (a.start === b.start) {
      return b.end - a.end
    }

    return a.start - b.start
  })

  const sortedEvents = []
  const rows = []

  const moveEvent = index => {
    const [ event ] = orderedEvents.splice(index, 1)
    sortedEvents.push(event)
    return event
  }

  while (orderedEvents.length > 0) {
    const event = moveEvent(0)
    const finalIndex = sortedEvents.length - 1
    const _rows = {}
    // console.log(`=> ${event.title}`)

    for (let i = 0; i < orderedEvents.length; i++) {
      const test = orderedEvents[i]
      // console.log(`Looking at ${test.title}`)

      // Still inside this event, so look for next
      if (event.end > test.start) {
        const diff = test.startSlot - event.startSlot
        const timeslot = Math.floor(diff / 60) // TODO: Not sure if 60 minutes always is ok?
        const timeslotRow = _rows[timeslot] || []
        _rows[timeslot] = [...timeslotRow, test]
        continue
      }

      // We've found the first event of the next event island.
      // If that event is not right next to our current event, we have to
      // move it here.
      if (i > 0) {
        moveEvent(i)
      }

      // We've already found the next event island, so stop looking.
      break
    }

    rows[finalIndex] = rows
  }

  return { sortedEvents, rows }
}

export default function getStyledEvents (props) {
  const eventFactory = createFactory(props)
  const events = props.events.map(event => eventFactory(event))
  const { sortedEvents, rows } = sort(events)

  console.clear()
  console.log(':::START:::')
  console.log(sortedEvents.map(event => event.title))
  console.log(rows)

  return sortedEvents.map((event, idx) => {
    console.log('=> -----------------------------')
    console.log(event.title)
    const rowsInEvent = rows[idx] || {}

    let nbrOfColumns = 1
    Object.keys(rowsInEvent).map(key => {
      const column = rowsInEvent[key]
      nbrOfColumns = Math.max(nbrOfColumns, column.length + 1)
      // console.log(column.length, column.map(event => event))
    })
    console.log(`Number of columns: ${nbrOfColumns}`)

    const width = 100 / nbrOfColumns
    const left = width * 0

    return {
      event: event.data,
      style: {
        top: event.top,
        height: event.height,
        width,
        xOffset: left
      }
    }

  })
}
