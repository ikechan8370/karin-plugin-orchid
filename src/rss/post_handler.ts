import fs from 'fs'
import { dirPath } from '@/utils/dir'
import path from 'path'
import { pathToFileURL } from 'url'
import { logger } from 'node-karin'

// 怪怪的
export class PostHandler {
  name!: string
  type!: string

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
  async handle (data: import('rss-parser').Item, raw: any, args: any): Promise<{
    valid?: boolean
    content?: import('rss-parser').Item
  }> {
    throw new Error('Method not implemented')
  }
}

export async function collectHandlers () {
  const handlersDirPath = path.join(dirPath, 'lib', 'rss', 'handlers')
  const handlersDir = pathToFileURL(handlersDirPath)
  const files = fs.readdirSync(handlersDir)
  const map: Record<string, PostHandler> = {}
  for (const file of files) {
    const fullPath = path.join(handlersDirPath, file)
    const fullPathUrl = pathToFileURL(fullPath)
    // console.log(fullPathUrl)
    if (fs.statSync(fullPathUrl).isFile() && file.endsWith('.js')) {
      // console.log(1)
      const module = await import(fullPathUrl.toString())
      for (const key in module) {
        if (module[key] instanceof PostHandler) {
          logger.debug('key***************************:', module[key].name)
          map[module[key].name] = module[key]
        }
      }
    }
  }

  return map
}
