import { logger, plugin } from '#Karin'

export class Task extends plugin {
  constructor () {
    super({
      /** 插件名称 */
      name: 'template-task',
      /** 插件描述 */
      dsc: '定时任务模板',
      task: [
        {
          /** 定时任务名称 */
          name: '1分钟打印1次hello',
          /** cron表达式 */
          cron: '0 */1 * * * *',
          /** 方法名 */
          fnc: 'taskHello',
          /** 是否显示操作日志 */
          log: false
        }
      ]
    })
  }

  async taskHello () {
    logger.info('hello')
  }
}
