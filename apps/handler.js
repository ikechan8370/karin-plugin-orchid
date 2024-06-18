import { plugin, handler } from '#Karin'

export class Handler extends plugin {
  constructor () {
    super({
      /** 插件名称 */
      name: 'template-handler',
      /** 插件描述 */
      dsc: '发送你好回复hello',
      handler: [
        {
          /** handler事件key */
          key: 'test.image',
          /** handler处理方法 */
          fnc: 'handlerMessage',
          /** handler优先级 数字越小优先级越高 */
          priority: 1000
        }
      ],
      rule: [
        {
          /** 命令正则匹配 */
          reg: '^#?测试handler$',
          /** 执行方法 */
          fnc: 'testHandler'
        }
      ]
    })
  }

  /** handler事件 */
  async handlerMessage (args, reject) {
    // reject('继续循环下一个handler')
    return 'Handler处理完成'
  }

  /** 命令 */
  async testHandler () {
    const msg = '测试handler'
    /** 对于传参，开发者传自行需要的参数即可，无任何参数强制需求... */
    const res = await handler.call('test.image', { e: this.e, msg })
    return this.reply(res)
  }
}
