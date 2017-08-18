import Row from './row'

const isOverlapping = (row, event) => {
  const startDiff = Math.abs(event.startSlot - row.startSlot)
  const endDiff = Math.abs(event.endSlot - row.endSlot)

  if (startDiff >= 60 && endDiff >= 60) {
    return false
  }

  if (event.startSlot < row.endSlot) {
    return true
  }


  if (event.startSlot < row.startSlot && event.endSlot > row.startSlot) {
    return true
  }

  return false
}

export default class Group {
  constructor (event) {
    this.event = event
    event.setGroup(this)
    this.rows = []
  }

  get startSlot () {
    return this.event.startSlot
  }

  get endSlot () {
    return this.event.endSlot
  }

  get nbrOfColumns () {
    return this.rows.reduce((max, row) => Math.max(max, row.columns + 1), 1)
  }

  createRow = (firstEvent) => {
    const row = new Row(this, firstEvent)
    this.rows.push(row)
    return row
  }

  addEvent = (event) => {
    event.setGroup(this)
    
    // No rows in this group, create one for the event.
    if (this.rows.length === 0) {
      this.createRow(event)
      return
    }

    // Find a place for it. Start from behind.
    for (let i = this.rows.length - 1; i >= 0; i--) {
      const lastRow = this.rows[i]

      if (isOverlapping(lastRow, event)) {
        lastRow.addEvent(event)
        return
      }
    }

    // Couldn't find a row for the event, create new.
    this.createRow(event)
  }
}
