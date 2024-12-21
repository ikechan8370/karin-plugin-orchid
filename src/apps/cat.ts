import { config } from '@/utils/config'
import { karin, segment, common, logger } from 'node-karin'
import axios, { AxiosProxyConfig } from 'node-karin/axios'

export const cat = karin.command(/^(#)?(吸|撸)(猫|狗)/, async (e) => {
  const msg = e.msg.replace(/^(#)?(吸|撸)(猫|狗)/, '')
  const isCat = msg.includes('猫')
  let num = !msg ? 1 : parseInt(msg)
  if (num > 10) {
    await e.reply('一次最多只能吸3只哦~', { reply: true })
    num = 10
  }
  const urls = await getAnimal(isCat, num)
  if (num < 4) {
    for (let i = 0; i < urls.length; i++) {
      e.reply(segment.image(urls[i]))
    }
  } else {
    const message = common.makeForward(urls.map(url => segment.image(url)))
    await e.bot.sendForwardMsg(e.contact, message)
  }
  return true
}, { name: '吸猫' })

/**
 * 获取图片url
 * @param isCat 是否是猫
 * @param limit 数量
 */
const getAnimal = async (isCat: boolean, limit = 1) => {
  const url = (isCat ? 'https://api.thecatapi.com/v1/images/search' : 'https://api.thedogapi.com/v1/images/search') + `?limit=${limit}`

  let proxy: AxiosProxyConfig | undefined
  const proxyApi = config().proxy
  if (proxyApi) {
    const proxyUrl = new URL(proxyApi)
    proxy = {
      protocol: proxyUrl.protocol,
      host: proxyUrl.hostname,
      port: Number(proxyUrl.port),
    }
  }

  const result = await axios.get(url, { proxy, })
  const data = result.data
  return Promise.all(data.slice(0, limit).map(async (item: { url: string }) => {
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
