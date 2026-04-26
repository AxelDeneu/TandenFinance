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

  ignore: [
    '.claude/**/*'
  ],

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

  // Use @parcel/watcher (native, FSEvents-backed) instead of chokidar.
  // Nuxt 4's default with srcDir=app/ is 'chokidar', which on macOS uses
  // fs.watch() and opens one FD per watched directory. With pnpm symlinks,
  // node_modules expands to ~30k dirs and exhausts the per-process FD cap
  // (EMFILE). @parcel/watcher uses one global FSEvents handle for the whole
  // tree and ignores node_modules cleanly — proven on this machine since the
  // native binding `@parcel/watcher-darwin-arm64` is installed and loads.
  experimental: {
    watcher: 'parcel'
  },

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
  },
})
