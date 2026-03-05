import Papa from 'papaparse'
import { db, schema } from 'hub:db'

function normalize(str: string): string {
  return str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function matchScore(csvLabel: string, entryLabel: string): number {
  const a = normalize(csvLabel)
  const b = normalize(entryLabel)
  if (a === b) return 1.0
  if (a.includes(b) || b.includes(a)) return 0.7
  // Check if first 5+ chars match
  const minLen = Math.min(a.length, b.length, 5)
  if (minLen >= 3 && a.slice(0, minLen) === b.slice(0, minLen)) return 0.5
  return 0
}

export default defineApiHandler(async (event) => {
  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'Aucun fichier fourni' })
  }

  const file = formData.find(f => f.name === 'file')
  if (!file || !file.data) {
    throw createError({ statusCode: 400, message: 'Fichier CSV requis' })
  }

  const csvText = file.data.toString('utf-8')
  const filename = file.filename ?? 'import.csv'

  // Parse CSV
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim().toLowerCase()
  })

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    throw createError({ statusCode: 400, message: 'Erreur de parsing CSV' })
  }

  // Detect column mapping
  const headers = parsed.meta.fields ?? []
  const dateCol = headers.find(h => /date/.test(h))
  const labelCol = headers.find(h => /lib[eé]ll[eé]|label|description|intitul/.test(h)) ?? headers.find(h => /nom/.test(h))
  const debitCol = headers.find(h => /d[eé]bit/.test(h))
  const creditCol = headers.find(h => /cr[eé]dit/.test(h))
  const amountCol = headers.find(h => /montant|amount|somme/.test(h))

  if (!dateCol || !labelCol) {
    throw createError({ statusCode: 400, message: 'Colonnes date et libellé non détectées dans le CSV' })
  }

  // Fetch recurring entries for matching
  const recurringEntries = await db.select().from(schema.recurringEntries)

  // Fetch distinct transaction labels
  const existingTransactions = await db.select({ label: schema.transactions.label }).from(schema.transactions)
  const distinctLabels = [...new Set(existingTransactions.map(t => t.label))]

  const rows = (parsed.data as Record<string, string>[]).map((row) => {
    const rawLabel = (row[labelCol] ?? '').trim()

    // Parse date - try common French formats
    let date = ''
    const rawDate = (row[dateCol] ?? '').trim()
    // Try DD/MM/YYYY
    const frMatch = rawDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (frMatch) {
      date = `${frMatch[3]}-${frMatch[2]}-${frMatch[1]}`
    } else {
      // Try YYYY-MM-DD
      const isoMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (isoMatch) date = rawDate
    }

    // Parse amount
    let amount = 0
    let type: 'income' | 'expense' = 'expense'

    if (debitCol && creditCol) {
      const debit = parseFloat((row[debitCol] ?? '0').replace(',', '.').replace(/\s/g, '')) || 0
      const credit = parseFloat((row[creditCol] ?? '0').replace(',', '.').replace(/\s/g, '')) || 0
      if (credit > 0) {
        amount = credit
        type = 'income'
      } else {
        amount = Math.abs(debit)
        type = 'expense'
      }
    } else if (amountCol) {
      const raw = parseFloat((row[amountCol] ?? '0').replace(',', '.').replace(/\s/g, '')) || 0
      amount = Math.abs(raw)
      type = raw >= 0 ? 'income' : 'expense'
    }

    // Fuzzy match against recurring entries
    let bestMatch: { recurringEntryId: number, label: string, confidence: number } | null = null
    let bestScore = 0

    for (const entry of recurringEntries) {
      const score = matchScore(rawLabel, entry.label)
      if (score > bestScore && score >= 0.5) {
        bestScore = score
        bestMatch = { recurringEntryId: entry.id, label: entry.label, confidence: score }
      }
    }

    // If no match from recurring, try transaction labels with lower priority
    if (!bestMatch) {
      for (const txLabel of distinctLabels) {
        const score = matchScore(rawLabel, txLabel)
        if (score > bestScore && score >= 0.7) {
          bestScore = score
          bestMatch = { recurringEntryId: 0, label: txLabel, confidence: score * 0.8 }
        }
      }
    }

    return {
      rawLabel,
      date,
      amount: Math.round(amount * 100) / 100,
      type,
      suggestedMatch: bestMatch
    }
  }).filter(r => r.date && r.amount > 0)

  return {
    rows,
    filename,
    totalRows: rows.length
  }
})
