import type { DropdownMenuItem } from '@nuxt/ui'

interface UserMenuContext {
  props: { collapsed?: boolean }
}

export function initUserMenu(_ctx: UserMenuContext) {
  const colorMode = useColorMode()
  const appConfig = useAppConfig()

  const colors = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
  const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone']

  const user = ref({
    name: 'Benjamin Canac',
    avatar: {
      src: 'https://github.com/benjamincanac.png',
      alt: 'Benjamin Canac'
    }
  })

  const items = computed<DropdownMenuItem[][]>(() => ([[{
    type: 'label',
    label: user.value.name,
    avatar: user.value.avatar
  }], [{
    label: 'Profil',
    icon: 'i-lucide-user'
  }, {
    label: 'Facturation',
    icon: 'i-lucide-credit-card'
  }, {
    label: 'Paramètres',
    icon: 'i-lucide-settings',
    to: '/settings'
  }], [{
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
  }, {
    label: 'Apparence',
    icon: 'i-lucide-sun-moon',
    children: [{
      label: 'Clair',
      icon: 'i-lucide-sun',
      type: 'checkbox',
      checked: colorMode.value === 'light',
      onSelect(e: Event) {
        e.preventDefault()

        colorMode.preference = 'light'
      }
    }, {
      label: 'Sombre',
      icon: 'i-lucide-moon',
      type: 'checkbox',
      checked: colorMode.value === 'dark',
      onUpdateChecked(checked: boolean) {
        if (checked) {
          colorMode.preference = 'dark'
        }
      },
      onSelect(e: Event) {
        e.preventDefault()
      }
    }]
  }], [{
    label: 'Documentation',
    icon: 'i-lucide-book-open',
    to: 'https://ui.nuxt.com/docs/getting-started/installation/nuxt',
    target: '_blank'
  }, {
    label: 'Dépôt GitHub',
    icon: 'i-simple-icons-github',
    to: 'https://github.com/nuxt-ui-templates/dashboard',
    target: '_blank'
  }, {
    label: 'Déconnexion',
    icon: 'i-lucide-log-out'
  }]]))

  return {
    user,
    items
  }
}
