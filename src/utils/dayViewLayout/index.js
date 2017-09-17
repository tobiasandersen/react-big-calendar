export { startsBefore, positionFromDate } from './model'
import createFactory from './model'
import { Grid, Row } from './row'
const OVERLAP_MULTIPLIER = 0.3

const sort = events => {
  const grid = new Grid(events)
  grid.createRenderOrder()

  // let next = undefined
  // let startOvers = 0
  //
  // The Grid shouldn't have any events when done.
  // while (grid.events.length > 0 && next !== null) {
  //   // const row = new Row(event)
  //   next = grid.findNextRow(next)
  //   if (next === undefined) {
  //     startOvers++
  //     console.log('Reached end')
  //   } else {
  //     console.log('nextRow:', next && next.title)
  //   }
  //
  //   if (!startOvers) {
  //     grid.rows.push(new Row(next))
  //     continue
  //   }
  //
  //   // Is nested
  //
  //
  //
  //   // const _rows = {}
  //
  //   // Look for events whose start time is less than this event's end time.
  //   // for (let i = 0; i < grid.events.length; i++) {
  //   //   const test = grid.events[i]
  //   //
  //   //   // Still inside this event, so look for next
  //   //   if (event.end > test.start) {
  //   //     // const timeSlotDistance = test.startSlot - event.startSlot
  //   //     // const timeslot = Math.floor(timeSlotDistance / 60) // TODO: Not sure if 60 minutes always is ok?
  //   //     // const timeslotRow = _rows[timeslot] || []
  //   //     // _rows[timeslot] = [...timeslotRow, test]
  //   //     continue
  //   //   }
  //   //
  //   //   // We've found the first event of the next event island.
  //   //   // If that event is not right next to our current event, we have to
  //   //   // move it here.
  //   //   if (i > 0) {
  //   //     grid.take(i)
  //   //   }
  //   //
  //   //   // We've already found the next event island, so stop looking.
  //   //   break
  //   // }
  //
  //   // rows[grid.currentEventIndex] = _rows
  // }

  return grid
}

export default function getStyledEvents (props) {
  console.clear()
  console.log(':::START:::')

  const eventFactory = createFactory(props)
  const events = props.events.map(event => eventFactory(event))
  const grid = sort(events)

  return grid.eventsInRenderOrder.map((event, idx) => {
    // console.log('=> -----------------------------')
    console.log(event.title)
    // const rowsInEvent = rows[idx] || {}

    let nbrOfColumns = 1
    // Object.keys(rowsInEvent).map(key => {
    //   const column = rowsInEvent[key]
    //   nbrOfColumns = Math.max(nbrOfColumns, column.length + 1)
    //   // console.log(column.length, column.map(event => event))
    // })
    // console.log(`Number of columns: ${nbrOfColumns}`)

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
