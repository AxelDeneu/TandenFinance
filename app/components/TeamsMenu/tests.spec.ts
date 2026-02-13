import { describe, it, expect, vi } from 'vitest'
import { ref, computed, nextTick } from 'vue'
import { initTeamsMenu } from './init'

// Stub Nuxt auto-imports
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)

describe('initTeamsMenu', () => {
  it('should return teams list with 3 teams', () => {
    const props = { collapsed: false }
    const result = initTeamsMenu({ props })

    expect(result.teams.value).toHaveLength(3)
    expect(result.teams.value[0].label).toBe('Nuxt')
    expect(result.teams.value[1].label).toBe('NuxtHub')
    expect(result.teams.value[2].label).toBe('NuxtLabs')
  })

  it('should select first team by default', () => {
    const props = { collapsed: false }
    const result = initTeamsMenu({ props })

    expect(result.selectedTeam.value.label).toBe('Nuxt')
  })

  it('should compute dropdown items with team selection and actions', () => {
    const props = { collapsed: false }
    const result = initTeamsMenu({ props })
    const menuItems = result.items.value

    expect(menuItems).toHaveLength(2)
    // First group: team selection items
    expect(menuItems[0]).toHaveLength(3)
    // Second group: action items
    expect(menuItems[1]).toHaveLength(2)
    expect(menuItems[1][0].label).toBe('Créer une équipe')
    expect(menuItems[1][1].label).toBe('Gérer les équipes')
  })

  it('should change selected team via onSelect', async () => {
    const props = { collapsed: false }
    const result = initTeamsMenu({ props })
    const menuItems = result.items.value

    // Select the second team (NuxtHub)
    menuItems[0][1].onSelect!({} as Event)
    await nextTick()

    expect(result.selectedTeam.value.label).toBe('NuxtHub')
  })

  it('should have correct avatar data for each team', () => {
    const props = { collapsed: false }
    const result = initTeamsMenu({ props })

    expect(result.teams.value[0].avatar.src).toBe('https://github.com/nuxt.png')
    expect(result.teams.value[1].avatar.src).toBe('https://github.com/nuxt-hub.png')
    expect(result.teams.value[2].avatar.src).toBe('https://github.com/nuxtlabs.png')
  })
})
