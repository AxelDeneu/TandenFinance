export default defineApiHandler(async (event) => {
  return deleteRecurringEntry(event, 'income')
})
