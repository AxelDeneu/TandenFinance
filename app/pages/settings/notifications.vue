<script setup lang="ts">
const state = reactive<{ [key: string]: boolean }>({
  email: true,
  desktop: false,
  product_updates: true,
  weekly_digest: false,
  important_updates: true
})

const sections = [{
  title: 'Canaux de notification',
  description: 'Comment souhaitez-vous etre notifie ?',
  fields: [{
    name: 'email',
    label: 'Email',
    description: 'Recevoir un resume quotidien par email.'
  }, {
    name: 'desktop',
    label: 'Bureau',
    description: 'Recevoir des notifications sur le bureau.'
  }]
}, {
  title: 'Mises a jour du compte',
  description: 'Recevoir des mises a jour.',
  fields: [{
    name: 'weekly_digest',
    label: 'Resume hebdomadaire',
    description: 'Recevoir un resume hebdomadaire des nouveautes.'
  }, {
    name: 'product_updates',
    label: 'Mises a jour produit',
    description: 'Recevoir un email mensuel avec les nouvelles fonctionnalites.'
  }, {
    name: 'important_updates',
    label: 'Mises a jour importantes',
    description: 'Recevoir des emails pour les mises a jour critiques (securite, maintenance, etc.).'
  }]
}]

async function onChange() {
  // Do something with data
  console.log(state)
}
</script>

<template>
  <div v-for="(section, index) in sections" :key="index">
    <UPageCard
      :title="section.title"
      :description="section.description"
      variant="naked"
      class="mb-4"
    />

    <UPageCard variant="subtle" :ui="{ container: 'divide-y divide-default' }">
      <UFormField
        v-for="field in section.fields"
        :key="field.name"
        :name="field.name"
        :label="field.label"
        :description="field.description"
        class="flex items-center justify-between not-last:pb-4 gap-2"
      >
        <USwitch
          v-model="state[field.name]"
          @update:model-value="onChange"
        />
      </UFormField>
    </UPageCard>
  </div>
</template>
