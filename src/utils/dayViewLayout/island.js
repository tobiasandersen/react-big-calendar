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

export default class Island {
  constructor (event) {
    this.title = event.title
    this.event = event
    this.rows = []
    event.setIsland(this)
  }

  get startSlot () {
    return this.event.startSlot
  }

  get endSlot () {
    return this.event.endSlot
  }

  get nbrOfColumns () {
    return this.rows.reduce((max, row) => {
      return Math.max(max, row.columns + 1)
    }, 1)
  }

  createRow = (firstEvent) => {
    const row = new Row(this, firstEvent)
    this.rows.push(row)
    return row
  }

  addEvent = (event) => {
    event.setIsland(this)

    // console.log(`Add ${event.title} to island`)
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

    this.createRow(event)
  }
}
