export default defineApiHandler(async (event) => {
  return deleteRecurringEntry(event, 'envelope')
})
