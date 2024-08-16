import fs from 'fs';
import Parser from 'rss-parser';

const parser = new Parser();
const dataFilePath = 'data/karin-plugin-orchid/rss.json';

/**
 *
 * @param subscribeName
 * @returns {{lastFetchedItem: {id: string, pubDate: string}, url: string}}
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
    const rawData = fs.readFileSync(dataFilePath);
    let json = JSON.parse(String(rawData))
    json[subscribeName] = data
    fs.writeFileSync(dataFilePath, JSON.stringify(json, null, 2));
};

/**
 *
 * @param subscribeName
 * @param url
 * @returns {Promise<Item[]>}
 */
export const fetchRSS = async (subscribeName, url) => {
    try {
        const storedData = loadStoredData(subscribeName);
        const feed = await parser.parseURL(url);

        const results = []

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
                    results.push(item)
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

