import karin, { render, Bot, segment} from 'node-karin'
import {fetchRSS} from "../lib/rss/rss.js";
import Cfg from '../lib/config/config.js'
import {dirPath, PluginName} from "../index.js";
import {collectHandlers} from "../lib/rss/post_handler.js";
import {formatRssPubDate} from "../utils/common.js";
import {buildRssUrl, DEFAULT_RSS_HUB_BASEURL} from "../lib/rss/presets/index.js";

global.rssLock = false

export const RSS = karin.task("rss", Cfg.Default.rss.cron || "*/5 * * * *", async () => {
    await rss()
}, {
    name: "rss"
})


export const RSS1 = karin.command("#rss",  async () => {
    await rss()
}, {
    name: "rss"
})

async function rss () {
    if (rssLock) {
        return
    }
    global.rssLock = true
    try {
        let rssConfig = Cfg.Default.rss
        if (!rssConfig.rsshub_url) {
            rssConfig.rsshub_url = DEFAULT_RSS_HUB_BASEURL
        }
        let defaultGroups = rssConfig.default_group
        /** @type { import("node-karin").KarinAdapter[] } */
        let bot
        if (rssConfig.sender) {
            bot = rssConfig.sender.map(sender => karin.getBot(sender)).filter(s => s !== undefined)
        } else {
            bot = [karin.list.find(b => {
                // console.log(b.bot.version)
                return b.bot.version?.name !== "input"
            }).bot]
        }
        const handlers = await collectHandlers()
        let ps = rssConfig.subscribe_list.map(async rss => {
            return new Promise(async (resolve, reject) => {
                try {
                    let url = rss.url?.replaceAll('${rsshub_url}', rssConfig.rsshub_url)
                    let postHandlers = rss.postHandlers || []
                    if (rss.preset) {
                        const rssPreset = buildRssUrl(rss.presetConfig, rss.preset, rssConfig.rsshub_url)
                        // console.log(rssPreset)
                        url = rssPreset.url
                        rssPreset.postHandlers && postHandlers.push(...rssPreset.postHandlers)
                    }
                    if (!url) {
                        logger.warn(`rss ${rss.name} url not found`)
                        resolve()
                    }
                    const news = await fetchRSS(rss.name, url, rss.rssParserConfig)
                    for (let res of news) {
                        let newsItem = res.item
                        let raw = res.raw
                        if (postHandlers) {
                            for (let handler of postHandlers) {
                                if (handlers[handler.name]) {
                                    let handlerInstance = handlers[handler.name]
                                    let result = await handlerInstance.handle(newsItem, raw, handler.args)
                                    if (!result.valid) {
                                        // 如果处理器返回无效，则跳过
                                        resolve()
                                    }
                                    newsItem = result.content
                                } else {
                                    logger.warn(`rss handler ${handler.name} not found`)
                                }
                            }
                        }
                        if (!newsItem) {
                            continue
                        }
                        let title = newsItem.title
                        let link = newsItem.link
                        let pubDate = newsItem.pubDate
                        const formattedDate = formatRssPubDate(pubDate)

                        let content = newsItem.content
                        console.log({content})
                        for (let karinAdapter of bot) {
                            let groups = rss.group || defaultGroups
                            for (let group of groups) {
                                let background = rss.background || rssConfig.background || 'https://upload-bbs.miyoushe.com/upload/2024/08/08/11137146/a13030c06cea59159c6cab3d5538731d_6288383820731450582.jpg'
                                if (!background.startsWith('http')) {
                                    background = `${dirPath}/resources/image/${background}`
                                }
                                let img = await render.render({
                                    file: `./plugins/${PluginName}/resources/template/rss.html`,
                                    data: {
                                        title: `【${rss.name}】` + title,
                                        link: link,
                                        pubDate: formattedDate,
                                        pluResPath: `${dirPath}/resources/`,
                                        content: content,
                                        name: rss.name,
                                        background
                                    },
                                    pageGotoParams: {
                                        waitUntil: 'networkidle2'
                                    }
                                })
                                await karinAdapter.SendMessage(karin.contact(group, true), [segment.image(img)])
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
        global.rssLock = false
    }
}
