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
      data.content = `<div style="font-size: 16px"> Author: @${author} <img src="${icon}" style="width: 16px; height: 16px; vertical-align: middle; border-radius: 20%;"/> </div> ${data.content}`;
    } else {
      data.content = `<div style="font-size: 16px">Author: @${author} </div>${data.content}`;
    }
    return {
      valid: true,
      content: data
    };
  }
}

export default new GithubHandler()