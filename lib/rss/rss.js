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
        return { lastFetchedItem: { id: undefined, pubDate: undefined }, url: '' };
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
 * @returns {Promise<Item[]>}
 */
export const fetchRSS = async (subscribeName) => {
    try {
        const storedData = loadStoredData(subscribeName);
        const url = storedData.url;
        console.log(JSON.stringify(storedData))
        const feed = await parser.parseURL(url);

        const results = []

        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 3);

        for (let item of feed.items) {
            const itemDate = new Date(item.pubDate);
            if (!storedData?.lastFetchedItem?.pubDate || new Date(item.pubDate) > new Date(storedData.lastFetchedItem.pubDate) && itemDate >= oneDayAgo) {
                console.log('New item found:');
                console.log(`Title: ${item.title}`);
                console.log(`Link: ${item.link}`);
                console.log(`Publication Date: ${item.pubDate}`);
                console.log('---');

                results.push(item)
                // 更新存储的最新 item 信息
                storedData.lastFetchedItem = {
                    id: item.guid,
                    pubDate: item.pubDate,
                };

                saveStoredData(storedData, subscribeName);
                return results
            }
        }

    } catch (error) {
        console.error('Error fetching RSS feed:', error);
    }
    return []
};

