export default defineApiHandler(async (event) => {
  return createRecurringEntry(event, 'envelope', createEnvelopeSchema)
})
