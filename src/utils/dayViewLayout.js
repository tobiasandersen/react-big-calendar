import { accessor as get } from './accessors'
import dates from './dates'

let constructEvent = (title, start, end) => {
  return {
    title: title,
    start: start,
    end: end
  }
}

let handleMultiDayEvents = (title, start, end, current) => {
  let s = new Date(start)
  let e = new Date(end)
  let c = new Date(current)

  // use noon to compare dates to avoid DST issues
  s.setHours(12, 0, 0, 0)
  e.setHours(12, 0, 0, 0)
  c.setHours(12, 0, 0, 0)

  // if current day is at the start, but spans multiple days, correct the end
  if (+c === +s && c < e) {
    return constructEvent(title, start, dates.endOf(start, 'day'))
  }

  // if current day is in between start and end dates, span all day
  else if (c > s && c < e) {
    return constructEvent(title, current, dates.endOf(current, 'day'))
  }

  // if current day is at the end of a multi day event, start at midnight to the end
  else if (c > s && +c === +e) {
    return constructEvent(title, current, end)
  }
}

export function startsBefore(date, min) {
  return dates.lt(dates.merge(min, date), min, 'minutes')
}

export function positionFromDate(date, min, total) {
  if (startsBefore(date, min))
    return 0

  let diff = dates.diff(min, dates.merge(min, date), 'minutes')
  return Math.min(diff, total)
}

let getSlot = (event, accessor, min, totalMin) => event && positionFromDate(
  get(event, accessor), min, totalMin
)

/**
 * Returns height and top offset, both in percentage, for an event at
 * the specified index.
 */
let getYStyles = (idx, {
  events, startAccessor, endAccessor, min, showMultiDayTimes, totalMin, step
}) => {
  let event = events[idx]

  let startDate = get(event, startAccessor) // start date
  let endDate = get(event, endAccessor) // end date
  let currentDate = new Date(min) // min is the current date at midnight

  let multiDayEvent
  if (showMultiDayTimes) {
    multiDayEvent = handleMultiDayEvents(event.title, startDate, endDate, currentDate)
  }

  let start = getSlot(multiDayEvent || event, startAccessor, min, totalMin)
  let end = Math.max(getSlot(multiDayEvent || event, endAccessor, min, totalMin), start + step)
  let top = start / totalMin * 100
  let bottom = end / totalMin * 100
  let height = bottom - top

  return {
    top,
    height
  }
}

/**
 * Takes an array of unsorted events, and returns a sorted array
 * containing the same events, but with an additional style property.
 * These styles will position the events similarly to Google Calendar.
 */
let sort = (events, { startAccessor, endAccessor, min, totalMin }) => {
  const orderedEvents = events.sort((a, b) => {
    let startA = +get(a, startAccessor)
    let startB = +get(b, startAccessor)

    if (startA === startB) {
      return +get(b, endAccessor) - +get(a, endAccessor)
    }

    return startA - startB
  })

  const sortedEvents = []
  const slotMap = {}

  // Columns
  const matrix = []
  let currentColumn = []
  let createNewColumn = false
  let rows = []
  let currentRow = []
  let createNewRow = false
  let rowMap = {}

  const moveEvent = index => {
    const [ event ] = orderedEvents.splice(index, 1)
    sortedEvents.push(event)
    return event
  }

  while (orderedEvents.length > 0) {
    const event = moveEvent(0)
    const eventEnd = +get(event, endAccessor)
    const eventStartSlot = getSlot(event, startAccessor, min, totalMin)
    const eventEndSlot = getSlot(event, endAccessor, min, totalMin)

    const finalIndex = sortedEvents.length - 1
    const rows = {}
    // console.log(`=> ${event.title}`)

    for (let i = 0; i < orderedEvents.length; i++) {
      const test = orderedEvents[i]
      const testStart = +get(test, startAccessor)
      const testStartSlot = getSlot(test, startAccessor, min, totalMin)
      const testEndSlot = getSlot(test, endAccessor, min, totalMin)
      // console.log(`Looking at ${test.title}`)

      // Still inside this event, so look for next
      if (eventEnd > testStart) {
        const diff = testStartSlot - eventStartSlot
        const timeslot = Math.floor(diff / 60) // TODO: Not sure if 60 minutes always is ok?
        const timeslotRow = rows[timeslot] || []
        rows[timeslot] = [...timeslotRow, { ...test, parent: test.parent || event.__rbcKey }]
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

    rowMap[finalIndex] = rows
  }

  // console.log('rowMap', rowMap)
  return { sortedEvents, slotMap, matrix, rowMap }
}

export default function getStyledEvents ({
  events: unsortedEvents,
  startAccessor,
  endAccessor,
  min,
  showMultiDayTimes,
  totalMin,
  step
}) {
  const OVERLAP_MULTIPLIER = 0.3
  console.clear()
  console.log(':::START:::')
  const eventsWithIds = unsortedEvents
    .map((event, index) => ({ ...event, __rbcKey: index }))
  const {
    sortedEvents: events,
    slotMap,
    matrix,
    rowMap
  } = sort(eventsWithIds, { startAccessor, endAccessor, min, totalMin })

  const getYStyles = (event) => {
    let startDate = get(event, startAccessor) // start date
    let endDate = get(event, endAccessor) // end date
    let currentDate = new Date(min) // min is the current date at midnight

    let multiDayEvent
    if (showMultiDayTimes) {
      multiDayEvent = handleMultiDayEvents(event.title, startDate, endDate, currentDate)
    }

    let start = getSlot(multiDayEvent || event, startAccessor, min, totalMin)
    let end = Math.max(getSlot(multiDayEvent || event, endAccessor, min, totalMin), start + step)
    let top = start / totalMin * 100
    let bottom = end / totalMin * 100
    let height = bottom - top

    return {
      top,
      height
    }
  }

  const widths = {}

  return events.map((event, idx) => {
    console.log('=> -----------------------------')
    console.log(event.title, event.__rbcKey)
    const eventStart = getSlot(event, startAccessor, min, totalMin)
    const eventEnd = getSlot(event, startAccessor, min, totalMin)
    const rowsInEvent = rowMap[idx] || {}

    let nbrOfColumns = 1
    Object.keys(rowsInEvent).map(key => {
      const column = rowsInEvent[key]
      nbrOfColumns = Math.max(nbrOfColumns, column.length + 1)
      console.log(column.length, column.map(event => event))
    })
    console.log(`Number of columns: ${nbrOfColumns}`)

    const { top, height } = getYStyles(event)
    const parentWidth = widths[event.parent]
    if (parentWidth) {
      console.log({parentWidth})
    }
    const width = 100 / nbrOfColumns
    console.log({widths})
    widths[event.__rbcKey] = width
    const left = width * 0

    return {
      event,
      style: {
        top,
        height,
        width,
        xOffset: left
      }
    }

  })
}
