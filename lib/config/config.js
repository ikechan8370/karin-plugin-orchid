import Yaml from 'yaml'
import fs from 'fs'
import chokidar from 'chokidar'
import { dirPath } from '../imports/dir.js'
import { logger, common } from '#Karin'

/** 配置文件 */
class Config {
  constructor () {
    this.Cfg = {}
    /** 监听文件 */
    this.watcher = { config: {}, defSet: {} }
    this.initCfg()
  }

  /** 初始化配置 */
  initCfg () {
    let path = `${dirPath}/config/config/`
    let pathDef = `${dirPath}/config/defSet/`
    if (!fs.existsSync(path)) common.mkdir(path)
    const files = fs.readdirSync(pathDef).filter(file => file.endsWith('.yaml'))
    for (let file of files) {
      if (!fs.existsSync(`${path}${file}`)) fs.copyFileSync(`${pathDef}${file}`, `${path}${file}`)
    }
  }

  /** 基本配置 */
  get Config () {
    return { ...this.getdefSet('config'), ...this.getConfig('config') }
  }

  /** package.json */
  get package () {
    if (this._package) return this._package
    this._package = JSON.parse(fs.readFileSync(dirPath + '/package.json', 'utf8'))
    return this._package
  }

  /**
   * @param app  功能
   * @param name 配置文件名称
   */
  getdefSet (name) {
    return this.getYaml('defSet', name)
  }

  /** 用户配置 */
  getConfig (name) {
    return this.getYaml('config', name)
  }

  /**
   * 获取配置yaml
   * @param type 默认跑配置-defSet，用户配置-config
   * @param name 名称
   */
  getYaml (type, name) {
    let file = `${dirPath}/config/${type}/${name}.yaml`
    let key = `${type}.${name}`
    if (this.Cfg[key]) return this.Cfg[key]
    this.Cfg[key] = Yaml.parse(fs.readFileSync(file, 'utf8'))
    this.watch(file, name, type)
    return this.Cfg[key]
  }

  /** 监听配置文件 */
  watch (file, name, type = 'defSet') {
    let key = `${type}.${name}`
    if (this.watcher[key]) { return }
    const watcher = chokidar.watch(file)
    watcher.on('change', () => {
      delete this.Cfg[key]
      logger.mark(`[修改配置文件][${type}][${name}]`)
      if (this[`change_${name}`]) this[`change_${name}`]()
    })
    this.watcher[key] = watcher
  }

  async change_config () {
    // 这里可以进行一些配置变更后的操作...
  }
}

export default new Config()
