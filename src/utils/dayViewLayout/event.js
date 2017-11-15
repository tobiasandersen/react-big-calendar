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

export default class Event {
  constructor(data, props) {
    this.data = data
    this.props = props
    this.row = null
    this.rowIndex = 0
  }

  setRow = (row, index) => {
    this.row = row
    this.rowIndex = index
  }

  get group () {
    return this.row && this.row.group
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
    return this.bottom - this.top
  }

  get topLevelWidth () {
    console.log(this.group, this.data.title)
    return 100 / (this.group ? this.group.nbrOfColumns : 1)
  }

  /**
   * The event's width without any overlap.
   */
  get _width () {
    if (this.row === null) {
      return this.topLevelWidth
    }

    const availableWidth = 100 - this.topLevelWidth
    return availableWidth / this.row.columns
  }

  /**
   * The event's calculated width, possibly with extra width added for
   * overlapping effect.
   */
  get width () {
    // Can't grow if it's already taking up the full row.
    if (this._width === 100) return this._width

    // The last element in a row can't grow.
    if (this.row && this.rowIndex === this.row.columns - 1) return this._width

    return this._width * 1.7
  }

  get xOffset () {
    // The top level event shouldn't have any offset.
    if (this.row === null) {
      return 0
    }

    return this.topLevelWidth + (this.rowIndex * this._width)
  }
}
