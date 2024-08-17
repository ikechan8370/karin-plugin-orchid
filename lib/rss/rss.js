import fs from 'fs';
import Parser from 'rss-parser';
import Cfg from "../config/config.js";
import { HttpsProxyAgent } from 'https-proxy-agent';
import xml2js from "xml2js";

const dataFilePath = 'data/karin-plugin-orchid/rss.json';

/**
 *
 * @param subscribeName
 * @returns {{lastFetchedItem: {id: string, pubDate: string}}}
 */
const loadStoredData = (subscribeName) => {
    if (fs.existsSync(dataFilePath)) {
        const rawData = fs.readFileSync(dataFilePath);
        let json = JSON.parse(String(rawData))
        return json[subscribeName] || {};
    } else {
        return { lastFetchedItem: { id: undefined, pubDate: undefined } };
    }
};

const saveStoredData = (data, subscribeName) => {
    if (!fs.existsSync(dataFilePath)) {
        fs.writeFileSync(dataFilePath, '{}');
    }
    const rawData = fs.readFileSync(dataFilePath);
    let json = JSON.parse(String(rawData))
    json[subscribeName] = data
    fs.writeFileSync(dataFilePath, JSON.stringify(json, null, 2));
};

/**
 *
 * @param subscribeName
 * @param url
 * @param {import("rss-parser").ParserOptions?} options
 * @returns {Promise<{item: Item, raw: string}[]>} raw是xml
 */
export const fetchRSS = async (subscribeName, url, options = undefined) => {
    try {
        const storedData = loadStoredData(subscribeName);
        const parser = options ? new Parser(options) : new Parser();
        let fetchOption  = {}
        if (Cfg.Default.proxy) {
            fetchOption = {
                agent: new HttpsProxyAgent(Cfg.Default.proxy)
            }
        }
        const res = await fetch(url, fetchOption)
        const xml = await res.text()
        const feed = await parser.parseString(xml);
        let xmlParser = new xml2js.Parser()
        let raw = await new Promise((resolve, reject) => {
            xmlParser.parseString(xml, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        }).catch(() => {})
        const results = []
        let rawItems = []
        if (raw.feed) {
            raw.feed.entry.forEach(entry => {
                rawItems.push(entry)
            })
        } else if (raw.rss) {
            raw.rss.channel[0].item.forEach(entry => {
                rawItems.push(entry)
            })
        }
        // const oneDayAgo = new Date();
        // oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        let latestItem
        for (let item of feed.items.sort((a, b) => new Date(a.pubDate) - new Date(b.pubDate))) {
            // const itemDate = new Date(item.pubDate);
            // console.log(item.pubDate)
            if (!storedData?.lastFetchedItem?.pubDate || new Date(item.pubDate) > new Date(storedData.lastFetchedItem.pubDate)
                // && itemDate >= oneDayAgo
            ) {
                logger.info('New item found:');
                logger.info(`Title: ${item.title}`);
                logger.info(`Link: ${item.link}`);
                logger.info(`Publication Date: ${item.pubDate}`);
                logger.debug(`Content: ${item.content}`);
                if (storedData?.lastFetchedItem) {
                    // 只有有记录的才push，保证第一次不会腹泻式推送
                    results.push({
                        item,
                        raw: rawItems.find(rawItem => {
                            if (!rawItem.guid) return false
                            return rawItem.guid[0]["_"] === item.guid
                        }) || rawItems.find(rawItem => rawItem?.id[0] === item.id)
                    })
                }
                // 更新存储的最新 item 信息
                latestItem = {
                    id: item.guid,
                    pubDate: item.pubDate,
                };

            }
        }
        if (latestItem) {
            storedData.lastFetchedItem = latestItem
            saveStoredData(storedData, subscribeName);
        }
        return results

    } catch (error) {
        logger.error('Error fetching RSS feed:', error);
    }
    return []
};

