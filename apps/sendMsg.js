import { Common } from '#template'
import { segment, plugin, Bot } from '#Karin'

export class sendMsg extends plugin {
  constructor () {
    super({
      /** 插件名称 */
      name: 'template-sendMsg',
      /** 插件描述 */
      dsc: '主动消息测试',
      rule: [
        {
          /** 命令正则匹配 */
          reg: '^#?主动消息测试',
          /** 执行方法 */
          fnc: 'sendMsg',
          /** 权限 master,owner,admin,all  */
          permission: 'master'
        }
      ]
    })
  }

  async sendMsg () {
    const { uid, uin } = this.e.bot.account
    const res = await Bot.sendMsg(
      uid || uin,
      this.e.contact,
      segment.text('这是一条主动消息，10秒后自动撤回~'),
      { recallMsg: 10 }
    )
    await Common.sleep(1000)
    return this.reply(`发送成功，消息ID：${res.message_id}`, { at: true })
  }
}
