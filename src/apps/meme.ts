import fs from 'node:fs'
import _ from 'node-karin/lodash'
import { config as Cfg, DATA_DIR } from '../utils/config'
import fetch, { File, FormData } from 'node-fetch'
import { karin, segment, config, logger } from 'node-karin'
import { checkFileSize, mkdirs } from '../utils/common'

import type { AtElement, Message, Sender } from 'node-karin'
import path from 'node:path'

const UA = 'karin-plugin-orchid/1.0.0'
let keyMap: Record<string, any> = {}
let infos: Record<string, any> = {}
/** 本地文件列表 */
const list = ['infos.json', 'keyMap.json']

const commandAll: ReturnType<typeof karin.command>[] = []

/** 表情包列表 */
export const memesList = karin.command(/^#?(meme(s)?|表情包)列表$/, async (e) => {
  const resultFileLoc = DATA_DIR + '/render_list.jpg'
  if (fs.existsSync(resultFileLoc)) {
    const file = fs.readFileSync(resultFileLoc)
    await e.reply(segment.image(`base64://${file.toString('base64')}`))
    return true
  }
  const response = await fetch(Cfg().api + '/memes/render_list', {
    method: 'POST',
    headers: {
      'User-Agent': UA,
    },
  })
  const resultBlob = await response.blob()
  const resultArrayBuffer = await resultBlob.arrayBuffer()
  const resultBuffer = Buffer.from(resultArrayBuffer)

  fs.writeFileSync(resultFileLoc, resultBuffer)
  await e.reply(segment.image(`base64://${resultBuffer.toString('base64')}`), { reply: Cfg().reply })
  setTimeout(async () => {
    fs.promises.unlink(resultFileLoc)
  }, 3600)
  return true
}, { name: 'meme列表' })

/** 随机meme */
export const randomMemes = karin.command(/^#?随机(meme(s)?|表情包)$/, async (e) => {
  const keys = Object.keys(infos).filter(key => infos[key].params_type.min_images === 1 && infos[key].params_type.min_texts === 0)
  const index = _.random(0, keys.length - 1, false)
  e.msg = infos[keys[index]].keywords[0]

  return await memes(e)
}, { name: '随机meme' })

/** meme帮助 */
export const memesHelp = karin.command(/^#?(meme(s)?|表情包)帮助$/, async (e) => {
  await e.reply([
    '【memes列表】：查看支持的memes列表',
    '【{表情名称}】：memes列表中的表情名称，根据提供的文字或图片制作表情包',
    '【随机meme】：随机制作一些表情包',
    '【meme搜索+关键词】：搜索表情包关键词',
    '【{表情名称}+详情】：查看该表情所支持的参数',
    '兰插件 Karin-Plugin-Orchid',
  ].join('\n'), { reply: e.isGroup })
  return true
}, { name: 'meme帮助' })

/** meme搜索 */
export const memesSearch = karin.command(/^#?(meme(s)?|表情包)搜索/, async (e) => {
  const search = e.msg.replace(/^#?(meme(s)?|表情包)搜索/, '').trim()
  if (!search) {
    await e.reply('你要搜什么？')
    return true
  }
  const hits = Object.keys(keyMap).filter(k => k.indexOf(search) > -1)
  let result = '搜索结果'
  if (hits.length > 0) {
    for (let i = 0; i < hits.length; i++) {
      result += `\n${i + 1}. ${hits[i]}`
    }
  } else {
    result += '\n无'
  }
  await e.reply(result, { reply: e.isGroup })
  return true
}, { name: 'meme搜索' })

/** meme更新 */
export const memesUpdate = karin.command(/^#?(meme(s)?|表情包)更新$/, async (e) => {
  await e.reply('兰插件-表情包资源更新中')
  list.forEach(file => {
    const filePath = path.join(DATA_DIR, file)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  })

  try {
    await init()
  } catch (err) {
    await e.reply('更新失败：' + (err as Error).message, { reply: true })
  }
  await e.reply('更新完成，请重启生效', { reply: true })
  return true
}, { name: 'meme更新', perm: 'admin' })

/**
 * meme核心方法
 * @param  e 消息事件对象
 */
const memes = async (e: Message) => {
  let msg = e.msg
  msg = _.trimStart(msg, Cfg().prefix)
  let target = Object.keys(keyMap).find(k => msg.startsWith(k))!
  if (target === '玩' && msg.startsWith('玩游戏')) {
    target = '玩游戏'
  }
  if (target === '滚' && msg.startsWith('滚屏')) {
    target = '滚屏'
  }

  const targetCode = keyMap[target]
  // let target = e.msg.replace(/^#?meme(s)?/, '')

  const argsStr = msg.replace(target, '')
  if (argsStr.trim() === '详情' || argsStr.trim() === '帮助') {
    await e.reply(detail(targetCode))
    return false
  }

  let [text, args = ''] = argsStr.split('#')
  let userInfos: AtElement[] | undefined
  const formData = new FormData()
  const info = infos[targetCode]
  let fileLoc
  if (info.params_type.max_images > 0) {
    // 可以有图，来从回复、发送和头像找图
    let imgUrls: string[] = []
    const imgWith = /** @type {KarinImageElement[]} **/ e.elements.filter(m => m.type === 'image')
    if (e.replyId) {
      // 优先从回复找图
      let reply
      if (e.isGroup) {
        const replyMsg = await e.bot.getMsg(e.contact, e.replyId)
        reply = replyMsg.elements
      } else {
        const replyMsg = await e.bot.getMsg(e.contact, e.replyId)
        reply = replyMsg.elements
      }

      if (reply) {
        for (const val of reply) {
          if (val.type === 'image') {
            // console.log(val)
            imgUrls.push(val.file)
          }
        }
      }
    } else if (imgWith?.length > 0) {
      // 一起发的图
      imgUrls.push(...imgWith.map(i => i.file))
    } else if (e.elements.filter(m => m.type === 'at').length > 0) {
      // 艾特的用户的头像
      // imgUrls = e.at.map(qq => `https://q1.qlogo.cn/g?b=qq&s=160&nk=${qq}`)
      await Promise.all(e.at.map(async qq => {
        const url = await e.bot.getAvatarUrl(qq)
        imgUrls.push(url)
      }))
    }

    if (!imgUrls || imgUrls.length === 0) {
      // 如果都没有，用发送者的头像
      imgUrls = [await e.bot.getAvatarUrl(e.userId)]
    }

    if (imgUrls.length < info.params_type.min_images && imgUrls.indexOf(await e.bot.getAvatarUrl(e.userId)) === -1) {
      // 如果数量不够，补上发送者头像，且放到最前面
      const me = [await e.bot.getAvatarUrl(e.userId)]
      let done = false
      if (targetCode === 'do' && Cfg().masterProtect) {
        const masters = config.master()
        if (imgUrls[0].startsWith('https://q1.qlogo.cn')) {
          const split = imgUrls[0].split('=')
          const targetQQ = split[split.length - 1]
          if (masters.map(q => q + '').indexOf(targetQQ) > -1) {
            imgUrls = imgUrls.concat(me)
            done = true
          }
        }
      }
      if (!done) {
        imgUrls = me.concat(imgUrls)
      }

      // imgUrls.push(`https://q1.qlogo.cn/g?b=qq&s=160&nk=${e.msg.sender.user_id}`)
    }

    imgUrls = imgUrls.slice(0, Math.min(info.params_type.max_images, imgUrls.length))
    for (let i = 0; i < imgUrls.length; i++) {
      const imgUrl = imgUrls[i]
      const imageResponse = await fetch(imgUrl)
      const fileType = imageResponse.headers.get('Content-Type')!.split('/')[1]
      fileLoc = DATA_DIR + `/original/${Date.now()}.${fileType}`
      mkdirs(DATA_DIR + '/original')
      const blob = await imageResponse.blob()
      const arrayBuffer = await blob.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      fs.promises.writeFile(fileLoc, buffer)
      formData.append('images', new File([buffer], `avatar_${i}.jpg`, { type: 'image/jpeg' }))
    }
  }
  if (text && info.params_type.max_texts === 0) {
    return false
  }

  let sender: Sender

  if (e.isGroup) {
    const info = await e.bot.getGroupMemberInfo(e.groupId, e.sender.userId)
    sender = info.sender
  } else {
    sender = e.sender
  }
  if (!text && info.params_type.min_texts > 0) {
    if (e.at.length > 0) {
      text = _.trim(e.elements.filter(m => m.type === 'at')[0].name, '@')
    } else {
      text = ('card' in sender ? sender.card : sender.nick) || sender.nick
    }
  }
  const texts = text.split('/', info.params_type.max_texts)

  if (texts.length < info.params_type.min_texts) {
    await e.reply(`字不够！要至少${info.params_type.min_texts}个用/隔开！`, { reply: true })
    return true
  }

  texts.forEach(t => {
    formData.append('texts', t)
  })

  if (info.params_type.max_texts > 0 && formData.getAll('texts').length === 0) {
    if (formData.getAll('texts').length < info.params_type.max_texts) {
      if (e.elements.filter(m => m.type === 'at').length > 0) {
        formData.append('texts', _.trim(e.elements.filter(m => m.type === 'at')[0].name, '@'))
      } else {
        formData.append('texts', ('card' in sender ? sender.card : sender.nick) || sender.nick)
      }
    }
  }

  if (e.isGroup && e.at.length) {
    userInfos = e.elements.filter(m => m.type === 'at')
    const mm = await e.bot.getGroupMemberList(e.groupId)
    userInfos.forEach(ui => {
      const user = mm.find(m => m.userId === ui.targetId)
      if (user) {
        // ui.gender = user.sex
        ui.name = user.card || user.nick
      }
    })
  }

  if (!userInfos) {
    userInfos = [segment.at(e.sender.userId, 'card' in sender ? sender.card : sender.nick)]
  }

  args = handleArgs(targetCode, args, userInfos)
  if (args) {
    formData.set('args', args)
  }
  const images = formData.getAll('images')
  if (checkFileSize(images)) {
    await e.reply(`文件大小超出限制，最多支持${Cfg().maxFileSize}MB`)
    return true
  }

  console.log('input', { target, targetCode, images, texts: formData.getAll('texts'), args: formData.getAll('args') })
  const response = await fetch(Cfg().api + '/memes/' + targetCode + '/', {
    method: 'POST',
    body: formData,
    headers: {
      // 'Content-Type': 'multipart/form-data'
      'User-Agent': UA,
    },
  })
  // console.log(response.status)
  if (response.status > 299) {
    const error = await response.text()
    console.error(error)
    await e.reply(error, { reply: true })
    return true
  }
  mkdirs(DATA_DIR + '/result')
  // const resultFileLoc = DATA_DIR + `/result/${Date.now()}.gif`
  const resultBlob = await response.blob()
  const resultArrayBuffer = await resultBlob.arrayBuffer()
  const resultBuffer = Buffer.from(resultArrayBuffer)
  // await fs.writeFileSync(resultFileLoc, resultBuffer)
  await e.reply(segment.image(`base64://${resultBuffer.toString('base64')}`), { reply: Cfg().reply })
  // fileLoc && fs.unlinkSync(fileLoc)
  // await fs.unlinkSync(resultFileLoc)
  return true
}

const init = async () => {
  list.forEach(file => {
    const filePath = path.join(DATA_DIR, file)
    if (!fs.existsSync(filePath)) return

    const data = JSON.parse(fs.readFileSync(filePath).toString())
    if (file === 'infos.json') {
      infos = data
    } else {
      keyMap = data
    }
  })

  const config = Cfg()
  const base = config.api

  if (Object.keys(infos).length === 0) {
    logger.mark('meme infos资源本地不存在，正在远程拉取中')
    const infosRes = await fetch(`${base}/memes/static/infos.json`, {
      headers: {
        'User-Agent': UA,
      },
    })
    if (infosRes.status === 200) {
      infos = await infosRes.json() as Record<string, any>
      fs.writeFileSync(DATA_DIR + '/infos.json', JSON.stringify(infos))
    }
  }

  if (Object.keys(keyMap).length === 0) {
    logger.mark('meme keyMap资源本地不存在，正在远程拉取中')
    const keyMapRes = await fetch(`${base}/memes/static/keyMap.json`, {
      headers: {
        'User-Agent': UA,
      },
    })
    if (keyMapRes.status === 200) {
      keyMap = await keyMapRes.json() as Record<string, any>
      fs.writeFileSync(DATA_DIR + '/keyMap.json', JSON.stringify(keyMap))
    }
  }

  if (Object.keys(infos).length === 0 || Object.keys(keyMap).length === 0) {
    // 只能本地生成了
    const keysRes = await fetch(`${base}/memes/keys`, {
      headers: {
        'User-Agent': UA,
      },
    })
    const keys = await keysRes.json() as string[]

    const keyMapTmp: Record<string, any> = {}
    const infosTmp: Record<string, any> = {}
    for (const key of keys) {
      const keyInfoRes = await fetch(`${base}/memes/${key}/info`, {
        headers: {
          'User-Agent': UA,
        },
      })
      const info = await keyInfoRes.json() as Record<string, any>
      info.keywords.forEach((keyword: string) => {
        keyMapTmp[keyword] = key
      })
      infosTmp[key] = info
    }

    infos = infosTmp
    keyMap = keyMapTmp
    fs.writeFileSync(DATA_DIR + '/keyMap.json', JSON.stringify(keyMap))
    fs.writeFileSync(DATA_DIR + '/infos.json', JSON.stringify(infos))
  }

  Object.keys(keyMap).forEach(key => {
    const reg = config.forcePrefix ? `^${config.prefix}${key}` : `^${config.prefix}?${key}`
    commandAll.push(karin.command(new RegExp(reg), (e) => memes(e)))
  })
}

const generateCronExpression = () => {
  // 生成每天的半夜2-4点之间的小时值（随机选择）
  const hour = Math.floor(Math.random() * 3) + 2

  // 生成每小时的随机分钟值（0到59之间的随机数）
  const minute = Math.floor(Math.random() * 60)

  // 构建 cron 表达式
  return `${minute} ${hour} * * *`
}

export const task = karin.task('memes自动更新任务', generateCronExpression(), init)

await init()

export { commandAll }

function handleArgs (key: string, args: string, userInfos: AtElement[]) {
  if (!args) {
    args = ''
  }
  let argsObj: Record<string, any> = {}
  switch (key) {
    case 'look_flat': {
      argsObj = { ratio: parseInt(args || '2') }
      break
    }
    case 'crawl': {
      argsObj = { number: parseInt(args) ? parseInt(args) : _.random(1, 92, false) }
      break
    }
    case 'symmetric': {
      const directionMap = {
        左: 'left',
        右: 'right',
        上: 'top',
        下: 'bottom',
      } as Record<string, string>
      argsObj = { direction: directionMap[args.trim()] || 'left' }
      break
    }
    case 'petpet':
    case 'jiji_king':
    case 'kirby_hammer': {
      argsObj = { circle: args.startsWith('圆') }
      break
    }
    case 'my_friend': {
      if (!args) {
        args = _.trim(userInfos[0].name, '@')
      }
      argsObj = { name: args }
      break
    }
    case 'looklook': {
      argsObj = { mirror: args === '翻转' }
      break
    }
    case 'always': {
      const modeMap = {
        '': 'normal',
        循环: 'loop',
        套娃: 'circle',
      } as Record<string, string>
      argsObj = { mode: modeMap[args] || 'normal' }
      break
    }
    case 'gun':
    case 'bubble_tea': {
      const directionMap = {
        左: 'left',
        右: 'right',
        两边: 'both',
      } as Record<string, string>
      argsObj = { position: directionMap[args.trim()] || 'right' }
      break
    }
    case 'dog_dislike': {
      argsObj = { circle: args.startsWith('圆') }
      break
    }
    case 'clown': {
      argsObj = { person: args.startsWith('爷') }
      break
    }
    case 'note_for_leave': {
      if (args) {
        argsObj = { time: args }
      }
      break
    }
    case 'mourning': {
      argsObj = { black: args.startsWith('黑白') || args.startsWith('灰') }
      break
    }
  }
  argsObj.user_infos = userInfos.map(u => {
    return {
      name: _.trim(u.name, '@'),
      // gender: u.gender || 'unknown',
      gender: 'unknown'
    }
  })
  return JSON.stringify(argsObj)
}

const detail = (code: string) => {
  const d = infos[code]
  const keywords = d.keywords.join('、')
  let ins = `【代码】${d.key}\n【名称】${keywords}\n【最大图片数量】${d.params_type.max_images}\n【最小图片数量】${d.params_type.min_images}\n【最大文本数量】${d.params_type.max_texts}\n【最小文本数量】${d.params_type.min_texts}\n【默认文本】${d.params_type.default_texts.join('/')}\n`
  if (d.params_type.args.length > 0) {
    let supportArgs = ''
    switch (code) {
      case 'look_flat': {
        supportArgs = '看扁率，数字.如#3'
        break
      }
      case 'crawl': {
        supportArgs = '爬的图片编号，1-92。如#33'
        break
      }
      case 'symmetric': {
        supportArgs = '方向，上下左右。如#下'
        break
      }
      case 'dog_dislike':
      case 'petpet':
      case 'jiji_king':
      case 'kirby_hammer': {
        supportArgs = '是否圆形头像，输入圆即可。如#圆'
        break
      }
      case 'always': {
        supportArgs = '一直图像的渲染模式，循环、套娃、默认。不填参数即默认。如一直#循环'
        break
      }
      case 'gun':
      case 'bubble_tea': {
        supportArgs = '方向，左、右、两边。如#两边'
        break
      }
      case 'clown': {
        supportArgs = '是否使用爷爷头轮廓。如#爷'
        break
      }
      case 'note_for_leave': {
        supportArgs = '请假时间。如#2023年11月11日'
        break
      }
      case 'mourning': {
        supportArgs = '是否黑白。如#黑白 或 #灰'
        break
      }
    }
    ins += `【支持参数】${supportArgs}`
  }
  return ins
}
