import { PostHandler } from "../post_handler.js";

class GithubHandler extends PostHandler {
  constructor() {
    super();
    this.name = 'github';
    this.type = 'custom';
  }

  async handle(data, raw, args) {
    const type = args?.type
    console.log(JSON.stringify(data))
    let author = data.author
    if (author && typeof author === 'object') {
      author = author.name
    }
    if (type === 'commit' || type === 'release') {
      const icon = raw["media:thumbnail"][0]["$"]?.url;
      data.content = `作者：<img src="${icon}" style="width: 30px; height: 30px"/> @${author}\n${data.content}`;
    } else {
      data.content = `作者：@${author}\n${data.content}`;
    }
    return {
      valid: true,
      content: data
    };
  }
}

export default new GithubHandler()