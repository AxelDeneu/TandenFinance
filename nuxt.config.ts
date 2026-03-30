// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxt/hints',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxthub/core',
    '@nuxtjs/google-fonts'
  ],
  components: {
    dirs: [{
      path: '~/components',
      extensions: ['vue']
    }]
  },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'dark',
    fallback: 'dark'
  },

  routeRules: {
    '/api/**': {
      cors: true
    }
  },

  compatibilityDate: '2024-07-11',

  hub: {
    db: {
      dialect: 'postgresql',
      applyMigrationsDuringBuild: false
    }
  },

  typescript: {
    tsConfig: {
      exclude: ['../app/**/*.spec.ts']
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
