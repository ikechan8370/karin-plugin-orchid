import { logger } from 'node-karin'
import { basename, Config } from '#template'

logger.info(`${logger.violet(`[插件:${Config.package.version}]`)} ${logger.green(basename)} 初始化完成~`)
