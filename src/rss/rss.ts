import fs from 'fs'
import Parser from 'rss-parser'
import { config, DATA_DIR } from '@/utils/config'
import { HttpsProxyAgent } from 'https-proxy-agent'
import xml2js from 'xml2js'
import fetch from 'node-fetch'
import { logger } from 'node-karin'
import path from 'path'

const dataFilePath = path.join(DATA_DIR, '/rss.json')

/**
 *
 * @param subscribeName
 */
const loadStoredData = (subscribeName: string): { lastFetchedItem: { id?: string, pubDate?: string }, allItems?: { id: string }[] } => {
  if (fs.existsSync(dataFilePath)) {
    const rawData = fs.readFileSync(dataFilePath)
    const json = JSON.parse(String(rawData))
    return json[subscribeName] || {}
  } else {
    return { lastFetchedItem: { id: undefined, pubDate: undefined }, allItems: [] }
  }
}

const saveStoredData = (data: any, subscribeName: string) => {
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, '{}')
  }
  const rawData = fs.readFileSync(dataFilePath)
  const json = JSON.parse(String(rawData))
  json[subscribeName] = data
  fs.writeFileSync(dataFilePath, JSON.stringify(json, null, 2))
}

/**
 *
 * @param subscribeName
 * @param url
 * @param options
 */
export const fetchRSS = async (
  subscribeName: string,
  url: string,
  options?: import('rss-parser').ParserOptions<any, any>
): Promise<{
  item: import('rss-parser').Item,
  /** 是xml */
  raw: string
}[]> => {
  try {
    const storedData = loadStoredData(subscribeName)
    const parser = options ? new Parser(options) : new Parser()
    let fetchOption = {}
    if (config().proxy) {
      fetchOption = {
        agent: new HttpsProxyAgent(config().proxy)
      }
      logger.debug(`${url}: Using proxy: ${config().proxy}`)
    }

    const res = await fetch(url, fetchOption)
    const xml = await res.text()
    const feed = await parser.parseString(xml)
    const xmlParser = new xml2js.Parser()
    const raw = await new Promise((resolve, reject) => {
      xmlParser.parseString(xml, (err, result) => {
        if (err) reject(err)
        resolve(result)
      })
    }).catch(() => { }) as any

    const results = []
    const rawItems: any[] = []
    if (raw.feed) {
      raw.feed.entry.forEach((entry: any) => {
        rawItems.push(entry)
      })
    } else if (raw.rss) {
      raw.rss.channel[0]?.item && raw.rss.channel[0].item.forEach((entry: any) => {
        rawItems.push(entry)
      })
    }
    // const oneDayAgo = new Date();
    // oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    let latestItem; let allItems = storedData.allItems
    for (const item of feed.items.sort((a: {
      pubDate: string
    }, b: {
      pubDate: string
    }
    ) => new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime())) {
      if (!item.pubDate) {
        // 比如github star没有时间
        // 只能靠link来全存然后筛选了罢！
        if (storedData.allItems && storedData.allItems.find(i => i.id === item.guid || i.id === item.id || i.id === item.link)) {
          logger.debug('No pubDate, but found in stored data, skip')
          continue
        }
      }
      if (!storedData?.lastFetchedItem?.pubDate || // 第一次加入的监控项
        new Date(item.pubDate) > new Date(storedData.lastFetchedItem.pubDate)
        // && itemDate >= oneDayAgo
      ) {
        logger.info('New item found:')
        logger.info(`Title: ${item.title}`)
        logger.info(`Link: ${item.link}`)
        logger.info(`Publication Date: ${item.pubDate}`)
        logger.debug(`Content: ${item.content}`)
        if (storedData?.lastFetchedItem) {
          // 只有有记录的才push，保证第一次不会腹泻式推送
          results.push({
            item,
            raw: rawItems.find(rawItem => {
              if (!rawItem.guid) return false
              return rawItem.guid[0]['_'] === item.guid
            }) || rawItems.find(rawItem => {
              if (!rawItem.id) return false
              return rawItem?.id[0] === item.id
            }) || {}
          })
        }
        // 更新存储的最新 item 信息
        latestItem = {
          id: item.guid || item.id || item.link,
          pubDate: item.pubDate,
        }
        // 对于没有时间的rss，比如github star，存入全部id项以便后续筛选
        if (!item.pubDate) {
          if (!allItems) {
            allItems = []
          }
          allItems.push({
            id: latestItem.id
          })
        }
      }
    }
    if (latestItem) {
      storedData.lastFetchedItem = latestItem
      allItems && (storedData.allItems = allItems)
      saveStoredData(storedData, subscribeName)
    }
    return results
  } catch (error) {
    logger.error(`Error fetching RSS [${url}] feed:`, error)
  }
  return []
}
