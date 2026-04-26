<script setup lang="ts">
import type { Category } from '~/types'
import { useCrudModals } from '~/composables/useCrudModals'

const { showErrorToast } = useErrorToast()
const toast = useToast()

const { data: categories, status, refresh } = useFetch<Category[]>('/api/budget/categories', {
  lazy: true,
  default: () => []
})

const search = ref('')
const typeFilter = ref<'all' | 'income' | 'expense'>('all')

const filtered = computed(() => {
  let list = categories.value
  if (typeFilter.value !== 'all') list = list.filter(c => c.type === typeFilter.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(q))
  }
  return list
})

const {
  editingEntry,
  editModalOpen,
  addModalOpen,
  openEditModal,
  onSaved
} = useCrudModals<Category>({
  onRefresh: () => refresh()
})

async function deleteCategory(category: Category) {
  if (!confirm(`Supprimer la catégorie "${category.name}" ?`)) return
  try {
    await $fetch(`/api/budget/categories/${category.id}`, { method: 'DELETE' })
    toast.add({
      title: 'Supprimée',
      description: `Catégorie "${category.name}" supprimée`,
      color: 'success'
    })
    await refresh()
  } catch (error) {
    showErrorToast('Suppression impossible', error)
  }
}
</script>

<template>
  <TandenPanel>
    <template #head>
      <h2>Catégories</h2>
      <span class="tf-tag">{{ filtered.length }}</span>
    </template>
    <template #headRight>
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Rechercher…"
        size="sm"
        class="w-40"
      />
      <USelect
        v-model="typeFilter"
        :items="[
          { label: 'Tous', value: 'all' },
          { label: 'Revenus', value: 'income' },
          { label: 'Dépenses', value: 'expense' }
        ]"
        size="sm"
        class="min-w-32"
      />
      <UButton
        label="Ajouter"
        icon="i-lucide-plus"
        size="sm"
        color="primary"
        variant="ghost"
        @click="addModalOpen = true"
      />
    </template>

    <div v-if="status === 'pending'" class="flex items-center justify-center py-10">
      <UIcon name="i-lucide-loader-2" class="animate-spin text-muted size-5" />
    </div>

    <div v-else-if="filtered.length === 0" class="px-4 py-8 text-center tf-text-subtle text-sm">
      Aucune catégorie.
    </div>

    <table v-else class="tf-tbl">
      <thead>
        <tr>
          <th>Catégorie</th>
          <th style="width: 110px;">
            Type
          </th>
          <th class="right" style="width: 130px;">
            Couleur
          </th>
          <th style="width: 80px;" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in filtered" :key="c.id">
          <td>
            <div class="flex items-center gap-2">
              <span
                class="grid place-items-center rounded-md"
                :style="{
                  width: '26px',
                  height: '26px',
                  color: c.color,
                  borderColor: `${c.color}33`,
                  background: `${c.color}10`,
                  border: '1px solid'
                }"
              >
                <UIcon :name="c.icon" class="size-3.5" />
              </span>
              <span style="font-weight: 500;">{{ c.name }}</span>
            </div>
          </td>
          <td>
            <span class="text-muted" style="font-size: 12px;">
              {{ c.type === 'income' ? 'Revenu' : 'Dépense' }}
            </span>
          </td>
          <td class="right">
            <span
              class="inline-flex items-center gap-1.5"
              style="padding: 2px 8px; border: 1px solid var(--border); border-radius: var(--r-2);"
            >
              <span :style="{ width: '10px', height: '10px', borderRadius: '3px', background: c.color }" />
              <span class="text-muted tf-num" style="font-size: 11px;">{{ c.color }}</span>
            </span>
          </td>
          <td>
            <div class="flex items-center justify-end gap-1">
              <UButton
                icon="i-lucide-edit"
                size="xs"
                color="neutral"
                variant="ghost"
                @click="openEditModal(c)"
              />
              <UButton
                icon="i-lucide-trash-2"
                size="xs"
                color="error"
                variant="ghost"
                @click="deleteCategory(c)"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <ConfigCategoryModal
      v-model:open="addModalOpen"
      @saved="onSaved"
    />

    <ConfigCategoryModal
      v-model:open="editModalOpen"
      :category="editingEntry"
      @saved="onSaved"
    />
  </TandenPanel>
</template>

<style scoped>
.tf-tbl {
  width: 100%;
  border-collapse: collapse;
}
.tf-tbl thead th {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--fg-subtle);
  text-align: left;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
}
.tf-tbl thead th.right { text-align: right; }
.tf-tbl tbody td {
  padding: 10px 16px;
  font-size: 13px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
.tf-tbl tbody td.right { text-align: right; }
.tf-tbl tbody tr:last-child td { border-bottom: none; }
.tf-tbl tbody tr:hover { background: var(--bg-elev-2); }
</style>
