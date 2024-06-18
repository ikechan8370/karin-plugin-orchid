import { plugin, segment } from '#Karin'

export class hello extends plugin {
  constructor () {
    super({
      // 必选 插件名称
      name: 'hello',
      // 插件描述
      dsc: '发送你好回复hello',
      // 监听消息事件 默认message
      event: 'message',
      // 优先级
      priority: 5000,
      // 以下rule、task、button、handler均为可选，如键入，则必须为数组
      rule: [
        {
          /** 命令正则匹配 */
          reg: '^#你好$',
          /** 执行方法 */
          fnc: 'hello',
          //  是否显示操作日志 true=是 false=否
          log: true,
          // 权限 master,owner,admin,all
          permission: 'all'
        }
      ],
      task: [
        {
          // 必选 定时任务名称
          name: '1分钟打印1次hello',
          // 必选 cron表达式
          cron: '0 */1 * * * *',
          // 必选 方法名
          fnc: 'taskHello',
          // 是否显示操作日志 true=是 false=否
          log: false
        }
      ],
      button: [
        {
          // 必选 按钮命令正则
          reg: '测试按钮',
          // 必选 按钮执行方法
          fnc: 'buttonTest'
        }
      ],
      handler: [
        {
          // 必选 handler支持的事件key
          key: 'test.message',
          // 必选 handler的处理fnc
          fnc: 'handlerMessage',
          // handler优先级，数字越小优先级越高，默认2000
          priority: 1000
        }
      ]
    })
  }

  async hello () {
    // 调用 this.reply 方法回复 hello 关于参数2，请看下文
    this.reply('hello', { at: false, recallMsg: 0, reply: true, button: false })
  }

  async taskHello () {
    console.log('hello')
  }

  async buttonTest () {
    // 构建一个连接按钮
    const data = segment.button({ link: 'https://www.baidu.com', text: '百度一下' })
    return {
      stop: true, // 停止循环，不再遍历后续按钮
      data
    }
  }

  async handlerMessage (e, args, reject) {
    // ...
  }
}
