import * as z from 'zod'
import type { Ref } from 'vue'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Category } from '~/types'

export const categorySchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  icon: z.string().min(1, 'Icône requise').max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format #RRGGBB'),
  type: z.enum(['income', 'expense']),
  sortOrder: z.coerce.number().int().min(0).default(0)
})

export type CategorySchema = z.output<typeof categorySchema>

interface CategoryModalContext {
  props: { category?: Category | null }
  emit: (event: 'saved') => void
  open: Ref<boolean>
}

export function initCategoryModal(ctx: CategoryModalContext) {
  const toast = useToast()
  const { showErrorToast } = useErrorToast()

  const state = reactive<Partial<CategorySchema>>({
    name: '',
    icon: 'i-lucide-tag',
    color: '#6B7489',
    type: 'expense',
    sortOrder: 0
  })

  const isEdit = computed(() => !!ctx.props.category)
  const modalTitle = computed(() => isEdit.value ? 'Modifier la catégorie' : 'Nouvelle catégorie')

  watch(() => ctx.props.category, (cat) => {
    if (cat) {
      state.name = cat.name
      state.icon = cat.icon
      state.color = cat.color
      state.type = cat.type
      state.sortOrder = cat.sortOrder
    } else {
      state.name = ''
      state.icon = 'i-lucide-tag'
      state.color = '#6B7489'
      state.type = 'expense'
      state.sortOrder = 0
    }
  }, { immediate: true })

  async function onSubmit(event: FormSubmitEvent<CategorySchema>) {
    try {
      if (isEdit.value && ctx.props.category) {
        await $fetch(`/api/budget/categories/${ctx.props.category.id}`, {
          method: 'PUT',
          body: event.data
        })
        toast.add({
          title: 'Succès',
          description: `La catégorie "${event.data.name}" a été modifiée`,
          color: 'success'
        })
      } else {
        await $fetch('/api/budget/categories', {
          method: 'POST',
          body: event.data
        })
        toast.add({
          title: 'Succès',
          description: `La catégorie "${event.data.name}" a été créée`,
          color: 'success'
        })
      }
      ctx.open.value = false
      ctx.emit('saved')
    } catch (error) {
      showErrorToast('Une erreur est survenue', error)
    }
  }

  return {
    schema: categorySchema,
    state,
    isEdit,
    modalTitle,
    onSubmit
  }
}

export const ICON_PRESETS = [
  'i-lucide-tag',
  'i-lucide-shopping-cart',
  'i-lucide-fuel',
  'i-lucide-play',
  'i-lucide-briefcase',
  'i-lucide-zap',
  'i-lucide-coffee',
  'i-lucide-credit-card',
  'i-lucide-home',
  'i-lucide-heart',
  'i-lucide-gift',
  'i-lucide-shield',
  'i-lucide-piggy-bank',
  'i-lucide-trending-up',
  'i-lucide-receipt',
  'i-lucide-droplets',
  'i-lucide-wifi',
  'i-lucide-baby',
  'i-lucide-shirt',
  'i-lucide-graduation-cap',
  'i-lucide-landmark',
  'i-lucide-banknote',
  'i-lucide-dog',
  'i-lucide-sparkles',
  'i-lucide-laptop',
  'i-lucide-hand-helping'
]

export const COLOR_PRESETS = [
  '#1FB578', '#4ADE80', '#22D3EE', '#60A5FA', '#A78BFA',
  '#F472B6', '#F87171', '#FB923C', '#F6946A', '#FBBF24',
  '#A5ADBE', '#6B7489'
]
