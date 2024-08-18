/**
 * @typedef { GithubCommitRSSPreset | GithubReleaseRSSPreset | GithubIssueRSSPreset | GithubPullRSSPreset | TelegramChannelRSSPreset | BilibiliDynamicChannelRSSPreset | WeatherRSSPreset } RSSPreset
 */

/**
 * @typedef { 'github_commit' | 'github_release' | 'github_issue' | 'github_pr' | 'telegram_channel' | 'bilibili_dynamic' | 'earthquake' | 'weather_forecast' } RSSPresetType
 */

export const DEFAULT_RSS_HUB_BASEURL = 'https://rsshub.app'
/**
 *
 * @param {RSSPreset} preset
 * @param {RSSPresetType} type
 * @param {string} rsshubUrl
 * @return {{
 *   url: string,
 *   parseOption: import("rss-parser").ParserOptions,
 *   postHandlers: Array<{
 *     name: string,
 *     args: object
 *   }>,
 * }}
 */
export function buildRssUrl(preset, type, rsshubUrl) {
  let postHandlers = []
  let parseOption = {}
  function getUrl(preset, type) {
    switch (type) {
      case 'github_commit':
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
        return `https://github.com/${preset.org}/${preset.repo}/commits.atom`
      case 'github_release':
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
        return `https://github.com/${preset.org}/${preset.repo}/releases.atom`
      case 'github_issue':
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
        return `${rsshubUrl || DEFAULT_RSS_HUB_BASEURL}/github/issue/${preset.org}/${preset.repo}/${preset.type || 'all'}`
      case 'github_pr':
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
        return `${rsshubUrl || DEFAULT_RSS_HUB_BASEURL}/github/pull/${preset.org}/${preset.repo}/${preset.type || 'all'}`
      case 'telegram_channel':
        return `${rsshubUrl || DEFAULT_RSS_HUB_BASEURL}/telegram/channel/${preset.channel}`
      case 'bilibili_dynamic':
        return `${rsshubUrl || DEFAULT_RSS_HUB_BASEURL}/bilibili/user/dynamic/${preset.spaceId}`
      case 'earthquake':
        return `${rsshubUrl || DEFAULT_RSS_HUB_BASEURL}/earthquake/ceic/1`
      case 'weather_forecast':
        return `${rsshubUrl || DEFAULT_RSS_HUB_BASEURL}/cma/channel/380`
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