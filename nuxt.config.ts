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
  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'dark',
    fallback: 'dark'
  },

  runtimeConfig: {
    mcpToken: ''
  },

  routeRules: {
    '/api/**': {
      headers: {
        'Access-Control-Allow-Origin': process.env.NUXT_PUBLIC_SITE_URL ?? 'https://tandenfinance.nuxt.dev',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      }
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
