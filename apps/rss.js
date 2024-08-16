import karin, { render, Bot, segment} from 'node-karin'
import {fetchRSS} from "../lib/rss/rss.js";
import Cfg from '../lib/config/config.js'
import path from "path";
import {dirPath, PluginName} from "../index.js";
global.rssLock = false
export const RSS = karin.task("rss", Cfg.Default.rss.cron || "*/5 * * * *", async () => {
    if (global.rssLock) {
        return
    }
    global.rssLock = true
    let rssConfig = Cfg.Default.rss
    let defaultGroups = rssConfig.default_group
    /** @type { import("node-karin").KarinAdapter[] } */
    let bot
    if (rssConfig.sender) {
        bot = rssConfig.sender.map(sender => Bot.getBot(sender)).filter(s => s !== undefined)
    } else {
        bot = [Bot.list.find(b => {
            console.log(b.bot.version)
            return b.bot.version?.name !== "input"
        }).bot]
    }
    let ps = rssConfig.subscribe_list.map(async rss => {
        return new Promise(async (resolve, reject) => {
            try {
                const news = await fetchRSS(rss.name, rss.url)
                for (let newsItem of news) {
                    let title = newsItem.title
                    let link = newsItem.link
                    let pubDate = newsItem.pubDate
                    const dateObj = new Date(pubDate);
                    const formattedDate = dateObj.toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false // 24小时制
                    });

                    let content = newsItem.content
                    for (let karinAdapter of bot) {
                        let groups = rss.group || defaultGroups
                        for (let group of groups) {
                            let img = await render.render({
                                file: `./plugins/${PluginName}/resources/template/rss.html`,
                                data: {
                                    title: title,
                                    link: link,
                                    pubDate: formattedDate,
                                    pluResPath: `${dirPath}/resources/`,
                                    content: content
                                },

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
    global.rssLock = false
}, {
    name: "rss"
})

//
// export const RSS1 = karin.command("#rss",  async () => {
//     let rssConfig = Cfg.Default.rss
//     let defaultGroups = rssConfig.default_group
//     /** @type { import("node-karin").KarinAdapter[] } */
//     let bot
//     if (rssConfig.sender) {
//         bot = rssConfig.sender.map(sender => Bot.getBot(sender)).filter(s => s !== undefined)
//     } else {
//         bot = [Bot.list.find(b => {
//             console.log(b.bot.version)
//             return b.bot.version?.name !== "input"
//         }).bot]
//     }
//     let resourcePath = `${dirPath}/resources/`
//     logger.info({resourcePath})
//     let ps = rssConfig.subscribe_list.map(async rss => {
//         return new Promise(async (resolve, reject) => {
//             try {
//                 const news = await fetchRSS(rss.name, rss.url)
//                 for (let newsItem of news) {
//                     let title = newsItem.title
//                     let link = newsItem.link
//                     let pubDate = newsItem.pubDate
//                     const dateObj = new Date(pubDate);
//                     const formattedDate = dateObj.toLocaleString('zh-CN', {
//                         year: 'numeric',
//                         month: 'long',
//                         day: 'numeric',
//                         hour: '2-digit',
//                         minute: '2-digit',
//                         hour12: false // 24小时制
//                     });
//                     let content = newsItem.content
//                     for (let karinAdapter of bot) {
//                         let groups = rss.group || defaultGroups
//                         for (let group of groups) {
//                             let img = await render.render({
//                                 file: `./plugins/karin-plugin-orchid/resources/template/rss.html`,
//                                 data: {
//                                     title: title,
//                                     link: link,
//                                     pubDate: formattedDate,
//                                     content: content,
//                                     pluResPath: `${dirPath}/resources/`,
//                                     name: rss.name
//                                 },
//
//                             })
//                             await karinAdapter.SendMessage(karin.contact(group, true), [segment.image(img)])
//                         }
//                     }
//                 }
//                 resolve()
//             } catch (e) {
//                 logger.error(e)
//                 resolve()
//             }
//         })
//     })
//     await Promise.all(ps)
// }, {
//     name: "rss"
// })