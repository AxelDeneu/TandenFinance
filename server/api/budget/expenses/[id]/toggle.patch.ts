export default defineApiHandler(async (event) => {
  return toggleRecurringEntry(event, 'expense')
})
