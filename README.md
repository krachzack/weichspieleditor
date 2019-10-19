# weichspielapparat
A graphical user interface for the `fernspielapparat` [runtime](https://github.com/krachzack/fernspielapparat)
in early development.

You can use it to play text-based games packaged in phonebooks.
You can make your own phonebooks with the
[fernspieleditor](https://krachzack.github.io/fernspieleditor/).

## Getting Started
These instructions (try to) help you run `weichspielapparat` on your computer.

### Prerequisites
`weichspielapparat` needs some other software to be installed on your computer
to run.

#### VLC
Install the VLC media player for your platform. `weichspielapparat` needs it
to play media and speech.

On Linux, you can install `vlc` or `cvlc` with your favorite package manager.
On other platforms, check out their [website](https://www.videolan.org),
download it and install it.

#### espeak
It is generally recommended to install `espeak` for your platform.
`weichspielapparat` uses it to generate sound files with speech from
the phonebooks it runs.

On Linux, you can install it through your system package manager.

On Mac, you may want to install it with [Homebrew](https://brew.sh/)
or one of its alternatives. If you do not install `espeak`, the app
will instead use the system-provided `say`, a utility that is available
on all Macs.

On Windows, consider downloading `espeak` from [SourceForge](http://espeak.sourceforge.net/download.html)
and adding it to your `Path` environment variable manually. If you don't
feel like going through this, that's okay, the runtime can also use the
built-in speech synthesis from Windows, but it will sound different than
`espeak`.

#### Caveat: `Path` on Windows
On Windows, make sure `espeak` is on your `Path` environment variable if you
want to use it, otherwise the runtime can not find it. For VLC, the
weichspielapparat will automatically search for it in a typcial installation
directory. If you have a weird Setup you might get errors that `libvlc.dll`
is missing. To fix it, you have to find `libvlc.dll` and make sure it is on
the `Path`.

#### Caveat: `espeak` on Linux
On Linux, installing `espeak` is absolutely required for `weichspielapparat`
to run, because there is no "built-in" speech synthesis that is generally
available on Linux systems.

#### Caveat: `espeak` on Non-Linux Platforms
On Windows and Mac, make sure that `espeak` is available on the `PATH`,
so that the runtime can find it. You can check whether it is on your
path with `which espak` on Unix-like platforms. If it prints some path,
then you are good to go. If it prints nothing, find out where the espeak
binaries are and find a good guide for your platform on how to make a
binary available on your path environment variable.

### Installing
The easiest way to install is to download a binary release for your platform
from [GitHub](https://github.com/krachzack/weichspielapparat/releases).

If you want to build `weichspielapparat` yourself, you need to check out
this repository, cd into it, install node and yarn, and then run it with
`yarn start`.

## Customizing `weichspielapparat`
This sections outlines how to make your own changes to how `weichspielapparat`
works.

### Runtime Versions
If you do not have `fernspielapparat` installed, then `weichspielapparat`
will automatically download a recent version at startup.

If you want to control the version of the runtime, you need to make sure
it is available on the `PATH`. This may be useful if you want to tinker
with the runtime and make your own changes to it. To do this you can fork
the runtime from its [repository](https://github.com/krachzack/fernspielapparat)
and start hacking. If you feel that your changes would help other people
using this repository, consider filing a pull request. Any contribution is
welcome.

## Built With
`weichspielapparat` and the underlying runtime called `fernspielapparat` are
possible because they rely on the excellent work of other open source projects.

### weichspielapparat
* [Electron](https://electronjs.org/) - Used for playing sound
* [node.js](https://nodejs.org/) - Used to build auto-updating and all the other code in here
* [Fira Sans](https://fonts.google.com/specimen/Fira+Sans) - Free font used as the primary UI font

### fernspielapparat
* [Rust](https://www.rust-lang.org/) - Used to build it and make it both safe and efficient
* [VLC Media Player](https://www.videolan.org) - Plays sounds and speech
* [espeak](http://espeak.sourceforge.net) - Generates sound files for speech samples

## License
GPLv3, see [LICENSE](LICENSE).
