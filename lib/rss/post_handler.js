import fs from "fs";
import {dirPath} from "../../index.js";
import path from "path";
import { pathToFileURL } from 'url';

export class PostHandler {
  /**
   * @type {String}
   */
  name

  /**
   * @type {String}
   */
  type

  /**
   *
   * @param { import("rss-parser").Item } data
   * @param {object} raw json格式的数据
   * @param {object} args
   * @return {Promise<{
   *   valid?: boolean,
   *   content?: import("rss-parser").Item
   * }>} valid标识是否有效，content为处理后的数据。valid如果为false则不会被推送
   */
  async handle (data, raw, args) {
    throw new Error('Method not implemented')
  }
}

/**
 *
 * @return {Promise<Map<String, PostHandler>>}
 */
export async function collectHandlers () {
  let handlersDirPath = path.join(dirPath, 'lib', 'rss', 'handlers')
  let handlersDir = pathToFileURL(handlersDirPath)
  const files = fs.readdirSync(handlersDir)
  let map = {}
  for (const file of files) {
    const fullPath = path.join(handlersDirPath, file);
    const fullPathUrl = pathToFileURL(fullPath)
    // console.log(fullPathUrl)
    if (fs.statSync(fullPathUrl).isFile() && file.endsWith('.js')) {
      // console.log(1)
      const module = await import(fullPathUrl);
      for (const key in module) {
        if (module[key] instanceof PostHandler) {
          logger.debug('key***************************:', module[key].name)
          map[module[key].name] = module[key]
        }
      }
    }
  }

  return map;
}