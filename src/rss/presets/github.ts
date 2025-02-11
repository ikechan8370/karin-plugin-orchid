export interface GithubCommitRSSPreset {
  org: string
  repo: string
}

export interface GithubReleaseRSSPreset {
  org: string
  repo: string
}

export interface GithubIssueRSSPreset {
  org: string
  repo: string
  type: 'open' | 'close' | 'all'
}

export interface GithubPullRSSPreset {
  org: string
  repo: string
  type: 'open' | 'close' | 'all'
}
