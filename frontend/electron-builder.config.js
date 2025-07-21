/**
 * @type {import('electron-builder').Configuration}
 */
module.exports = {
  appId: 'com.a1betting.app',
  productName: 'A1Betting',
  copyright: 'Copyright © 2024 A1Betting',

  directories: {
    output: 'electron-dist',
    buildResources: 'build-resources',
  },

  files: [
    'dist/index.html', // Explicitly include renderer entry
    'dist/**/*',
    'public/main.js',
    'public/preload.js',
    'public/icon.png',
    'node_modules/**/*',
    '!node_modules/electron/**/*',
    '!node_modules/.cache/**/*',
    '!**/*.ts',
    '!**/*.map',
  ],

  extraResources: [
    {
      from: 'public/icons',
      to: 'icons',
      filter: ['**/*'],
    },
  ],

  // Windows configuration
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'ia32'],
      },
      {
        target: 'portable',
        arch: ['x64'],
      },
    ],
    icon: 'public/icon.ico',
    publisherName: 'A1Betting',
    verifyUpdateCodeSignature: false,
    artifactName: '${productName}-${version}-${arch}.${ext}',
  },

  // NSIS installer configuration
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    allowElevation: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'A1Betting',
    uninstallDisplayName: 'A1Betting - Sports Intelligence Platform',
    installerIcon: 'public/icon.ico',
    uninstallerIcon: 'public/icon.ico',
    installerHeaderIcon: 'public/icon.ico',
    deleteAppDataOnUninstall: true,
    perMachine: false,
    license: 'LICENSE.txt',
  },

  // macOS configuration
  mac: {
    category: 'public.app-category.sports',
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64'],
      },
      {
        target: 'zip',
        arch: ['x64', 'arm64'],
      },
    ],
    icon: 'public/icon.icns',
    type: 'distribution',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build-resources/entitlements.mac.plist',
    entitlementsInherit: 'build-resources/entitlements.mac.plist',
    artifactName: '${productName}-${version}-${arch}.${ext}',
  },

  // DMG configuration
  dmg: {
    title: 'A1Betting ${version}',
    icon: 'public/icon.icns',
    background: 'build-resources/dmg-background.png',
    contents: [
      {
        x: 130,
        y: 220,
      },
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications',
      },
    ],
    window: {
      width: 540,
      height: 380,
    },
  },

  // Linux configuration
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64'],
      },
      {
        target: 'deb',
        arch: ['x64'],
      },
      {
        target: 'rpm',
        arch: ['x64'],
      },
    ],
    icon: 'public/icons/',
    category: 'Office',
    synopsis: 'Real-Time Sports Intelligence Platform',
    description:
      'Advanced sports betting analysis platform with ML-powered predictions and real-time data analysis.',
    desktop: {
      Name: 'A1Betting',
      Comment: 'Sports Intelligence Platform',
      Keywords: 'sports;betting;analysis;predictions;',
      Categories: 'Office;Finance;Sports;',
    },
    artifactName: '${productName}-${version}-${arch}.${ext}',
  },

  // AppImage configuration
  appImage: {
    license: 'LICENSE.txt',
  },

  // Compression and optimization
  compression: 'store', // Disable compression for debugging asar corruption

  // Code signing (for production)
  // win: {
  //   certificateFile: 'path/to/certificate.p12',
  //   certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD
  // },
  //
  // mac: {
  //   identity: 'Developer ID Application: Your Name (XXXXXXXXXX)'
  // },

  // Auto-updater configuration
  publish: [
    {
      provider: 'github',
      owner: 'a1betting',
      repo: 'a1betting-app',
      releaseType: 'release',
    },
  ],

  // Build metadata
  buildVersion: process.env.BUILD_NUMBER || '1',

  // Squirrel.Windows configuration (alternative to NSIS)
  squirrelWindows: {
    iconUrl: 'https://your-domain.com/icon.ico',
    loadingGif: 'build-resources/install-spinner.gif',
    msi: true,
    remoteReleases: 'https://your-domain.com/releases/',
  },

  // Snap configuration for Linux
  snap: {
    grade: 'stable',
    confinement: 'strict',
    summary: 'Real-Time Sports Intelligence Platform',
  },

  // Portable executable configuration
  portable: {
    requestExecutionLevel: 'user',
  },

  // Additional metadata
  extraMetadata: {
    main: 'public/main.js',
    homepage: 'https://a1betting.com',
    repository: {
      type: 'git',
      url: 'https://github.com/a1betting/a1betting-app.git',
    },
    bugs: {
      url: 'https://github.com/a1betting/a1betting-app/issues',
    },
    keywords: ['sports', 'betting', 'analysis', 'predictions', 'machine-learning', 'real-time'],
  },

  // Build hooks
  beforeBuild: async context => {
    console.log('Building A1Betting application...');
    // Custom build logic here
  },

  afterSign: async context => {
    console.log('Application signed successfully');
    // Notarization for macOS would go here
  },

  afterAllArtifactBuild: async buildResult => {
    console.log('All artifacts built successfully');
    console.log('Artifacts:', buildResult.artifactPaths);
    return buildResult.artifactPaths;
  },
};
