import { accessor as get } from '../accessors'
import dates from '../dates'

const isOverlapping = (a, b) => {
  const startDiff = Math.abs(b.startSlot - a.startSlot)
  const endDiff = Math.abs(b.endSlot - a.endSlot)

  if (startDiff >= 60 && endDiff >= 60) {
    return false
  }

  if (b.startSlot < a.endSlot) {
    return true
  }

  if (b.startSlot < a.startSlot && b.endSlot > a.startSlot) {
    return true
  }

  return false
}

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

export default class Event {
  constructor(data, props) {
    this.data = data
    this.props = props
    this._container = null
    this._rows = []
    this._row = null
    this._leaves = []
  }

  // setContainer = (event) => {
  //   this._container = event
  // }
  //
  // setRow = (row, index) => {
  //   this._row = row
  // }
  //
  // addEvent = (event) => {
  //   event.setContainer(this)
  //
  //   // Check if the added event can be placed in an existing row.
  //   // Start looking from behind.
  //   for (let i = this._rows.length - 1; i >= 0; i--) {
  //     const lastRow = this._rows[i]
  //
  //     if (isOverlapping(lastRow, event)) {
  //       // lastRow.addEvent(event)
  //       lastRow._leaves.push(event)
  //       event.setRow(lastRow)
  //       return
  //     }
  //   }
  //
  //   // Couldn't find a row for the event – that means this event is a row.
  //   this._rows.push(event)
  // }

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
    // Maybe set min-width instead?
    return Math.max(2, this.bottom - this.top)
  }

  get columns () {
    return (this._row ? this._row._leaves.length : this._leaves.length) + 1
  }

  /**
   * The event's width without any overlap.
   */
  get _width () {
    // The container event's width is determined by the maximum number of
    // events in any of its rows.
    if (!this._container) {
      const nbrOfColumns = this._rows
        .reduce((max, row) => Math.max(max, row.columns + 1), 1)
      return 100 / nbrOfColumns
    }

    const availableWidth = 100 - this._container._width
    return availableWidth / this.columns
  }

  get _rowIndex () {
    return this._row ? this._row._leaves.indexOf(this) + 1 : 0
  }

  /**
   * The event's calculated width, possibly with extra width added for
   * overlapping effect.
   */
  get width () {
    // Can't grow if it's already taking up the full row.
    if (this._width === 100) {
      return 100
    }

    // The last element in a row isn't allowed to grow.
    if (this._row && this._rowIndex === this._row.columns - 1) {
      return this._width
    }

    return this._width * 1.7
  }

  get xOffset () {
    // The container event shouldn't have any offset.
    if (!this._container) {
      return 0
    }

    return this._container._width + (this._rowIndex * this._width)
  }
}
