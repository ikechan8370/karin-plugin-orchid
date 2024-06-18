import { plugin, redis, segment } from '#Karin'
import Cfg from '../lib/config/config.js'
import moment from 'moment'

export class luck extends plugin {
  constructor () {
    const option = {
      // 必选 插件名称
      name: 'luck',
      // 插件描述
      dsc: '今日运气',
      // 监听消息事件 默认message
      event: 'message',
      // 优先级
      priority: 5000,
      // 以下rule、task、button、handler均为可选，如键入，则必须为数组
      rule: [
        {
          /** 命令正则匹配 */
          reg: '^(#)?(今日)?运气(pro|promax|promaxultra)?$',
          /** 执行方法 */
          fnc: 'luck',
        },
      ],
    }
    super(option)
  }

  async luck () {
    const e = this.e
    const userId = e.sender.uid || e.sender.uin
    const pro = e.msg.replace('今日运气', '').includes('pro')
    const promax = e.msg.replace('今日运气', '').includes('promax')
    const promaxultra = e.msg.replace('今日运气', '').includes('promaxultra')
    let num = Math.random()
    num = Math.ceil(num * (promaxultra ? 543232 : promax ? 12345 : pro ? 1232 : 121))
    const data_redis = await redis.get(`orchid-plugin:${userId}_jryq`)
    let new_sum = 1
    if (data_redis) {
      if (JSON.parse(data_redis)[0].num === Cfg.Default.luck.maxNum) {
        if (!this.e.isMaster || !Cfg.Default.luck.masterInfinite) {
          await this.reply('今日次数已用完~', { reply: true })
          return
        }
      }
      new_sum += JSON.parse(data_redis)[0].num
    }

    logger.debug({ num })
    if (num >= 0 && num < 60) {
      const msg = [
        segment.at(e.user_id),
        '\n' + Cfg.Default.luck.lowTemplate.replace('$luck', num + ''),
      ]
      await this.reply(msg)
      await this.reply(segment.image('http://hanhan.avocado.wiki/?fox'))
    } else if (num > 60 && num < 90) {
      const msg = [
        segment.at(e.user_id),
        '\n' + Cfg.Default.luck.middleTemplate.replace('$luck', num + ''),
      ]
      await this.reply(msg)
      await this.reply(segment.image('http://hanhan.avocado.wiki/?xiaodouni'))
    } else if (num === 120) {
      const msg = [
        segment.at(e.user_id),
        '\n' + Cfg.Default.luck.maxTemplate.replace('$luck', num + ''),
      ]
      await this.reply(msg)
      await this.reply(segment.image('http://hanhan.avocado.wiki/?kabo'))
    } else if (num === 121 || num === 12100) {
      const msg = [
        segment.at(e.user_id),
        '\n' + Cfg.Default.luck.infiniteTemplate.replace('$luck', num + ''),
      ]
      await this.reply(msg)
      await this.reply(segment.image('http://hanhan.avocado.wiki/?kuluomi'))
    } else if (num > 90) {
      const msg = [
        segment.at(e.user_id),
        '\n' + Cfg.Default.luck.highTemplate.replace('$luck', num + ''),
      ]
      await this.reply(msg)
      await this.reply(segment.image('http://chaijun.avocado.wiki'))
    }

    const time = moment(Date.now()).add(1, 'day').format('YYYY-MM-DD 00:00:00')
    const new_date = (new Date(time).getTime() - new Date().getTime()) / 1000
    logger.debug(new_date)

    const redis_data = [{
      num: new_sum,
      value: num,
    }]
    redis.set(`orchid-plugin:${userId}_luck`, JSON.stringify(redis_data), {
      EX: parseInt(new_date),
    })

    return true
  }
}
