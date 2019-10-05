module.exports = {
  make_targets: {
    win32: ['zip'],
    darwin: ['zip', 'dmg'],
    // Do not build deb on Linux because I primarily work on Arch Linux
    // which cannot build them
    linux: ['zip']
  },
  makers: [
    {
      name: '@electron-forge/maker-zip'
    }
  ],
  plugins: [
    [
      '@electron-forge/plugin-webpack',
      {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/view/main/index.html',
              js: './src/view/main/renderer.js',
              name: 'main_window'
            }
          ]
        }
      }
    ]
  ]
}
