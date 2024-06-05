const path = require('node:path')
const fs = require('node:fs/promises')
const { glob } = require('glob')

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
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
      },
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
          name: 'notion-repackaged-internal',
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

      console.log('Removing gyp path:', gypPath)
      await fs.rm(gypPath, {
        recursive: true,
        force: true,
      })
    },

    postPackage: async (_forgeConfig, options) => {
      const enhancer = await import(
        'notion-enhancer/scripts/enhance-desktop-app.mjs'
      )

      const appAsarPaths = await glob('**/app.asar', {
        cwd: options.outputPaths[0],
        absolute: true,
      })

      if (appAsarPaths.length !== 1) {
        throw new Error('Expected exactly one app.asar file')
      }

      const appResourcesDir = path.dirname(appAsarPaths[0])
      console.log('Setting notion resources path:', appResourcesDir)
      console.log('Directory contents:', await fs.readdir(appResourcesDir))
      enhancer.setNotionPath(appResourcesDir)

      const result = await enhancer.enhanceApp(true)
      if (!result) {
        throw new Error('Failed to enhance app')
      }
    },
  },
}
