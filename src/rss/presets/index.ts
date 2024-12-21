import type { WeatherRSSPreset } from './forecast'
import type { TelegramChannelRSSPreset } from './telegram'
import type { BilibiliDynamicChannelRSSPreset } from './bilibili'
import type { GithubCommitRSSPreset, GithubIssueRSSPreset, GithubPullRSSPreset, GithubReleaseRSSPreset } from './github'

/**
 * @typedef { 'github_commit' | 'github_release' | 'github_issue' | 'github_pr' | 'telegram_channel' | 'bilibili_dynamic' | 'earthquake' | 'weather_forecast' } RSSPresetType
 */

export type RSSPreset = GithubCommitRSSPreset
  | GithubReleaseRSSPreset
  | GithubIssueRSSPreset
  | GithubPullRSSPreset
  | TelegramChannelRSSPreset
  | BilibiliDynamicChannelRSSPreset
  | WeatherRSSPreset

export type RSSPresetType = 'github_commit'
  | 'github_release'
  | 'github_issue'
  | 'github_pr'
  | 'telegram_channel'
  | 'bilibili_dynamic'
  | 'earthquake'
  | 'weather_forecast'

export const DEFAULT_RSS_HUB_BASEURL = 'https://rsshub.app'

export function buildRssUrl (preset: RSSPreset, type: RSSPresetType, rsshubUrl: string): {
  url: string,
  parseOption: import('rss-parser').ParserOptions<any, any>,
  postHandlers: Array<{
    name: string,
    args: object
  }>
} {
  const postHandlers: {
    name: string
    args: { type: string } | { type: string } | { type: string } | { type: string }
  }[] = []

  let parseOption = {}
  function getUrl (preset: RSSPreset, type: RSSPresetType) {
    switch (type) {
      case 'github_commit': {
        postHandlers.push({
          name: 'github',
          args: {
            type: 'commit'
          }
        })
        parseOption = {
          customFields: {
            item: ['author']
          }
        }
        const data = preset as GithubCommitRSSPreset
        return `https://github.com/${data.org}/${data.repo}/commits.atom`
      }
      case 'github_release': {
        postHandlers.push({
          name: 'github',
          args: {
            type: 'release'
          }
        })
        parseOption = {
          customFields: {
            item: ['author']
          }
        }
        const data = preset as GithubReleaseRSSPreset
        return `https://github.com/${data.org}/${data.repo}/releases.atom`
      }
      case 'github_issue': {
        postHandlers.push({
          name: 'github',
          args: {
            type: 'issue'
          }
        })
        parseOption = {
          customFields: {
            item: ['author']
          }
        }
        const data = preset as GithubIssueRSSPreset
        return `${rsshubUrl}/github/issue/${data.org}/${data.repo}/${data.type || 'all'}`
      }
      case 'github_pr': {
        postHandlers.push({
          name: 'github',
          args: {
            type: 'pull'
          }
        })
        parseOption = {
          customFields: {
            item: ['author']
          }
        }

        const data = preset as GithubPullRSSPreset
        return `${rsshubUrl}/github/pull/${data.org}/${data.repo}/${data.type || 'all'}`
      }
      case 'telegram_channel': {
        const data = preset as TelegramChannelRSSPreset
        return `${rsshubUrl}/telegram/channel/${data.channel}`
      }
      case 'bilibili_dynamic': {
        const data = preset as BilibiliDynamicChannelRSSPreset
        return `${rsshubUrl}/bilibili/user/dynamic/${data.spaceId}`
      }
      case 'earthquake':
        return `${rsshubUrl}/earthquake/ceic/1`
      case 'weather_forecast':
        return `${rsshubUrl}/cma/channel/380`
      default:
        return ''
    }
  }

  const url = getUrl(preset, type)
  return {
    url,
    postHandlers,
    parseOption
  }
}
