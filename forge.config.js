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
    },
    {
      // do not even run on linux, otherwise it tries to build d
      platforms: [],
      name: '@electron-forge/maker-deb'
    }
  ]
}
