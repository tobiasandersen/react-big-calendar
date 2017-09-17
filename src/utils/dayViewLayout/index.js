import Event from './event'
import Grid from './grid'

const sort = events => {
  const grid = new Grid(events)
  grid.createRenderOrder()
  return grid
}

export default function getStyledEvents (props) {
  console.clear()
  console.log(':::START:::')

  const events = props.events.map(event => new Event(event, props))
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

export { startsBefore, positionFromDate } from './event'
