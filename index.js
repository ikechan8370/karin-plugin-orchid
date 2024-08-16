import { logger } from 'node-karin'
import { basename, Config } from '#template'
import path from "path";


export const getDir = (PATH) => {
    const _path = path.dirname(
        path.resolve('/', decodeURI(PATH.replace(/^file:\/\/(?:\/)?/, '')))
    ).replace(/\\/g, '/')

    return {
        path: _path,
        name: path.basename(_path)
    }
}
export const { path: dirPath, name: PluginName } = getDir(import.meta.url)

logger.info(`${logger.violet(`[插件:${Config.package.version}]`)} ${logger.green(basename)} 初始化完成~`)
