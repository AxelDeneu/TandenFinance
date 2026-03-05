export default defineApiHandler(async (event) => {
  return createRecurringEntry(event, 'income', createEntrySchema)
})
