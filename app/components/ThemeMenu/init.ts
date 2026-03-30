import type { DropdownMenuItem } from '@nuxt/ui'

interface ThemeMenuContext {
  props: { collapsed?: boolean }
}

export function initThemeMenu(_ctx: ThemeMenuContext) {
  const appConfig = useAppConfig()

  const colors = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
  const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone']

  const items = computed<DropdownMenuItem[][]>(() => ([[{
    label: 'Thème',
    icon: 'i-lucide-palette',
    children: [{
      label: 'Primaire',
      slot: 'chip',
      chip: appConfig.ui.colors.primary,
      content: {
        align: 'center',
        collisionPadding: 16
      },
      children: colors.map(color => ({
        label: color,
        chip: color,
        slot: 'chip',
        checked: appConfig.ui.colors.primary === color,
        type: 'checkbox',
        onSelect: (e: Event) => {
          e.preventDefault()

          appConfig.ui.colors.primary = color
        }
      }))
    }, {
      label: 'Neutre',
      slot: 'chip',
      chip: appConfig.ui.colors.neutral === 'neutral' ? 'old-neutral' : appConfig.ui.colors.neutral,
      content: {
        align: 'end',
        collisionPadding: 16
      },
      children: neutrals.map(color => ({
        label: color,
        chip: color === 'neutral' ? 'old-neutral' : color,
        slot: 'chip',
        type: 'checkbox',
        checked: appConfig.ui.colors.neutral === color,
        onSelect: (e: Event) => {
          e.preventDefault()

          appConfig.ui.colors.neutral = color
        }
      }))
    }]
  }]]))

  return {
    items
  }
}
