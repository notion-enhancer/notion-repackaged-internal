const path = require('node:path')
const fs = require('node:fs/promises')

const sharedLinuxMakersOptions = {
  name: 'notion-enhanced',
  productName: 'Notion Repackaged Enhanced',
  description: 'The all-in-one workspace for your notes and tasks',
  version: '1.0.0',
  homepage: 'https://github.com/notion-enhancer/notion-linux',
  categories: ['Utility', 'Office', 'Education', 'Development'],
  mimeType: ['x-scheme-handler/notion'],
  icon: 'icon.ico',
}

module.exports = {
  packagerConfig: {
    asar: true,
    prune: true,
    icon: 'icon.ico',
    extraResource: ['./extraResources/trayIcon.ico'],
    protocols: [
      {
        name: 'notion',
        schemes: ['notion'],
      },
    ],
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Notion Enhancer',
          ...sharedLinuxMakersOptions,
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          license: 'MIT',
          ...sharedLinuxMakersOptions,
        },
      },
    },
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'notion-enhancer',
          name: 'notion-repackaged',
        },
        prerelease: true,
      },
    },
  ],
  hooks: {
    packageAfterPrune: async (_forgeConfig, buildPath) => {
      const gypPath = path.join(
        buildPath,
        'node_modules',
        'better-sqlite3',
        'build',
        'node_gyp_bins',
      )

      await fs.rm(gypPath, {
        recursive: true,
        force: true,
      })
    },

    postPackage: async (_forgeConfig, options) => {
      const enhancer = await import(
        'notion-enhancer/scripts/enhance-desktop-app.mjs'
      )

      const path = options.outputPaths[0]
      enhancer.setNotionPath(path)

      await enhancer.enhanceApp(true)
    },
  },
}
