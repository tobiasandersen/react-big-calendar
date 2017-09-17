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
    const { row, rowIndex, island } = event
    const withOverlap = event.width === 100 ? 100 : event.width * 1.7

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
