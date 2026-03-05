export default defineApiHandler(async (event) => {
  return updateRecurringEntry(event, 'envelope', updateEnvelopeSchema)
})
