import { common, plugin, segment } from '#Karin'
import { deleteOtp, generateOTP, getSecretFromURL, listOtps, readOtpByName, readQRCode, saveOtp } from '../utils/otp.js'
import Cfg from '../lib/config/config.js'
import { getIpGeoInfo } from '../utils/ip.js'

export class tools extends plugin {
  constructor () {
    const option = {
      // 必选 插件名称
      name: 'tools',
      // 插件描述
      dsc: '实用工具',
      // 监听消息事件 默认message
      event: 'message',
      // 优先级
      priority: 5000,
      // 以下rule、task、button、handler均为可选，如键入，则必须为数组
      rule: [
        {
          reg: '^#?(增加|添加|删除)(otp|OTP).+$',
          fnc: 'manageOtp',
        },
        {
          reg: '^#?(otp|OTP)列表$',
          fnc: 'listOtp',
        },
        {
          /** 命令正则匹配 */
          reg: '^(#)?t?otp.+$',
          /** 执行方法 */
          fnc: 'otp',
        },
        {
          reg: '^(#)?ip.+$',
          fnc: 'ip',
        },
      ],
    }
    super(option)
  }

  async manageOtp () {
    const msg = this.e.msg
    const isAdd = msg.includes('增加') || msg.includes('添加')
    if (isAdd) {
      const name = msg.replace(/^(#)?(增加|添加)(otp|OTP)/, '').trim()
      this.e.store.set('name', name)
      await this.reply('请输入otp链接（以otpauth://开头）或发送二维码。为确保安全，请私聊使用本功能。', { reply: true })
      this.setContext('addOtp', true)
    } else {
      const name = msg.replace(/^(#)?(删除)(otp|OTP)/, '').trim()
      const otp = readOtpByName(name, this.e.sender.uid)
      if (!otp) {
        await this.reply(`未找到${name}的otp信息`)
        return
      }
      deleteOtp(name, this.e.sender.uid)
      await this.reply('删除成功')
    }
  }

  async addOtp () {
    let url = this.e.msg
    if (!url) {
      // check image
      const image = /** @type {KarinImageElement} **/ this.e.elements.find(v => v.type === 'image')
      const imageUrl = image?.file
      if (!imageUrl) {
        await this.reply('未找到otp链接或二维码。')
        return
      }
      url = await readQRCode(imageUrl)
      if (!url) {
        await this.reply('未识别到二维码，可能是无效的图片')
        return
      }
    }
    // check url
    try {
      const secret = await getSecretFromURL(url)
      const otp = generateOTP(secret)
      logger.debug(`otp got: ${otp}`)
      // save to json
      const name = this.e.store.get('name')
      if (name === '帮助') {
        await this.reply('名称不能为帮助')
        return
      }
      saveOtp({ name, url, uid: this.e.sender.uid })
      await this.reply('添加成功！')
    } catch (err) {
      logger.error(err)
      await this.reply('添加失败！' + err.message)
    } finally {
      this.finish()
    }
  }

  async listOtp () {
    const list = listOtps(this.e.sender.uid)
    if (!list.length) {
      await this.reply('无otp信息')
      return
    }
    const msg = list.map(v => v.name).join('\n')
    await this.reply(msg, { reply: true })
    return true
  }

  async otp () {
    const name = this.e.msg.replace(/^(#)?(otp|OTP)/, '').trim()
    if (name === '帮助') {
      await this.reply('otp工具： \n#添加otp+名称 添加新的otp\n#删除otp+名称 删除otp\n#otp列表 查看已添加的otp\n#otp otp名称 获取otp验证码', { reply: true })
      return
    }
    const otp = readOtpByName(name, this.e.sender.uid)
    if (!otp) {
      await this.reply(`otp ${name} 不存在`)
      return
    }
    const secret = await getSecretFromURL(otp.url)
    const otpCode = generateOTP(secret)
    await this.reply(otpCode, { reply: true })
  }

  async ip () {
    let ipOrDamin = this.e.msg.replace(/^(#)?ip/, '').trim()
    // if domain start with http or https or /, trim them
    if (ipOrDamin.startsWith('http')) {
      const url = new URL(ipOrDamin)
      ipOrDamin = url.hostname
    }
    const sources = Cfg.Default.tools.ip_source
    const infos = await getIpGeoInfo(ipOrDamin, sources)
    const msgs = infos.map(json => {
      if (json.status === 'success') {
        const msg = [
          `查询IP：${json.query}`,
          `位置：${json.city}, ${json.regionName}, ${json.country}`,
          `ISP：${json.isp}`,
          `组织：${json.org}`,
          `AS：${json.as}`,
          `时区：${json.timezone}`,
          `经纬度：${json.lat}, ${json.lon}`,
          '来源：' + json.source,
        ].join('\n')
        return msg
      } else {
        return '查询失败: ' + json.source
      }
    })
    if (msgs.length === 1) {
      this.reply(msgs[0])
    } else {
      const messages = common.makeForward(msgs.map(msg => segment.text(msg)))
      this.replyForward(messages)
    }
  }
}
