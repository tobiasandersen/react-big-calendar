import dates from './dates'

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
