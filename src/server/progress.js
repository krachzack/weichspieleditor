/**
 * @typedef Progress
 * @property {string} task - Sentence-case description of what is being done.
 * @property {number} progress - A number in range [0,1], indicating how close the task is to finishing
 */

/**
  * Called when a new sub-task of launching the runtime starts or
  * when progress is made on a long-running task.
  *
  * @callback ProgressCallback
  * @param {Progress} progress - task description and progress
  */

export function reportGitHubQuery (progress) {
  if (progress) {
    progress({
      task: 'Asking GitHub for the newest fernspielapparat release.',
      progress: 0
    })
  }
}

export function reportDownloadTarball (progress, ratio) {
  if (progress) {
    progress({
      task: 'Downloading fernspielapparat from GitHub.',
      progress: ratio || 0
    })
  }
}

export function reportExtractingTarball (progress) {
  if (progress) {
    progress({
      task: 'Installing fernspielapparat.',
      progress: 0
    })
  }
}

export function reportDownload (progress, doneRatio) {
  if (progress) {
    progress({
      task: `Downloading fernspielapparat from GitHub.`,
      progress: doneRatio
    })
  }
}
