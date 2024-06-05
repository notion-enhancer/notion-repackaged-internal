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

async function removeConflictingGypBins(buildPath) {
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
}

async function setEnhancerMainField(buildPath) {
  const packageJsonPath = path.join(
    buildPath,
    'node_modules',
    'notion-enhancer',
    'package.json',
  )

  const originalPackageJsonString = await fs.readFile(packageJsonPath, 'utf-8')
  const packageJson = JSON.parse(originalPackageJsonString)

  packageJson.main = 'src/init.js'

  const modifiedPackageJsonString = JSON.stringify(packageJson, null, 2)
  await fs.writeFile(packageJsonPath, modifiedPackageJsonString)
}

async function patchFile(enhancerPatcher, buildPath, file) {
  const filePath = path.join(buildPath, file)
  const contents = await fs.readFile(filePath)
  const patchedContents = enhancerPatcher(file, contents)

  if (contents === patchedContents) {
    return false
  }

  await fs.writeFile(filePath, patchedContents)

  return true
}

async function patchAllFiles(buildPath) {
  const { default: enhancerPatcher } = await import(
    'notion-enhancer/scripts/patch-desktop-app.mjs'
  )

  console.log('Enhancer patcher:', enhancerPatcher)

  const files = await glob('**/*.js', {
    cwd: buildPath,
    posix: true,
    nodir: true,
    dot: true,
    absolute: false,
    ignore: ['**/node_modules/**'],
  })

  console.log('Files to patch:', files)

  await Promise.all(
    files.map(async (file) => {
      console.log('Trying to patch file:', file)
      const fileModified = await patchFile(enhancerPatcher, buildPath, file)
      if (fileModified) {
        console.log('Patcher modified file:', file)
      }
    }),
  )
}

async function enhanceSources(buildPath) {
  console.log('Enhancing sources in:', buildPath)

  await patchAllFiles(buildPath)
  await setEnhancerMainField(buildPath)
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
      console.log('Running packageAfterPrune hook, currently in:', buildPath)
      console.log('Directory contents:', await fs.readdir(buildPath))

      await removeConflictingGypBins(buildPath)
      await enhanceSources(buildPath)
    },
  },
}
