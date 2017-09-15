import { accessor as get } from '../accessors'
import dates from '../dates'

export function startsBefore(date, min) {
  return dates.lt(dates.merge(min, date), min, 'minutes')
}

export function positionFromDate(date, min, total) {
  if (startsBefore(date, min))
  return 0

  let diff = dates.diff(min, dates.merge(min, date), 'minutes')
  return Math.min(diff, total)
}


export default ({ startAccessor, endAccessor, min, totalMin }) => event => {
  let id = 0

  const getSlot = (data, accessor) => {
    if (!data) return false
    return positionFromDate(get(data, accessor), min, totalMin)
  }

  class Event {
    constructor (data) {
      this.id = id++
      this.data = data
      this.parent = null
    }

    // TODO: remove
    get title () {
      return this.data.title
    }

    get start () {
      return +get(this.data, startAccessor)
    }

    get end () {
       return +get(this.data, endAccessor)
    }

    get startSlot () {
      return getSlot(this.data, startAccessor, min, totalMin)
    }

    get endSlot () {
      return getSlot(this.data, endAccessor, min, totalMin)
    }

    get top () {
      return this.startSlot / totalMin * 100
    }

    get bottom () {
      return this.endSlot / totalMin * 100
    }

    get height () {
      return this.bottom - this.top
    }
  }

  return new Event(event)
}
