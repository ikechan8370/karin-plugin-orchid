import karin, {Bot, segment} from 'node-karin'
import {fetchRSS} from "../lib/rss/rss.js";

export const RSS = karin.task("rss", "0 0 8 * * *", async () => {
    for (let name of ["sr", "ww", "wea"]) {
        const news = await fetchRSS(name)
        for (let newsItem of news) {
            let title = newsItem.title
            let link = newsItem.link
            let pubDate = newsItem.pubDate
            let content = newsItem.content
            let message = `新闻标题: ${title}\n发布日期: ${pubDate}\n内容: ${content}\n链接: ${link}`
            let bot = Bot.list.find(b => {
                console.log(b.bot.version)
                return b.bot.version?.name !== "input"
            }).bot
            await bot.SendMessage(karin.contact("", true), [segment.text(message)])
        }
    }
}, {
    name: "rss"
})
