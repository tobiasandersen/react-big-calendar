import { accessor as get } from '../accessors'
import dates from '../dates'

export function startsBefore(date, min) {
  return dates.lt(dates.merge(min, date), min, 'minutes')
}

export function positionFromDate(date, min, total) {
  if (startsBefore(date, min)) {
    return 0
  }

  const diff = dates.diff(min, dates.merge(min, date), 'minutes')
  return Math.min(diff, total)
}


export class Event {
  constructor(data, props) {
    this.data = data
    this.props = props
  }

  get startDate () {
    return get(this.data, this.props.startAccessor)
  }

  get endDate () {
    return get(this.data, this.props.endAccessor)
  }

  get startSlot () {
    return positionFromDate(this.startDate, this.props.min, this.props.totalMin)
  }

  get endSlot () {
    return positionFromDate(this.endDate, this.props.min, this.props.totalMin)
  }

  get start () {
    return +this.startDate
  }

  get end () {
    return +this.endDate
  }

  get top () {
    return this.startSlot / this.props.totalMin * 100
  }

  get bottom () {
    return this.endSlot / this.props.totalMin * 100
  }

  get height () {
    return Math.max(2, this.bottom - this.top) // use min-height instead?
  }

  /**
   * The event's width without any overlap.
   */
  get _width () {
    // The container event's width is determined by the maximum number of
    // events in any of its rows.
    if (this.rows) {
      const columns = this.rows.reduce((max, row) => {
        return Math.max(max, row.leaves.length + 1) // add itself
      }, 0) + 1 // add the container

      return 100 / columns
    }

    const availableWidth = 100 - this.container._width

    // The row event's width is the space left by the container, divided
    // among itself and its leaves.
    if (this.leaves) {
      return availableWidth / (this.leaves.length + 1)
    }

    // The leaf event's width is determined by its row's width
    return this.row._width
  }

  /**
   * The event's calculated width, possibly with extra width added for
   * overlapping effect.
   */
  get width () {
    const noOverlap = this._width
    const overlap = Math.min(100, this._width * 1.7)

    // Containers can always grow.
    if (this.rows) {
      return overlap
    }

    // Rows can grow if they have leaves.
    if (this.leaves) {
      return this.leaves.length > 0 ? overlap : noOverlap
    }

    // Leaves can grow unless they're the last item in a row.
    const { leaves } = this.row
    const index = leaves.indexOf(this)
    return index === leaves.length - 1 ? noOverlap : overlap
  }

  get xOffset () {
    // Containers have no offset.
    if (this.rows) {
      return 0
    }

    // Rows always start where their container ends.
    if (this.leaves) {
      return this.container._width
    }

    // Leaves are spread out evenly on the space left by its row.
    const { leaves, xOffset, _width } = this.row
    const index = leaves.indexOf(this) + 1
    return xOffset + (index * _width)
  }
}

export class MultiDayEvent extends Event {
  get startDate () {
    return this.multiDayDates[0]
  }

  get endDate () {
    return this.multiDayDates[1]
  }

  get start () {
    return +this.startDate
  }

  get end () {
    return +this.endDate
  }

  get _startDate () {
    return get(this.data, this.props.startAccessor)
  }

  get _endDate () {
    return get(this.data, this.props.endAccessor)
  }

  get multiDayDates () {
    const current = new Date(this.props.min) // current date at midnight.
    let c = new Date(current)
    let s = new Date(this._startDate)
    let e = new Date(this._endDate)

    // Use noon to compare dates to avoid DST issues.
    s.setHours(12, 0, 0, 0)
    e.setHours(12, 0, 0, 0)
    c.setHours(12, 0, 0, 0)

    // Current day is at the start, but it spans multiple days,
    // so we correct the end.
    if (+c === +s && c < e) {
      return [this._startDate, dates.endOf(this._startDate, 'day')]
    }

    // Current day is in between start and end dates,
    // so we make it span all day.
    if (c > s && c < e) {
      return [current, dates.endOf(current, 'day')]
    }

    // Current day is at the end of a multi day event,
    // so we make it start at midnight, and end normally.
    if (c > s && +c === +e) {
      return [current, this._endDate]
    }

    return [this._startDate, this._endDate]
  }
}
