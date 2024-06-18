import { plugin } from '#Karin'
import { Common } from '#template'

export class Time extends plugin {
  constructor () {
    super({
      /** 插件名称 */
      name: 'template-time',
      /** 插件描述 */
      dsc: '一个简单的别名导入模板',
      rule: [
        {
          /** 命令正则匹配 */
          reg: '^#?当前时间$',
          /** 执行方法 */
          fnc: 'getTime'
        }
      ]
    })
  }

  async getTime () {
    return this.reply(Common.time())
  }
}
