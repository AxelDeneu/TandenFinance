export default defineApiHandler(async (event) => {
  return updateRecurringEntry(event, 'income', updateEntrySchema)
})
