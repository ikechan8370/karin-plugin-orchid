import { Renderer, common, segment, plugin } from '#Karin'

export class render extends plugin {
  constructor () {
    super({
      /** 插件名称 */
      name: 'template-render',
      /** 插件描述 */
      dsc: '快速渲染',
      rule: [
        {
          /** 命令正则匹配 */
          reg: '^#?测试渲染$',
          /** 执行方法 */
          fnc: 'render',
          /** 权限 master,owner,admin,all  */
          permission: 'master'
        },
        {
          /** 命令正则匹配 */
          reg: '^#?渲染',
          /** 执行方法 */
          fnc: 'renderUrl',
          /** 权限 master,owner,admin,all  */
          permission: 'master'
        }
      ]
    })
  }

  async render () {
    try {
      const filePath = common.absPath('./plugins/karin-plugin-template/resources')
      const html = filePath + '/template/test.html'
      const image = filePath + '/image/启程宣发.png'

      const img = await Renderer.render({
        name: 'render',
        file: html,
        data: {
          file: image,
          pluResPath: process.cwd()
        }
      })
      return this.reply(segment.image(img))
    } catch (e) {
      logger.error(e)
      return this.reply(e.message)
    }
  }

  async renderUrl () {
    const file = this.e.msg.replace(/^#?渲染/, '').trim()
    try {
      const img = await Renderer.render({
        name: 'render',
        file: file || 'https://whitechi73.github.io/OpenShamrock/',
        type: 'png',
        pageGotoParams: {
          waitUntil: 'load'
        },
        setViewport: {
          width: 1920,
          height: 1080,
          deviceScaleFactor: 1
        }
      })
      this.reply(segment.image(img))
    } catch (e) {
      logger.error(e)
      return this.reply(e.message)
    }
  }
}
