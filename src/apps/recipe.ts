import { karin, render, segment, logger, common, ImageElement } from 'node-karin'
import Recipe from '@/recipe/index'
import { dirPath } from '@/utils/dir'
import { config } from '@/utils/config'

export const RecommendRecipeCmd = karin.command('#?(吃什么|推荐菜谱)', async (e) => {
  const demand = e.msg.replace(/#?(吃什么|推荐菜谱)/, '').trim() || ''
  const summary = await Recipe.summary(demand)
  if (summary.recipes.length === 0) {
    await e.reply('没有找到相关菜谱', {
      reply: true
    })
    return true
  }
  const recipes = summary.recipes
  const descr = summary.summary
  await e.reply(segment.text(`推荐菜谱：${descr}`), { reply: true })

  const defBackground = 'https://upload-bbs.miyoushe.com/upload/2024/08/08/11137146/a13030c06cea59159c6cab3d5538731d_6288383820731450582.jpg'
  const background = config().rss.background || defBackground

  await e.reply(segment.text('正在生成，请稍后...'), { reply: true })

  const imgs: ImageElement[] = []

  await Promise.allSettled(recipes.map(async (hit) => {
    const { levelColor, timeColor } = getAssets(hit)
    const img = await render.render({
      name: 'recipe',
      file: `${dirPath}/resources/template/recipe.html`,
      data: {
        hit,
        levelColor,
        timeColor,
        pluResPath: `${dirPath}/resources/`,
        background
      },
      pageGotoParams: {
        waitUntil: 'networkidle2'
      }
    })

    imgs.push(segment.image(`base64://${img}`))
  }))

  const forwarded = common.makeForward(imgs, e.userId, e.sender.nick)
  await e.bot.sendForwardMsg(e.contact, forwarded)

  return true
})

export const RandomRecipeCmd = karin.command('#?随机菜谱', async (e) => {
  const keyword = e.msg.replace(/#?随机菜谱/, '').trim() || '*'
  let randomOffset = Math.floor(Math.random() * 10000)
  let searchResult = await Recipe.search(keyword, randomOffset, 1)
  if (searchResult.results.hits.length === 0) {
    randomOffset = Math.floor(Math.random() * searchResult.results.estimatedTotalHits)
    searchResult = await Recipe.search(keyword, randomOffset, 1)
  }
  const results = searchResult.results
  if (results.hits.length === 0) {
    await e.reply('没有找到相关菜谱', {
      reply: true
    })
    return true
  }

  const hit = results.hits[0]
  logger.info(JSON.stringify(hit))
  // const msgs = []
  // msgs.push(segment.text(`菜名: ${hit.name}\n类别: ${hit.categories?.join(', ')}\n难度: ${hit.难度}\n耗时: ${hit.耗时}\n工艺: ${hit.工艺}\n口味: ${hit.口味}\n主料: ${hit.main_ingredients?.join(', ')}\n辅料: ${hit.supplementary_ingredients?.join(', ')}\n调料: ${hit.seasonings?.join(', ')}`))
  // for (const step of hit.steps) {
  //   let stepMsg = []
  //   stepMsg.push(segment.text(`步骤: ${step.step}\n${step.description}\n`))
  //   // download image and send base64
  //   const buffer = await axios.get(step.img, {responseType: 'arraybuffer'})
  //   if (buffer.status === 200) {
  //     const base64Str = `base64://${Buffer.from(buffer.data).toString('base64')}`
  //     stepMsg.push(segment.image(base64Str))
  //   }
  //   // stepMsg.push(segment.image(step.img))
  //   msgs.push(stepMsg)
  // }
  // for (const step of hit.steps) {
  //   let stepMsg = []
  //   msgs.push(segment.text(`步骤: ${step.step}\n${step.description}\n`))
  //   // download image and send base64
  //   const buffer = await axios.get(step.img, {responseType: 'arraybuffer'})
  //   if (buffer.status === 200) {
  //     const base64Str = `base64://${Buffer.from(buffer.data).toString('base64')}`
  //     msgs.push(segment.image(base64Str))
  //   }
  // }
  // let rssConfig = config().rss
  // const forwarded = common.makeForward(msgs)
  // // await e.reply(segment.image('https://object-storage.avocado.wiki/recipe/step/2024/04/13/2024041317130104034325978334261.jpg'))
  // await e.bot.sendForwardMessage(e.contact, forwarded)
  const defBackground = 'https://upload-bbs.miyoushe.com/upload/2024/08/08/11137146/a13030c06cea59159c6cab3d5538731d_6288383820731450582.jpg'
  const background = config().rss.background || defBackground
  const { levelColor, timeColor } = getAssets(hit)
  const img = await render.render({
    name: 'recipe',
    file: `${dirPath}/resources/template/recipe.html`,
    data: {
      hit,
      levelColor,
      timeColor,
      pluResPath: `${dirPath}/resources/`,
      background
    },
    pageGotoParams: {
      waitUntil: 'networkidle2'
    }
  })

  await e.reply(segment.image(`base64://${img}`))
  return true
}, {
  name: 'random_recipe'
})

export const RecipeCmd = karin.command('#?菜谱', async (e) => {
  const keyword = e.msg.replace(/#?菜谱/, '').trim() || '*'
  let offset = 0; const limit = 10

  async function searchRecipe (offset: number, limit: number) {
    const searchResult = await Recipe.search(keyword, offset, limit)
    let text = `"${keyword}"的搜索结果（共${searchResult.results.estimatedTotalHits}条，当前展示第${offset + 1}-${offset + limit}条）：\n=================================\nid     菜名 [难度]\n`
    searchResult.results.hits.forEach(hit => {
      text += `${hit.id} ${hit.name} [${hit.难度}]\n`
    })
    text += '=================================\n'
    text += '请回复单个编号获取菜谱内容，回复下一页/上一页/第X页进行跳转'
    await e.reply(segment.text(text))

    const ctxReply = await karin.ctx(e)

    const ctxReplyMsg = ctxReply.msg
    return ctxReplyMsg
  }

  const ctxReplyMsg = await searchRecipe(offset, limit)

  async function handleCtxReply (ctxReplyMsg: string) {
    if (ctxReplyMsg === '下一页') {
      offset += limit
      const newCtxReplyMsg = await searchRecipe(offset, limit)
      return handleCtxReply(newCtxReplyMsg)
    } else if (ctxReplyMsg === '上一页') {
      offset -= limit
      if (offset < 0) {
        offset = 0
      }
      const newCtxReplyMsg = await searchRecipe(offset, limit)
      return handleCtxReply(newCtxReplyMsg)
    } else if (ctxReplyMsg.startsWith('第')) {
      const page = parseInt(ctxReplyMsg.replace('第', '').replace('页', ''))
      offset = (page - 1) * limit
      if (offset < 0) {
        offset = 0
      }
      const newCtxReplyMsg = await searchRecipe(offset, limit)
      return handleCtxReply(newCtxReplyMsg)
    } else {
      const id = parseInt(ctxReplyMsg)
      if (isNaN(id)) {
        await e.reply('请输入正确的编号', { reply: true })
        return
      }

      const hit = await Recipe.getById(id.toString())
      logger.info(JSON.stringify(hit))
      const background = config().rss.background || 'https://upload-bbs.miyoushe.com/upload/2024/08/08/11137146/a13030c06cea59159c6cab3d5538731d_6288383820731450582.jpg'
      const { levelColor, timeColor } = getAssets(hit)
      const img = await render.render({
        name: 'recipe',
        file: `${dirPath}/resources/template/recipe.html`,
        data: {
          hit,
          levelColor,
          timeColor,
          pluResPath: `${dirPath}/resources/`,
          background
        },
        pageGotoParams: {
          waitUntil: 'networkidle2'
        }
      })
      await e.reply(segment.image(`base64://${img}`))
    }
  }

  await handleCtxReply(ctxReplyMsg)
  return true
}, {
  name: 'recipe'
})

interface RecipeHit {
  难度: string
  耗时: string
  [key: string]: any
}

function getAssets (hit: RecipeHit) {
  const level = hit.难度
  let levelColor = {
    inner: '',
    outer: ''
  }
  // levels = ['普通', '未知', '神级', '简单', '高级']
  switch (level) {
    case '未知': {
      levelColor = {
        inner: '#404040',
        outer: '#131313'
      }
      break
    }
    case '神级': {
      levelColor = {
        inner: '#e17701',
        outer: '#ae5c00'
      }
      break
    }
    case '普通':
    case '简单': {
      levelColor = {
        inner: '#24ae24',
        outer: '#darkgreen'
      }
      break
    }
    case '高级': {
      levelColor = {
        inner: '#fb5151',
        outer: '#9a3434'
      }
      break
    }
  }

  const time = hit.耗时
  // time_consumes = [
  //     '一天', '一小时', '三刻钟', '十分钟', '半小时', '廿分钟', '数小时'
  // ]
  let timeColor = {
    inner: '',
    outer: ''
  }
  switch (time) {
    case '一天': {
      timeColor = {
        inner: '#ff0000',
        outer: '#800000'
      }
      break
    }
    case '一小时': {
      timeColor = {
        inner: '#ff8000',
        outer: '#804000'
      }
      break
    }
    case '三刻钟': {
      timeColor = {
        inner: '#ffbf00',
        outer: '#806600'
      }
      break
    }
    case '十分钟': {
      timeColor = {
        inner: '#ffff00',
        outer: '#808000'
      }
      break
    }
    case '半小时': {
      timeColor = {
        inner: '#80ff00',
        outer: '#408000'
      }
      break
    }
    case '廿分钟': {
      timeColor = {
        inner: '#00ff00',
        outer: '#008000'
      }
      break
    }
    case '数小时': {
      timeColor = {
        inner: '#00ff80',
        outer: '#008040'
      }
      break
    }
  }

  return {
    levelColor,
    timeColor
  }
}
