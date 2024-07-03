import { Plugin, segment, common } from 'node-karin'
import Cfg from '../lib/config/config.js'
import axios from 'axios'

export class cat extends Plugin {
  constructor () {
    const option = {
      // 必选 插件名称
      name: '吸猫',
      // 插件描述
      dsc: '吸猫撸狗',
      // 监听消息事件 默认message
      event: 'message',
      // 优先级
      priority: 5000,
      // 以下rule、task、button、handler均为可选，如键入，则必须为数组
      rule: [
        {
          /** 命令正则匹配 */
          reg: '^(#)?(吸|撸)(猫|狗)',
          /** 执行方法 */
          fnc: 'cat',
        },
      ],
    }
    super(option)
  }

  async cat () {
    const msg = this.e.msg
    const isCat = msg.includes('猫')
    let num = msg.replace(/^(#)?(吸|撸)(猫|狗)/, '')
    if (!num) {
      num = 1
    } else {
      num = parseInt(num)
    }
    if (num > 10) {
      await this.reply('一次最多只能吸3只哦~', { reply: true })
      num = 10
    }
    const urls = await this.getAnimal(isCat, num)
    if (num < 4) {
      for (let i = 0; i < urls.length; i++) {
        this.reply(segment.image(urls[i]))
      }
    } else {
      const msg = common.makeForward(urls.map(url => segment.image(url)))
      await this.replyForward(msg)
    }
  }

  /**
   * 获取图片url
   * @param {boolean} isCat
   * @param {number} limit
   * @return {Promise<string[]>}
   */
  async getAnimal (isCat, limit = 1) {
    const url = (isCat ? 'https://api.thecatapi.com/v1/images/search' : 'https://api.thedogapi.com/v1/images/search') + `?limit=${limit}`
    let proxy = Cfg.Default.proxy
    // get protocol host port from proxy
    if (proxy) {
      const proxyUrl = new URL(proxy)
      proxy = {
        protocol: proxyUrl.protocol,
        host: proxyUrl.hostname,
        port: proxyUrl.port,
      }
    }

    const res = await axios.get(url, {
      proxy,
    })
    const data = res.data
    return Promise.all(data.slice(0, limit).map(async item => {
      let resUrl = item.url
      logger.info({ resUrl })
      if (proxy) {
        // download picture to get base64
        const picRes = await axios.get(resUrl, {
          proxy,
          responseType: 'arraybuffer',
        })
        resUrl = `base64://${Buffer.from(picRes.data).toString('base64')}`
      }
      return resUrl
    }))
  }
}
