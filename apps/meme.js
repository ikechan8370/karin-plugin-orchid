import {plugin, segment, config} from '#Karin'
import Cfg from '../lib/config/config.js'
import fetch, {File, FormData} from 'node-fetch'
import {checkFileSize, DATA_DIR, mkdirs} from '../utils/common.js'
import fs from 'fs'
import _ from 'lodash'
import {KarinContact} from '../../../lib/bot/KarinElement.js'

const UA = 'karin-plugin-orchid/1.0.0'
let keyMap = {}

let infos = {}

export class meme extends plugin {
  constructor () {
    const fixedRules = [
      {
        /** 命令正则匹配 */
        reg: '^(#)?(meme(s)?|表情包)列表$',
        /** 执行方法 */
        fnc: 'memesList',
      },
      {
        /** 命令正则匹配 */
        reg: '^#?随机(meme(s)?|表情包)',
        /** 执行方法 */
        fnc: 'randomMemes',
      },
      {
        /** 命令正则匹配 */
        reg: '^#?(meme(s)?|表情包)帮助',
        /** 执行方法 */
        fnc: 'memesHelp',
      },
      {
        /** 命令正则匹配 */
        reg: '^#?(meme(s)?|表情包)搜索',
        /** 执行方法 */
        fnc: 'memesSearch',
      },
      {
        /** 命令正则匹配 */
        reg: '^#?(meme(s)?|表情包)更新',
        /** 执行方法 */
        fnc: 'memesUpdate',
      },
    ]
    const option = {
      // 必选 插件名称
      name: 'meme',
      // 插件描述
      dsc: '制作表情包',
      // 监听消息事件 默认message
      event: 'message',
      // 优先级
      priority: 5000,
      // 以下rule、task、button、handler均为可选，如键入，则必须为数组
      rule: fixedRules,
    }
    // read init data
    mkdirs(DATA_DIR)
    keyMap = {}
    infos = {}
    if (fs.existsSync(DATA_DIR + '/infos.json')) {
      infos = fs.readFileSync(DATA_DIR + '/infos.json')
      infos = JSON.parse(infos)
    }
    if (fs.existsSync(DATA_DIR + '/keyMap.json')) {
      keyMap = fs.readFileSync(DATA_DIR + '/keyMap.json')
      keyMap = JSON.parse(keyMap)
    }

    const config = Cfg.Default
    Object.keys(keyMap).forEach(key => {
      const reg = config.forcePrefix ? `^${config.prefix}${key}` : `^${config.prefix}?${key}`
      option.rule.push({
        /** 命令正则匹配 */
        reg,
        /** 执行方法 */
        fnc: 'memes',
      })
    })
    super(option)
    this.fixedRules = fixedRules

    // generated by ChatGPT
    function generateCronExpression () {
      // 生成每天的半夜2-4点之间的小时值（随机选择）
      const hour = Math.floor(Math.random() * 3) + 2

      // 生成每小时的随机分钟值（0到59之间的随机数）
      const minute = Math.floor(Math.random() * 60)

      // 构建 cron 表达式
      return `${minute} ${hour} * * *`
    }

    this.task = [{
      cron: generateCronExpression(),
      name: 'memes自动更新任务',
      fnc: this.init.bind(this),
    }]
  }

  async init () {
    mkdirs(DATA_DIR)
    keyMap = {}
    infos = {}
    if (fs.existsSync(DATA_DIR + '/infos.json')) {
      infos = fs.readFileSync(DATA_DIR + '/infos.json')
      infos = JSON.parse(infos)
    }
    if (fs.existsSync(DATA_DIR + '/keyMap.json')) {
      keyMap = fs.readFileSync(DATA_DIR + '/keyMap.json')
      keyMap = JSON.parse(keyMap)
    }
    const config = Cfg.Default
    const base = config.api
    if (Object.keys(infos).length === 0) {
      logger.mark('meme infos资源本地不存在，正在远程拉取中')
      const infosRes = await fetch(`${base}/memes/static/infos.json`, {
        headers: {
          'User-Agent': UA,
        },
      })
      if (infosRes.status === 200) {
        infos = await infosRes.json()
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
        keyMap = await keyMapRes.json()
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
      const keys = await keysRes.json()

      const keyMapTmp = {}
      const infosTmp = {}
      for (const key of keys) {
        const keyInfoRes = await fetch(`${base}/memes/${key}/info`, {
          headers: {
            'User-Agent': UA,
          },
        })
        const info = await keyInfoRes.json()
        info.keywords.forEach(keyword => {
          keyMapTmp[keyword] = key
        })
        infosTmp[key] = info
      }
      infos = infosTmp
      keyMap = keyMapTmp
      fs.writeFileSync(DATA_DIR + '/keyMap.json', JSON.stringify(keyMap))
      fs.writeFileSync(DATA_DIR + '/infos.json', JSON.stringify(infos))
    }
    const rules = this.fixedRules
    Object.keys(keyMap).forEach(key => {
      const reg = config.forcePrefix ? `^${config.prefix}${key}` : `^${config.prefix}?${key}`
      rules.push({
        /** 命令正则匹配 */
        reg,
        /** 执行方法 */
        fnc: 'memes',
      })
    })
    this.rule = rules
  }

  async memesUpdate (e) {
    await e.reply('兰插件-表情包资源更新中')
    if (fs.existsSync(DATA_DIR + '/infos.json')) {
      fs.unlinkSync(DATA_DIR + '/infos.json')
    }
    if (fs.existsSync(DATA_DIR + '/keyMap.json')) {
      fs.unlinkSync(DATA_DIR + '/keyMap.json')
    }
    try {
      await this.init()
    } catch (err) {
      await this.reply('更新失败：' + err.message, true)
    }
    await this.reply('更新完成', true)
  }

  async memesHelp (e) {
    await this.reply('【memes列表】：查看支持的memes列表\n【{表情名称}】：memes列表中的表情名称，根据提供的文字或图片制作表情包\n【随机meme】：随机制作一些表情包\n【meme搜索+关键词】：搜索表情包关键词\n【{表情名称}+详情】：查看该表情所支持的参数\n    兰插件 Karin-Plugin-Orchid   ', { reply: e.isGroup })
  }

  async memesSearch (e) {
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
    await this.reply(result, { reply: e.isGroup })
  }

  async memesList (e) {
    const resultFileLoc = DATA_DIR + '/render_list.jpg'
    if (fs.existsSync(resultFileLoc)) {
      const file = fs.readFileSync(resultFileLoc)
      await e.reply(segment.image(`base64://${file.toString('base64')}`))
      return true
    }
    const response = await fetch(Cfg.Default.api + '/memes/render_list', {
      method: 'POST',
      headers: {
        'User-Agent': UA,
      },
    })
    const resultBlob = await response.blob()
    const resultArrayBuffer = await resultBlob.arrayBuffer()
    const resultBuffer = Buffer.from(resultArrayBuffer)
    await fs.writeFileSync(resultFileLoc, resultBuffer)
    await this.reply(segment.image(`base64://${resultBuffer.toString('base64')}`), { reply: Cfg.Default.reply })
    setTimeout(async () => {
      await fs.unlinkSync(resultFileLoc)
    }, 3600)
    return true
  }

  async randomMemes (e) {
    const keys = Object.keys(infos).filter(key => infos[key].params.min_images === 1 && infos[key].params.min_texts === 0)
    const index = _.random(0, keys.length - 1, false)
    console.log(keys, index)
    e.msg = infos[keys[index]].keywords[0]
    return await this.memes(e)
  }

  /**
   * #memes
   */
  async memes () {
    const e = this.e
    let msg = e.msg
    msg = _.trimStart(msg, Cfg.Default.prefix)
    let target = Object.keys(keyMap).find(k => msg.startsWith(k))
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
    let userInfos
    const formData = new FormData()
    const info = infos[targetCode]
    let fileLoc
    if (info.params.max_images > 0) {
      // 可以有图，来从回复、发送和头像找图
      let imgUrls = []
      const source = /** @type {KarinReplyElement} **/ e.elements.find(ele => ele.type === 'reply')
      const imgWith = /** @type {KarinImageElement[]} **/ e.elements.filter(m => m.type === 'image')
      if (source) {
        // 优先从回复找图
        let reply
        if (e.isGroup) {
          const replyMsg = await this.e.bot.GetMessage(KarinContact.group(this.e.group_id), source.message_id)
          reply = replyMsg.elements
        } else {
          const replyMsg = await this.e.bot.GetMessage(KarinContact.private(this.e.sender.uin), source.message_id)
          reply = replyMsg.elements
        }
        if (reply) {
          for (const val of reply) {
            if (val.type === 'image') {
              console.log(val)
              imgUrls.push(val.file)
            }
          }
        }
      } else if (imgWith?.length > 0) {
        // 一起发的图
        imgUrls.push(...imgWith)
      } else if (e.elements.filter(m => m.type === 'at').length > 0) {
        // 艾特的用户的头像
        const ats = /** @type {KarinAtElement[]} **/ e.elements.filter(m => m.type === 'at')
        imgUrls = ats.map(at => at.uid || at.uin).map(qq => `https://q1.qlogo.cn/g?b=qq&s=160&nk=${qq}`)
      }
      if (!imgUrls || imgUrls.length === 0) {
        // 如果都没有，用发送者的头像
        imgUrls = [await getAvatar(e)]
      }
      if (imgUrls.length < info.params.min_images && imgUrls.indexOf(await getAvatar(e)) === -1) {
        // 如果数量不够，补上发送者头像，且放到最前面
        const me = [await getAvatar(e)]
        let done = false
        if (targetCode === 'do' && Cfg.Default.masterProtect) {
          const masters = getMasterQQ()
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
      imgUrls = imgUrls.slice(0, Math.min(info.params.max_images, imgUrls.length))
      for (let i = 0; i < imgUrls.length; i++) {
        const imgUrl = imgUrls[i]
        const imageResponse = await fetch(imgUrl)
        const fileType = imageResponse.headers.get('Content-Type').split('/')[1]
        fileLoc = DATA_DIR + `/original/${Date.now()}.${fileType}`
        mkdirs(DATA_DIR + '/original')
        const blob = await imageResponse.blob()
        const arrayBuffer = await blob.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        await fs.writeFileSync(fileLoc, buffer)
        formData.append('images', new File([buffer], `avatar_${i}.jpg`, { type: 'image/jpeg' }))
      }
    }
    if (text && info.params.max_texts === 0) {
      return false
    }
    /**
     * @type {IGroupMemberInfo|{
     *     uid: string,
     *     uin: string,
     *     nick?: string
     *   }}
     */
    let sender
    if (e.isGroup) {
      sender = await this.e.bot.GetGroupMemberInfo({ group_id: this.e.group_id, target_uid: this.e.sender.uid, target_uin: this.e.sender.uin })
    } else {
      sender = this.e.sender
    }
    if (!text && info.params.min_texts > 0) {
      if (e.elements.filter(m => m.type === 'at').length > 0) {
        text = _.trim(e.elements.filter(m => m.type === 'at')[0].text, '@')
      } else {
        text = sender.card || sender.nick
      }
    }
    const texts = text.split('/', info.params.max_texts)
    if (texts.length < info.params.min_texts) {
      await e.reply(`字不够！要至少${info.params.min_texts}个用/隔开！`, true)
      return true
    }
    texts.forEach(t => {
      formData.append('texts', t)
    })
    if (info.params.max_texts > 0 && formData.getAll('texts').length === 0) {
      if (formData.getAll('texts').length < info.params.max_texts) {
        if (e.elements.filter(m => m.type === 'at').length > 0) {
          formData.append('texts', _.trim(e.elements.filter(m => m.type === 'at')[0].text, '@'))
        } else {
          formData.append('texts', sender.card || sender.nick)
        }
      }
    }
    if (e.elements.filter(m => m.type === 'at').length > 0) {
      userInfos = /** @type {KarinAtElement[]} **/ e.elements.filter(m => m.type === 'at')
      const mm = await this.e.bot.GetGroupMemberList({ group_id: this.e.group_id })
      userInfos.forEach(ui => {
        const user = mm.find(m => m.uin === ui.uin)
        if (user) {
          // ui.gender = user.sex
          ui.text = user.card || user.nick
        }
      })
    }
    if (!userInfos) {
      userInfos = [{
        text: sender.card || sender.nick,
        // gender: e.sender.sex
      }]
    }
    args = handleArgs(targetCode, args, userInfos)
    if (args) {
      formData.set('args', args)
    }
    const images = formData.getAll('images')
    if (checkFileSize(images)) {
      return this.e.reply(`文件大小超出限制，最多支持${Cfg.Default.maxFileSize}MB`)
    }
    console.log('input', { target, targetCode, images, texts: formData.getAll('texts'), args: formData.getAll('args') })
    const response = await fetch(Cfg.Default.api + '/memes/' + targetCode + '/', {
      method: 'POST',
      body: formData,
      headers: {
        // 'Content-Type': 'multipart/form-data'
        'User-Agent': UA
      },
    })
    // console.log(response.status)
    if (response.status > 299) {
      const error = await response.text()
      console.error(error)
      await e.reply(error, true)
      return true
    }
    mkdirs(DATA_DIR + '/result')
    // const resultFileLoc = DATA_DIR + `/result/${Date.now()}.gif`
    const resultBlob = await response.blob()
    const resultArrayBuffer = await resultBlob.arrayBuffer()
    const resultBuffer = Buffer.from(resultArrayBuffer)
    // await fs.writeFileSync(resultFileLoc, resultBuffer)
    await this.reply(segment.image(`base64://${resultBuffer.toString('base64')}`), { reply: Cfg.Default.reply })
    // fileLoc && fs.unlinkSync(fileLoc)
    // await fs.unlinkSync(resultFileLoc)
  }
}

function handleArgs (key, args, userInfos) {
  if (!args) {
    args = ''
  }
  let argsObj = {}
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
      }
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
        args = _.trim(userInfos[0].text, '@')
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
      }
      argsObj = { mode: modeMap[args] || 'normal' }
      break
    }
    case 'gun':
    case 'bubble_tea': {
      const directionMap = {
        左: 'left',
        右: 'right',
        两边: 'both',
      }
      argsObj = { position: directionMap[args.trim()] || 'right' }
      break
    }
    case 'dog_dislike' : {
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
      name: _.trim(u.text, '@'),
      gender: u.gender || 'unknown',
    }
  })
  return JSON.stringify(argsObj)
}

const detail = code => {
  const d = infos[code]
  const keywords = d.keywords.join('、')
  let ins = `【代码】${d.key}\n【名称】${keywords}\n【最大图片数量】${d.params.max_images}\n【最小图片数量】${d.params.min_images}\n【最大文本数量】${d.params.max_texts}\n【最小文本数量】${d.params.min_texts}\n【默认文本】${d.params.default_texts.join('/')}\n`
  if (d.params.args.length > 0) {
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

async function getAvatar (e, userId = e.sender.uin) {
  if (typeof e.getAvatarUrl === 'function') {
    return await e.getAvatarUrl(0)
  }
  return `https://q1.qlogo.cn/g?b=qq&s=0&nk=${userId}`
}

function getMasterQQ () {
  return config.master
}
