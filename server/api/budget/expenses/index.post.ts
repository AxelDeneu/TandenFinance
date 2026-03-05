export default defineApiHandler(async (event) => {
  return createRecurringEntry(event, 'expense', createEntrySchema)
})
