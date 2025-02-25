import { dirPath } from '.'
import {
  watch,
  basePath,
  filesByExt,
  copyConfigSync,
  requireFileSync,
} from 'node-karin'
import type { Config } from '../types/config'
import path from 'path'

let cache: Config | undefined

/**
 * @description package.json
 */
export const pkg = () => requireFileSync(`${dirPath}/package.json`)

/** 用户配置的插件名称 */
export const pluginName = pkg().name.replace(/\//g, '-')

export const DATA_DIR = path.join(basePath, pluginName, 'data')

/** 用户配置 */
const dirConfig = `${basePath}/${pluginName}/config`
/** 默认配置 */
const defConfig = `${dirPath}/config`

/**
 * @description 初始化配置文件
 */
copyConfigSync(defConfig, dirConfig, ['.yaml'])

/**
 * @description 配置文件
 */
export const config = (): Config => {
  if (cache) return cache
  const user = requireFileSync(`${dirConfig}/config.yaml`)
  const def = requireFileSync(`${defConfig}/config.yaml`)
  const result: Config = { ...def, ...user }
  cache = result
  return result
}

/**
 * @description 监听配置文件
 */
setTimeout(() => {
  const list = filesByExt(dirConfig, '.yaml', 'abs')
  list.forEach(file => watch(file, (old, now) => {
    cache = undefined
  }))
}, 2000)
