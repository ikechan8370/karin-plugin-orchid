import { karin, logger, redis, segment } from 'node-karin'
import { config } from '@/utils/config'
import moment from 'node-karin/moment'

/** 今日运气插件 */
export const luck = karin.command(/^(#)?(今日)?运气(pro|promax|promaxultra)?$/, async (e) => {
  const userId = e.sender.uid || e.sender.uin
  const pro = e.msg.replace('今日运气', '').includes('pro')
  const promax = e.msg.replace('今日运气', '').includes('promax')
  const promaxultra = e.msg.replace('今日运气', '').includes('promaxultra')

  let num = Math.random()
  num = Math.ceil(num * (promaxultra ? 543232 : promax ? 12345 : pro ? 1232 : 121))
  const dataRedis = await redis.get(`orchid-plugin:${userId}_jryq`)
  let newSum = 1

  if (dataRedis) {
    if (JSON.parse(dataRedis)[0].num === config().luck.maxNum) {
      if (!e.isMaster || !config().luck.masterInfinite) {
        await e.reply('今日次数已用完~', { reply: true })
        return true
      }
    }
    newSum += JSON.parse(dataRedis)[0].num
  }

  logger.debug({ num })
  if (num >= 0 && num < 60) {
    const msg = [
      segment.at(e.user_id),
      '\n' + config().luck.lowTemplate.replace('$luck', num + ''),
    ]
    await e.reply(msg)
    await e.reply(segment.image('http://hanhan.avocado.wiki/?fox'))
  } else if (num > 60 && num < 90) {
    const msg = [
      segment.at(e.user_id),
      '\n' + config().luck.middleTemplate.replace('$luck', num + ''),
    ]
    await e.reply(msg)
    await e.reply(segment.image('http://hanhan.avocado.wiki/?xiaodouni'))
  } else if (num === 120) {
    const msg = [
      segment.at(e.user_id),
      '\n' + config().luck.maxTemplate.replace('$luck', num + ''),
    ]
    await e.reply(msg)
    await e.reply(segment.image('http://hanhan.avocado.wiki/?kabo'))
  } else if (num === 121 || num === 12100) {
    const msg = [
      segment.at(e.user_id),
      '\n' + config().luck.infiniteTemplate.replace('$luck', num + ''),
    ]
    await e.reply(msg)
    await e.reply(segment.image('http://hanhan.avocado.wiki/?kuluomi'))
  } else if (num > 90) {
    const msg = [
      segment.at(e.user_id),
      '\n' + config().luck.highTemplate.replace('$luck', num + ''),
    ]
    await e.reply(msg)
    await e.reply(segment.image('http://chaijun.avocado.wiki'))
  }

  const time = moment(Date.now()).add(1, 'day').format('YYYY-MM-DD 00:00:00')
  const newDate = (new Date(time).getTime() - new Date().getTime()) / 1000
  logger.debug(newDate)

  const redisData = [{
    num: newSum,
    value: num,
  }]
  redis.set(`orchid-plugin:${userId}_luck`, JSON.stringify(redisData), {
    EX: Number(newDate),
  })

  return true
}, { name: 'luck' })
