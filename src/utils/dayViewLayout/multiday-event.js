import { Event } from './model'

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
    // `this.props.min` is the current date at midnight
    let current = new Date(this.props.min)

    let c = new Date(current)
    let s = new Date(this._startDate)
    let e = new Date(this._endDate)

    // use noon to compare dates to avoid DST issues
    s.setHours(12, 0, 0, 0)
    e.setHours(12, 0, 0, 0)
    c.setHours(12, 0, 0, 0)

    // if current day is at the start, but spans multiple days, correct the end
    if (+c === +s && c < e) {
      console.log('return 1')
      return [this._startDate, dates.endOf(this._startDate, 'day')]
    }

    // if current day is in between start and end dates, span all day
    else if (c > s && c < e) {
      console.log('return 2')
      return [current, dates.endOf(current, 'day')]
    }

    // if current day is at the end of a multi day event, start at midnight to the end
    else if (c > s && +c === +e) {
      console.log('return 3')
      return [current, this._endDate]
    }

    return [this._startDate, this._endDate]
  }
}
