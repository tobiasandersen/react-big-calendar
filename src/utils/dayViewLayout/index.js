export { startsBefore, positionFromDate } from './model'
import createFactory from './model'
import Grid from './grid'
const OVERLAP_MULTIPLIER = 0.3

const sort = events => {
  const grid = new Grid(events)
  grid.createRenderOrder()
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
    // console.log(`Render ${event.title}`)
    const { row, rowIndex, island } = event
    // console.log(`Island: ${island.title}`)
    // console.log(`Row: ${row}`)
    // console.log(`Row Index: ${rowIndex}`)
    // console.log(`width: ${event.width}`)


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
        width: event.width,
        xOffset: event.left
      }
    }

  })
}
