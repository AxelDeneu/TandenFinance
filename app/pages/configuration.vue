<script setup lang="ts">
const householdMembers = [
  { name: 'Axel Deneu', role: 'Administrateur', initials: 'A', tone: 'var(--tanden-accent-500)' },
  { name: 'Dorine Pau', role: 'Membre', initials: 'D', tone: 'var(--tanden-peach-500)' },
  { name: 'Compte commun', role: 'Partagé', initials: 'AD', tone: 'var(--tanden-cyan-500)' }
]

const preferences = [
  { label: 'Mois de référence', desc: 'Du 1er au dernier jour du mois civil', value: 'Mois civil' },
  { label: 'Devise', desc: 'Affichage et calculs', value: 'EUR (€)' },
  { label: 'Premier jour de la semaine', desc: 'Pour les vues hebdomadaires', value: 'Lundi' },
  { label: 'Format des nombres', desc: 'Séparateurs de milliers et décimales', value: 'fr-FR' }
]
</script>

<template>
  <UDashboardPanel id="configuration">
    <template #header>
      <UDashboardNavbar title="Configuration">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <NavbarActions />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="px-2 py-4 flex flex-col gap-5" style="max-width: 1440px; margin: 0 auto; width: 100%;">
        <TandenPageHead
          title="Configuration"
          lede="Catégories, membres du foyer, préférences."
        />

        <div class="tf-config-grid">
          <ConfigCategoryTable />

          <div class="flex flex-col gap-4">
            <TandenPanel>
              <template #head>
                <h2>Foyer</h2>
                <span class="tf-tag">À venir</span>
              </template>

              <div class="flex flex-col gap-2 p-4">
                <div
                  v-for="m in householdMembers"
                  :key="m.name"
                  class="flex items-center gap-3"
                  style="padding: 8px 10px; border: 1px solid var(--border); border-radius: var(--r-3); background: var(--bg-elev-2);"
                >
                  <span
                    class="grid place-items-center text-white shrink-0"
                    style="width: 28px; height: 28px; border-radius: 999px; font-weight: 600; font-size: 11px;"
                    :style="{ background: m.tone }"
                  >
                    {{ m.initials }}
                  </span>
                  <div style="flex: 1;">
                    <div style="font-size: 13px; font-weight: 500;">
                      {{ m.name }}
                    </div>
                    <div class="tf-text-subtle tf-num" style="font-size: 11px;">
                      {{ m.role }}
                    </div>
                  </div>
                </div>
              </div>
            </TandenPanel>

            <TandenPanel>
              <template #head>
                <h2>Préférences</h2>
                <span class="tf-tag">À venir</span>
              </template>

              <div class="flex flex-col gap-3 p-4">
                <div
                  v-for="p in preferences"
                  :key="p.label"
                  class="flex items-center gap-3"
                >
                  <div style="flex: 1;">
                    <div style="font-size: 13px; font-weight: 500;">
                      {{ p.label }}
                    </div>
                    <div class="tf-text-subtle" style="font-size: 11px;">
                      {{ p.desc }}
                    </div>
                  </div>
                  <span class="tf-tag">{{ p.value }}</span>
                </div>
              </div>
            </TandenPanel>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
.tf-config-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}
@media (min-width: 1024px) {
  .tf-config-grid {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  }
}
</style>
