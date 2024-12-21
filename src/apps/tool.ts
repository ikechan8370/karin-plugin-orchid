import karin, { common, logger, Message, segment } from 'node-karin'
import { deleteOtp, generateOTP, getSecretFromURL, listOtps, readOtpByName, readQRCode, saveOtp } from '@/utils/otp'
import { config } from '@/utils/config'
import { getIpGeoInfo, IPGeoInfo } from '@/utils/ip'

export const manageOtp = karin.command(/^#?(增加|添加|删除)(otp|OTP).+$/, async (e) => {
  const msg = e.msg
  const isAdd = msg.includes('增加') || msg.includes('添加')

  if (isAdd) {
    const name = msg.replace(/^(#)?(增加|添加)(otp|OTP)/, '').trim()
    e.store.set('name', name)
    await e.reply('请输入otp链接（以otpauth://开头）或发送二维码。为确保安全，请私聊使用本功能。', { reply: true })
    const ctx = await karin.ctx(e)
    addOtp(ctx)
  } else {
    const name = msg.replace(/^(#)?(删除)(otp|OTP)/, '').trim()
    const otp = readOtpByName(name, e.userId)
    if (!otp) {
      await e.reply(`未找到${name}的otp信息`)
    } else {
      deleteOtp(name, e.userId)
      await e.reply('删除成功')
    }
  }

  return true
}, { name: 'manageOtp' })

export const listOtp = karin.command(/^#?(otp|OTP)列表$/, async (e) => {
  const list = listOtps(e.userId)
  if (!list.length) {
    await e.reply('无otp信息')
    return true
  }
  const msg = list.map((v: { name: any }) => v.name).join('\n')
  await e.reply(msg, { reply: true })
  return true
}, { name: 'listOtp' })

export const otp = karin.command(/^(#)?t?otp.+$/, async (e) => {
  const name = e.msg.replace(/^(#)?(otp|OTP)/, '').trim()
  if (name === '帮助') {
    await e.reply('otp工具： \n#添加otp+名称 添加新的otp\n#删除otp+名称 删除otp\n#otp列表 查看已添加的otp\n#otp otp名称 获取otp验证码', { reply: true })
    return true
  }
  const otp = readOtpByName(name, e.userId)
  if (!otp) {
    await e.reply(`otp ${name} 不存在`)
    return true
  }
  const secret = await getSecretFromURL(otp.url)
  const otpCode = generateOTP(secret!)
  await e.reply(otpCode, { reply: true })
  return true
}, { name: 'otp' })

export const ip = karin.command(/^(#)?ip.+$/, async (e) => {
  let ipOrDamin = e.msg.replace(/^(#)?ip/, '').trim()
  // if domain start with http or https or /, trim them
  if (ipOrDamin.startsWith('http')) {
    const url = new URL(ipOrDamin)
    ipOrDamin = url.hostname
  }
  const sources = config().tools.ip_source
  let infos: IPGeoInfo[] = []
  for (const ip of sources) {
    try {
      const data = await getIpGeoInfo(ipOrDamin, ip)
      infos = infos.concat(data)
    } catch (e) {
      logger.error(e)
    }
  }

  const msgs = infos.map((json) => {
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
    e.reply(msgs[0])
  } else {
    const messages = common.makeForward(msgs.map((msg: string) => segment.text(msg)), e.userId, e.sender.nick)
    await e.bot.sendForwardMsg(e.contact, messages)
  }
  return true
}, { name: 'ip' })

const addOtp = async (e: Message) => {
  let url = e.msg
  if (!url) {
    if (!e.image) {
      await e.reply('未找到otp链接或二维码。')
      return
    }

    const result = await readQRCode(e.image[0])
    if (!result) {
      await e.reply('未识别到二维码，可能是无效的图片')
      return true
    }

    url = result
  }

  // check url
  try {
    const secret = await getSecretFromURL(url)
    const otp = generateOTP(secret!)
    logger.debug(`otp got: ${otp}`)
    // save to json
    const name = e.store.get('name')
    if (name === '帮助') {
      await e.reply('名称不能为帮助')
      return
    }

    saveOtp({ name, url, uid: e.userId })
    await e.reply('添加成功！')
  } catch (err) {
    logger.error(err)
    await e.reply('添加失败！' + (err as Error).message)
  }
}
