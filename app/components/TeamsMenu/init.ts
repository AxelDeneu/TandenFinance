import type { DropdownMenuItem } from '@nuxt/ui'

interface TeamsMenuContext {
  props: { collapsed?: boolean }
}

export function initTeamsMenu(_ctx: TeamsMenuContext) {
  const teams = ref([{
    label: 'Nuxt',
    avatar: {
      src: 'https://github.com/nuxt.png',
      alt: 'Nuxt'
    }
  }, {
    label: 'NuxtHub',
    avatar: {
      src: 'https://github.com/nuxt-hub.png',
      alt: 'NuxtHub'
    }
  }, {
    label: 'NuxtLabs',
    avatar: {
      src: 'https://github.com/nuxtlabs.png',
      alt: 'NuxtLabs'
    }
  }])
  const selectedTeam = ref(teams.value[0])

  const items = computed<DropdownMenuItem[][]>(() => {
    return [teams.value.map(team => ({
      ...team,
      onSelect() {
        selectedTeam.value = team
      }
    })), [{
      label: 'Créer une équipe',
      icon: 'i-lucide-circle-plus'
    }, {
      label: 'Gérer les équipes',
      icon: 'i-lucide-cog'
    }]]
  })

  return {
    teams,
    selectedTeam,
    items
  }
}
