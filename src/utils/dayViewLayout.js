import { accessor as get } from './accessors'
import dates from './dates'

export function startsBefore(date, min) {
  return dates.lt(dates.merge(min, date), min, 'minutes')
}

export function positionFromDate(date, min, total) {
  if (startsBefore(date, min))
    return 0

  let diff = dates.diff(min, dates.merge(min, date), 'minutes')
  return Math.min(diff, total)
}

/**
 * Events will be sorted primarily according to earliest start time.
 * If two events start at the same time, the one with the longest duration will
 * be placed first.
 */
let sort = (events, { startAccessor, endAccessor }) => events.sort((a, b) => {
  let startA = +get(a, startAccessor)
  let startB = +get(b, startAccessor)

  if (startA === startB) {
    return +get(b, endAccessor) - +get(a, endAccessor)
  }

  return startA - startB
})

let getSlot = (event, accessor, min, totalMin) => event && positionFromDate(
  get(event, accessor), min, totalMin
)

/**
 * Two events are considered siblings if the difference between their
 * start time is less than (step*timeslots) hour.
 */
let isSibling = (idx1, idx2, { events, startAccessor, endAccessor, min, totalMin, step, timeslots }) => {
  let event1 = events[idx1]
  let event2 = events[idx2]

  if (!event1 || !event2) return false

  let start1 = getSlot(event1, startAccessor, min, totalMin)
  let start2 = getSlot(event2, startAccessor, min, totalMin)
  let end1 = getSlot(event1, endAccessor, min, totalMin)

  return (Math.abs(start1 - start2) < (step * timeslots) && start2 < end1)
}

/**
 * An event is considered a child of another event if its start time is
 * more than (step*timeslots) hour later than the other event's start time,
 * but before its end time.
 */
let isChild = (parentIdx, childIdx, {
  events, startAccessor, endAccessor, min, totalMin, step, timeslots
}) => {
  if (isSibling(
    parentIdx, childIdx,
    { events, startAccessor, endAccessor, min, totalMin, step, timeslots }
  )) return false

  let parentEnd = getSlot(events[parentIdx], endAccessor, min, totalMin)
  let childStart = getSlot(events[childIdx], startAccessor, min, totalMin)

  return parentEnd > childStart
}

/**
 * Given an event index, siblings directly following it will be found and
 * returned as an array of indexes.
 */
let getSiblings = (idx, {
  events, startAccessor, endAccessor, min, totalMin, step, timeslots
}) => {
  let nextIdx = idx
  let siblings = []

  while (isSibling(
    idx, ++nextIdx, { events, startAccessor, endAccessor, min, totalMin, step, timeslots })
  ) {
    siblings.push(nextIdx)
  }

  return siblings
}

/**
 * Given an event index, and a start search position, all child events to that
 * event will be found and placed into groups of siblings.
 * The return value is an array of child group arrays, as well as the largest
 * size of the child groups.
 */
let getChildGroups = (idx, nextIdx, {
  events, startAccessor, endAccessor, min, totalMin, step, timeslots
}) => {
  let groups = []
  let nbrOfColumns = 0

  while (isChild(
    idx, nextIdx,
    { events, startAccessor, endAccessor, min, totalMin, step, timeslots }
  )) {
    let childGroup = [nextIdx]
    let siblingIdx = nextIdx

    while (isSibling(
      nextIdx, ++siblingIdx,
      { events, startAccessor, endAccessor, min, totalMin, step, timeslots }
    )) {
      childGroup.push(siblingIdx)
    }

    nbrOfColumns = Math.max(nbrOfColumns, childGroup.length)
    groups.push(childGroup)
    nextIdx = siblingIdx
  }

  return { childGroups: groups, nbrOfChildColumns: nbrOfColumns }
}

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

/**
 * Calculates the total number of columns needed for a group of events
 * (i.e. connected events).
 */
let getNbrOfColumns = ({
  firstEventIdx,
  siblingIndexes,
  childGroups,
  nbrOfChildColumns,
  helperArgs
}) => {
  // If the first event doesn't have any siblings, the number of columns will be
  // decided by that event's children's column count.
  if (siblingIndexes.length === 0) {
    return nbrOfChildColumns + 1 // make room for the event itself
  }

  // There are top level siblings, and possibly child groups inside those.
  // In the normal case, the number of columns needed will be the largest of:
  // 1. The number of top level events
  // 2. The number of columns in any of the top level event's child groups
  const nbrOfColumns = Math.max(nbrOfChildColumns, siblingIndexes.length) + 1

  // But since we aim to move child groups as far to the right as possible,
  // we must take into account those that are moved to the very last
  // top level event. If we don't, there will be no room for them to render.
  let newParentIdx = firstEventIdx
  let siblingIdx = 0
  childGroups.forEach(group => {
    while (isChild(siblingIndexes[siblingIdx], group[0], helperArgs)) {
      newParentIdx = siblingIndexes[siblingIdx]
      siblingIdx++
    }
  })

  // The child groups can't be moved to the last top level event.
  if (newParentIdx !== siblingIndexes.length + 1) {
    return nbrOfColumns
  }

  // The child groups can be moved to the last top level event, so we'll
  // have to add add an extra column for those to render in.
  return nbrOfColumns + 1
}

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
 *
 * The algorithm will start by sorting the array, and then iterating over it.
 * Starting at the first event, each of its siblings and children, placed in
 * groups of siblings, will be found. Both are needed in order to calculate the
 * width of the first event. When the width is known, its siblings will be
 * given the same width, but with an incremental x-offset.
 *
 * Each group of children will be looking to move as far away from its original
 * parent as possible. A move can be made to one of the parent's siblings, if
 * that sibling is also a parent to the child group. This will make room for
 * more events.
 *
 * When a child group knows its parent, it looks at the space occupied by that
 * parent, and calculates the remaning available space and divides that among
 * each other.
 *
 * All widths and x-offsets are calculated without taking overlapping into
 * account. Overlapping is added in the end according to the OVERLAP_MULTIPLIER.
 * If that is set to 0, the events won't overlap or grow.
 *
 * When one of these rounds are finished, all events connected have been
 * traversed, so the cursor will be moved past all of them.
 */
export default function getStyledEvents ({
  events: unsortedEvents, startAccessor, endAccessor, min, totalMin, showMultiDayTimes,
  step, timeslots
}) {
  console.log(':::START:::')

  // 0 - 23
  let matrix = []


  let OVERLAP_MULTIPLIER = 0.3
  // OVERLAP_MULTIPLIER = 0
  let events = sort(unsortedEvents, { startAccessor, endAccessor })
  let helperArgs = { events, startAccessor, endAccessor, min, showMultiDayTimes, totalMin, step, timeslots }
  let styledEvents = []
  let idx = 0
  let eventIdx = 0

  // Each iteration will create a new row with columns.
  while (eventIdx < events.length) {
    const event = events[eventIdx]
    console.log(`Create row ${matrix.length}, starting with ${event.title} (idx: ${eventIdx})`)

    // Create a new row
    let row = [ eventIdx, ...getSiblings(eventIdx, helperArgs) ]
    console.log(`Row ${matrix.length} has ${row.length} columns`)

    // Check if the row can be placed inside another row.
    let eventStart = getSlot(event, startAccessor, min, totalMin)

    for (let i = matrix.length - 1; i >= 0; --i) {
      console.log(`Does ${event.title} fit in row ${i}?`)
      const rowAbove = matrix[i]
      const itemIdx = rowAbove[0]
      const item = events[itemIdx]
      const canFit = itemEnd > eventStart

      // If it can't fit in this row, it won't fit higher up either.
      if (!canFit) break

      
      const itemEnd = getSlot(item, startAccessor, min, totalMin)
      console.log(`${canFit ? 'Yes' : 'No'}`)
      console.log(rowAbove, { eventStart, itemEnd })
    }

    matrix.push(row)

    eventIdx += row.length
  }

  console.log(`Matrix done.`)
  console.log(matrix)
  console.log(`Now apply styles...`)

  matrix.forEach((row, rowIdx) => {
    console.log(`Row ${rowIdx}`)
    let columns = row.length
    let columnWidth = 100 / columns
    let extraOverlapping = columnWidth * (columns > 1 ? OVERLAP_MULTIPLIER : 0)

    row.forEach((eventIdx, columnIdx) => {
      console.log(`Apply style for ${events[eventIdx].title}`)
      let { top, height } = getYStyles(eventIdx, helperArgs)

      styledEvents[eventIdx] = {
        event: events[eventIdx],
        style: {
          top,
          height,
          width: columnWidth + extraOverlapping,
          xOffset: (columnWidth * columnIdx) - extraOverlapping
        }
      }
    })
  })

  return styledEvents

  // Each iteration will create a new row with columns.
  while (idx < events.length) {
    let siblings = getSiblings(idx, helperArgs)
    let { childGroups, nbrOfChildColumns } = getChildGroups(
      idx, idx + siblings.length + 1, helperArgs
    )
    let nbrOfColumns = getNbrOfColumns({
      firstEventIdx: idx,
      siblingIndexes: siblings,
      childGroups,
      nbrOfChildColumns,
      helperArgs
    });

    // Set styles to top level events.
    [idx, ...siblings].forEach((eventIdx, siblingIdx) => {
      let width = 100 / nbrOfColumns
      let xAdjustment = width * (nbrOfColumns > 1 ? OVERLAP_MULTIPLIER : 0)
      let { top, height } = getYStyles(eventIdx, helperArgs)

      styledEvents[eventIdx] = {
        event: events[eventIdx],
        style: {
          top,
          height,
          width: width + xAdjustment,
          xOffset: (width * siblingIdx) - xAdjustment
        }
      }
    })

    childGroups.forEach(group => {
      let parentIdx = idx
      let siblingIdx = 0

      // Move child group to sibling if possible, since this will make
      // room for more events.
      while (isChild(siblings[siblingIdx], group[0], helperArgs)) {
        parentIdx = siblings[siblingIdx]
        siblingIdx++
      }

      // Set styles to child events.
      group.forEach((eventIdx, i) => {
        let { style: parentStyle } = styledEvents[parentIdx]
        let spaceOccupiedByParent = parentStyle.width + parentStyle.xOffset
        let columns = Math.min(group.length, nbrOfColumns)
        let width = (100 - spaceOccupiedByParent) / columns
        let xAdjustment = spaceOccupiedByParent * OVERLAP_MULTIPLIER
        let { top, height } = getYStyles(eventIdx, helperArgs)

        styledEvents[eventIdx] = {
          event: events[eventIdx],
          style: {
            top,
            height,
            width: width + xAdjustment,
            xOffset: spaceOccupiedByParent + (width * i) - xAdjustment
          }
        }
      })
    })

    // Move past all events we just went through
    idx += 1 + siblings.length + childGroups.reduce(
      (total, group) => total + group.length, 0
    )
  }
  return styledEvents
}
