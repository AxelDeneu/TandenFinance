import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'
import { initUserMenu } from './init'

// Stub Nuxt auto-imports
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)

const mockColorMode = ref('light') as ReturnType<typeof useColorMode>
;(mockColorMode as unknown as Record<string, unknown>).preference = 'light'

vi.stubGlobal('useColorMode', () => mockColorMode)

const mockAppConfig = {
  ui: {
    colors: {
      primary: 'green',
      neutral: 'zinc'
    }
  }
}

vi.stubGlobal('useAppConfig', () => mockAppConfig)

describe('initUserMenu', () => {
  beforeEach(() => {
    mockColorMode.value = 'light'
    ;(mockColorMode as unknown as Record<string, unknown>).preference = 'light'
    mockAppConfig.ui.colors.primary = 'green'
    mockAppConfig.ui.colors.neutral = 'zinc'
  })

  it('should return user ref with default data', () => {
    const props = { collapsed: false }
    const result = initUserMenu({ props })

    expect(result.user.value.name).toBe('Benjamin Canac')
    expect(result.user.value.avatar.src).toBe('https://github.com/benjamincanac.png')
  })

  it('should compute dropdown menu items with correct groups', () => {
    const props = { collapsed: false }
    const result = initUserMenu({ props })
    const menuItems = result.items.value

    expect(menuItems).toHaveLength(4)
    // First group: user label
    expect(menuItems[0][0].label).toBe('Benjamin Canac')
    expect(menuItems[0][0].type).toBe('label')
    // Second group: navigation items
    expect(menuItems[1]).toHaveLength(3)
    expect(menuItems[1][0].label).toBe('Profil')
    expect(menuItems[1][1].label).toBe('Facturation')
    expect(menuItems[1][2].label).toBe('Paramètres')
  })

  it('should include theme and appearance items', () => {
    const props = { collapsed: false }
    const result = initUserMenu({ props })
    const themeGroup = result.items.value[2]

    expect(themeGroup[0].label).toBe('Thème')
    expect(themeGroup[0].icon).toBe('i-lucide-palette')
    expect(themeGroup[1].label).toBe('Apparence')
    expect(themeGroup[1].icon).toBe('i-lucide-sun-moon')
  })

  it('should include external links and logout in last group', () => {
    const props = { collapsed: false }
    const result = initUserMenu({ props })
    const lastGroup = result.items.value[3]

    expect(lastGroup).toHaveLength(3)
    expect(lastGroup[0].label).toBe('Documentation')
    expect(lastGroup[1].label).toBe('Dépôt GitHub')
    expect(lastGroup[2].label).toBe('Déconnexion')
  })

  it('should change primary color via onSelect', () => {
    const props = { collapsed: false }
    const result = initUserMenu({ props })
    const themeItem = result.items.value[2][0]
    const primaryChildren = themeItem.children![0].children!

    const mockEvent = { preventDefault: vi.fn() } as unknown as Event
    const blueItem = primaryChildren.find((c: Record<string, unknown>) => c.label === 'blue')!
    blueItem.onSelect!(mockEvent)

    expect(mockAppConfig.ui.colors.primary).toBe('blue')
    expect(mockEvent.preventDefault).toHaveBeenCalled()
  })

  it('should change neutral color via onSelect', () => {
    const props = { collapsed: false }
    const result = initUserMenu({ props })
    const themeItem = result.items.value[2][0]
    const neutralChildren = themeItem.children![1].children!

    const mockEvent = { preventDefault: vi.fn() } as unknown as Event
    const slateItem = neutralChildren.find((c: Record<string, unknown>) => c.label === 'slate')!
    slateItem.onSelect!(mockEvent)

    expect(mockAppConfig.ui.colors.neutral).toBe('slate')
    expect(mockEvent.preventDefault).toHaveBeenCalled()
  })

  it('should set light mode via appearance onSelect', () => {
    const props = { collapsed: false }
    const result = initUserMenu({ props })
    const appearanceItem = result.items.value[2][1]
    const lightItem = appearanceItem.children![0]

    const mockEvent = { preventDefault: vi.fn() } as unknown as Event
    lightItem.onSelect!(mockEvent)

    expect((mockColorMode as unknown as Record<string, unknown>).preference).toBe('light')
    expect(mockEvent.preventDefault).toHaveBeenCalled()
  })

  it('should handle neutral chip display for "neutral" color', () => {
    mockAppConfig.ui.colors.neutral = 'neutral'
    const props = { collapsed: false }
    const result = initUserMenu({ props })
    const themeItem = result.items.value[2][0]
    const neutralSubMenu = themeItem.children![1]

    expect(neutralSubMenu.chip).toBe('old-neutral')
  })
})
