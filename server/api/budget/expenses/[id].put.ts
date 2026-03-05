export default defineApiHandler(async (event) => {
  return updateRecurringEntry(event, 'expense', updateEntrySchema)
})
