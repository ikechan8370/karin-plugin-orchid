import { render, karin, segment, logger, AdapterType } from 'node-karin'
import { fetchRSS } from '@/rss/rss'
import { config } from '@/utils/config'
import { dirPath, } from '@/utils/dir'
import { collectHandlers } from '@/rss/post_handler'
import { formatRssPubDate } from '../utils/common'
import { buildRssUrl, DEFAULT_RSS_HUB_BASEURL, RSSPresetType } from '@/rss/presets/index'

let rssLock = false

export const RSS = karin.task('rss', config().rss.cron || '*/5 * * * *', rss)

export const RSS1 = karin.command('#rss', async () => {
  await rss()
  return true
}, {
  name: 'rss'
})

async function rss () {
  if (rssLock) {
    return
  }
  rssLock = true
  try {
    const rssConfig = config().rss
    if (!rssConfig.subscribe_list) {
      return
    }
    if (!rssConfig.rsshub_url) {
      rssConfig.rsshub_url = DEFAULT_RSS_HUB_BASEURL
    }
    const defaultGroups = rssConfig.default_group
    const bot: AdapterType[] = []
    if (rssConfig.sender) {
      const allBots = karin.getBotAll(false)
      for (const b of allBots) {
        if (rssConfig.sender.includes(b.account.selfId)) {
          bot.push(b)
        }
      }
    } else {
      const list = karin.getBotAll(false)
      for (const b of list) {
        if (b.account.selfId !== 'console') bot.push(b)
      }
    }

    const handlers = await collectHandlers()

    const ps = rssConfig.subscribe_list.map(async rss => {
      // eslint-disable-next-line no-async-promise-executor
      return new Promise<void>(async (resolve, reject) => {
        try {
          // eslint-disable-next-line no-template-curly-in-string
          let url = rss.url?.replaceAll('${rsshub_url}', rssConfig.rsshub_url!)
          const postHandlers = rss.postHandlers || []
          if (rss.preset) {
            const rssPreset = buildRssUrl(rss.presetConfig, rss.preset as RSSPresetType, rssConfig.rsshub_url!)
            // console.log(rssPreset)
            url = rssPreset.url
            rssPreset.postHandlers && postHandlers.push(...rssPreset.postHandlers)
          }
          if (!url) {
            logger.warn(`rss ${rss.name} url not found`)
            resolve()
          }
          const news = await fetchRSS(rss.name, url, rss.rssParserConfig)
          for (const res of news) {
            let newsItem = res.item
            const raw = res.raw
            if (postHandlers) {
              for (const handler of postHandlers) {
                if (handlers[handler.name]) {
                  const handlerInstance = handlers[handler.name]
                  const result = await handlerInstance.handle(newsItem, raw, handler.args)
                  if (!result.valid) {
                    // 如果处理器返回无效，则跳过
                    resolve()
                  }
                  newsItem = result.content!
                } else {
                  logger.warn(`rss handler ${handler.name} not found`)
                }
              }
            }
            if (!newsItem) {
              continue
            }
            const title = newsItem.title
            const link = newsItem.link
            const pubDate = newsItem.pubDate!
            const formattedDate = formatRssPubDate(pubDate)

            const content = newsItem.content
            console.log({ content })
            for (const karinAdapter of bot) {
              const groups = rss.group || defaultGroups
              for (const group of groups) {
                const defbackground = 'https://upload-bbs.miyoushe.com/upload/2024/08/08/11137146/a13030c06cea59159c6cab3d5538731d_6288383820731450582.jpg'
                let background = rss.background || rssConfig.background || defbackground
                if (!background.startsWith('http')) {
                  background = `${dirPath}/resources/image/${background}`
                }
                const img = await render.render({
                  name: 'rss',
                  file: `${dirPath}/resources/template/rss.html`,
                  data: {
                    title: `【${rss.name}】` + title,
                    link,
                    pubDate: formattedDate,
                    pluResPath: `${dirPath}/resources/`,
                    content,
                    name: rss.name,
                    background
                  },
                  pageGotoParams: {
                    waitUntil: 'networkidle2'
                  }
                })

                await karinAdapter.sendMsg(karin.contact('group', group), [segment.image(`base64://${img}`)])
              }
            }
          }
          resolve()
        } catch (e) {
          logger.error(e)
          resolve()
        }
      })
    })
    await Promise.all(ps)
  } catch (err) {
    logger.error(err)
  } finally {
    rssLock = false
  }
}
