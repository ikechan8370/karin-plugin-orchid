![karin-plugin-orchid](https://socialify.git.ci/ikechan8370/karin-plugin-orchid/image?description=1&descriptionEditable=%E9%80%82%E7%94%A8%E4%BA%8EKarin%E6%9C%BA%E5%99%A8%E4%BA%BA%E7%9A%84%E5%85%B0%E6%8F%92%E4%BB%B6%EF%BC%8C%E6%8F%90%E4%BE%9Bmemes%E7%AD%89%E5%A8%B1%E4%B9%90%E5%8A%9F%E8%83%BD%0AOrchid%20plugin%20for%20Karin%20bot%2C%20entertainments%20like%20memes%20are%20provided&font=Jost&forks=1&issues=1&language=1&logo=https%3A%2F%2Fpic.ikechan8370.com%2Fimages%2F2024%2F06%2F18%2F_bc53d366-91c2-4801-a1ee-a5e9107c1fed.png&name=1&owner=1&pattern=Diagonal%20Stripes&pulls=1&stargazers=1&theme=Light)

[Orchid](https://github.com/ikechan8370/karin-plugin-orchid) 兰插件

一些杂七杂八的小功能集合，纯娱乐

## 安装
### 克隆仓库

karin根目录根据你使用的保管理器选择以下命令其中一个安装插件

```bash
pnpm add -w karin-plugin-orchid
```

```bash
npm i karin-plugin-orchid
```

```bash
yarn add karin-plugin-orchid
```

## 功能

### memes
表情包制作，derived from [yunzai-memes](https://github.com/ikechan8370/yunzai-meme)

目前只提供文字帮助：#memes帮助

### 吸猫/撸狗
`#吸猫` `#撸狗` 会发送猫猫狗狗图片

### 今日运气
发送`#今日运气`，即可获得今日的运气。加上pro、promax、promaxultra有惊喜。

### 随机菜谱
发送`#(随机)?菜谱`，即可获得一份随机的菜谱。后面可以接关键词，比如`#菜谱 冰淇淋`。

### 消息推送
基于RSS的消息推送。在配置文件config.yaml中配置rss项目和地址即可获得实时推送，建议结合[rsshub](https://docs.rsshub.app/zh/)使用，获得github、天气、预警信息、b站、tg频道、游戏公告等推送。

配置文件示例
```yaml
rss:
  # 控制检查更新频率
  cron: "*/5 * * * *"
  # 发送主动推送消息的bot，填入字符串qq号，例如["12345667"]
  sender: ["444444444"]
  # 默认发送到哪些群，如["12345678", "23456789"]
  default_group: ["555555555", "555555666"]
  # rsshub地址，可以填自建地址或官方反代，默认是https://rsshub.app
  rsshub_url: https://your-rsshub-url.com
  # 默认图片背景，可以是url或者resources/image下面的图片
  background: https://api.armoe.cn/acg/random
  # 订阅rss列表
  subscribe_list:
    - name: Karin Issue # 名称，必须唯一
      preset: github_issue # 使用预设，支持的预设包括 'github_commit' | 'github_release' | 'github_issue' | 'github_pr' | 'telegram_channel' | 'bilibili_dynamic' | 'earthquake' | 'weather_forecast'
      background: github-logo.jpg # 图片背景，不填将使用默认
      presetConfig: #预设的配置，每个预设有不同的预设格式
        org: KarinJS
        repo: Karin
        type: all # 类型，all open closed
    - name: 全球VPS余量监控
      preset: telegram_channel
      presetConfig:
        channel: vps_spiders
    - name: B站原神官方动态
      preset: bilibili_dynamic
      presetConfig:
        spaceId: 401742377
    - name: 地震预警
      preset: earthquake
    - name: 每日全国天气预报
      preset: weather_forecast
    - name: 海淀天气预警
      url: ${rsshub_url}/nmc/weatheralarm/北京市 # 不使用预设，使用rss的链接。可以使用${rsshub_url}变量引用rsshub地址
      postHandlers: # 后处理器列表，会在拉取到订阅内容后依次处理。目前内置关键词过滤器keyword_filter。可以仿照示例自行编写后处理器放置于lib/rss/handlers下面
        - name: keyword_filter # 关键词过滤后处理器，过滤掉不包含/包含关键词的内容
          args: # 处理器的传参
            mustContain: "海淀"
            mustNotContain: "通州"
      group: ["123456789"]
    - url: ${rsshub_url}/bilibili/live/room/27354807
      name: 鸣潮直播
      group: ["123456789", "1234567891"]
```

## Credit
* [yunzai-memes](https://github.com/ikechan8370/yunzai-meme)
* [meme-generator](https://github.com/MeetWq/meme-generator)
* [Karin](https://karinjs.github.io/Karin/)
