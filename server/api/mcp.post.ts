import type { H3Event } from 'h3'
import { timingSafeEqual } from 'crypto'

const PROTOCOL_VERSION = '2025-03-26'
const SERVER_INFO = { name: 'tandenfinance-mcp', version: '0.1.0' }

interface JsonRpcRequest {
  jsonrpc: '2.0'
  id?: number | string | null
  method: string
  params?: Record<string, unknown>
}

interface ToolDef {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  handler: (args: Record<string, unknown>) => Promise<unknown>
}

const yearMonthSchema = {
  type: 'object',
  properties: {
    year: { type: 'integer', description: 'Année (ex. 2026)' },
    month: { type: 'integer', minimum: 1, maximum: 12, description: 'Mois 1-12' }
  },
  required: ['year', 'month']
}

const monthsSchema = {
  type: 'object',
  properties: {
    months: { type: 'integer', minimum: 1, maximum: 24, description: 'Nombre de mois à analyser (défaut 12)' }
  }
}

const tools: ToolDef[] = [
  {
    name: 'list_transactions',
    description: 'Liste les transactions (dépenses/revenus) pour un mois donné, triées par date décroissante.',
    inputSchema: yearMonthSchema,
    handler: args => $fetch('/api/budget/transactions', { query: { year: args.year, month: args.month } })
  },
  {
    name: 'search_transactions',
    description: 'Recherche des transactions par libellé (recherche partielle, insensible à la casse). Retourne max 10 résultats.',
    inputSchema: {
      type: 'object',
      properties: { q: { type: 'string', description: 'Terme de recherche (max 100 caractères)' } },
      required: ['q']
    },
    handler: args => $fetch('/api/budget/transactions/search', { query: { q: args.q } })
  },
  {
    name: 'list_transaction_labels',
    description: 'Retourne la liste des libellés de transactions utilisés précédemment, utile pour suggestions.',
    inputSchema: { type: 'object', properties: {} },
    handler: () => $fetch('/api/budget/transactions/labels')
  },
  {
    name: 'list_recurring_expenses',
    description: 'Liste toutes les dépenses récurrentes configurées (abonnements, loyer, factures...).',
    inputSchema: { type: 'object', properties: {} },
    handler: () => $fetch('/api/budget/expenses')
  },
  {
    name: 'list_recurring_incomes',
    description: 'Liste tous les revenus récurrents configurés (salaire, etc.).',
    inputSchema: { type: 'object', properties: {} },
    handler: () => $fetch('/api/budget/incomes')
  },
  {
    name: 'list_envelopes',
    description: 'Liste les enveloppes budgétaires (budgets par catégorie : alimentation, loisirs, etc.).',
    inputSchema: { type: 'object', properties: {} },
    handler: () => $fetch('/api/budget/envelopes')
  },
  {
    name: 'get_analytics_summary',
    description: 'Résumé analytique sur les N derniers mois : revenus moyens, dépenses moyennes, taux d\'épargne, meilleurs/pires mois, catégories en hausse/baisse.',
    inputSchema: monthsSchema,
    handler: args => $fetch('/api/budget/analytics/summary', { query: { months: args.months ?? 12 } })
  },
  {
    name: 'get_category_breakdown',
    description: 'Répartition des dépenses et revenus par catégorie pour un mois donné, avec montants et pourcentages.',
    inputSchema: yearMonthSchema,
    handler: args => $fetch('/api/budget/analytics/category-breakdown', { query: { year: args.year, month: args.month } })
  },
  {
    name: 'get_category_trends',
    description: 'Évolution des catégories (dépenses et revenus) sur les N derniers mois, avec moyennes et tendance (rising/stable/falling).',
    inputSchema: monthsSchema,
    handler: args => $fetch('/api/budget/analytics/category-trends', { query: { months: args.months ?? 6 } })
  },
  {
    name: 'get_forecast',
    description: 'Projection budgétaire sur N mois à partir d\'une date de départ : compare les montants récurrents prévus avec les transactions réelles.',
    inputSchema: {
      type: 'object',
      properties: {
        months: { type: 'integer', minimum: 1, maximum: 12 },
        year: { type: 'integer' },
        month: { type: 'integer', minimum: 1, maximum: 12 }
      }
    },
    handler: args => $fetch('/api/budget/forecast', { query: { months: args.months ?? 6, year: args.year, month: args.month } })
  },
  {
    name: 'list_budget_rules',
    description: 'Liste les règles d\'alerte budgétaire configurées (dépassement d\'enveloppe, solde faible, seuil par catégorie).',
    inputSchema: { type: 'object', properties: {} },
    handler: () => $fetch('/api/budget/rules')
  }
]

const toolMap = new Map(tools.map(t => [t.name, t]))

function rpcResult(id: JsonRpcRequest['id'], result: unknown) {
  return { jsonrpc: '2.0' as const, id: id ?? null, result }
}

function rpcError(id: JsonRpcRequest['id'], code: number, message: string) {
  return { jsonrpc: '2.0' as const, id: id ?? null, error: { code, message } }
}

async function handleRpc(req: JsonRpcRequest) {
  switch (req.method) {
    case 'initialize':
      return rpcResult(req.id, {
        protocolVersion: PROTOCOL_VERSION,
        serverInfo: SERVER_INFO,
        capabilities: { tools: {} }
      })

    case 'notifications/initialized':
    case 'notifications/cancelled':
      return null // notifications: no response

    case 'ping':
      return rpcResult(req.id, {})

    case 'tools/list':
      return rpcResult(req.id, {
        tools: tools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }))
      })

    case 'tools/call': {
      const params = (req.params ?? {}) as { name?: string, arguments?: Record<string, unknown> }
      const tool = params.name ? toolMap.get(params.name) : undefined
      if (!tool) return rpcError(req.id, -32602, `Unknown tool: ${params.name}`)
      try {
        const data = await tool.handler(params.arguments ?? {})
        return rpcResult(req.id, {
          content: [{ type: 'text', text: JSON.stringify(data) }]
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return rpcResult(req.id, {
          content: [{ type: 'text', text: `Error: ${msg}` }],
          isError: true
        })
      }
    }

    default:
      return rpcError(req.id, -32601, `Method not found: ${req.method}`)
  }
}

function requireAuth(event: H3Event) {
  const expected = useRuntimeConfig().mcpToken
  if (!expected) {
    throw createError({ statusCode: 500, message: 'MCP token not configured (NUXT_MCP_TOKEN)' })
  }
  const header = getHeader(event, 'authorization') ?? ''
  const headerBuf = Buffer.from(header)
  const expectedBuf = Buffer.from(`Bearer ${expected}`)
  if (headerBuf.length !== expectedBuf.length || !timingSafeEqual(headerBuf, expectedBuf)) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
}

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const body = await readBody<JsonRpcRequest | JsonRpcRequest[]>(event)
  const isBatch = Array.isArray(body)
  const requests = isBatch ? body : [body]

  const responses = (await Promise.all(requests.map(handleRpc))).filter(r => r !== null)

  if (responses.length === 0) {
    setResponseStatus(event, 202)
    return null
  }

  return isBatch ? responses : responses[0]
})
