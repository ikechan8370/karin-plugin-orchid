import { GithubClient } from './client.js'
import fs from 'fs'

const dataFilePath = 'data/karin-plugin-orchid/github_issues.json'
/**
 *
 * @param fullRepo
 * @returns {{
 *   lastUpdatedIssue?: {
 *     id: number,
 *     updated_at: string
 *   },
 *   issues_comment: Map<number, string>
 * } | null} issues_comment 的key是issue的id，value是最新的comment的created_at
 */
const loadStoredData = (fullRepo: string): {
  lastUpdatedIssue?: {
    id: number
    updated_at: string
  }
  issues_comment: Map<number, string>
} | null => {
  if (fs.existsSync(dataFilePath)) {
    const rawData = fs.readFileSync(dataFilePath)
    const json = JSON.parse(String(rawData))
    return json[fullRepo] || {}
  } else {
    return null
  }
}

const saveStoredData = (data: {
  lastUpdatedIssue?: {
    id: number
    updated_at: string
  } | undefined
  issues_comment: Map<number, string>
}, fullRepo: string) => {
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, '{}')
  }
  const rawData = fs.readFileSync(dataFilePath)
  const json = JSON.parse(String(rawData))
  json[fullRepo] = data
  fs.writeFileSync(dataFilePath, JSON.stringify(json, null, 2))
}

/**
 * 检查新的issue comment
 * @param org
 * @param repo
 * @param key
 * @return {Promise<Timeline[]>}
 */
export async function checkIssueComment (org: string, repo: string, key: string) {
  const client = new GithubClient(key)
  const issues = await client.getIssues({
    state: 'all',
    sort: 'open',
  }, org, repo) as any[]

  const results = []
  const fullRepoName = `${org}/${repo}`
  let storedData = loadStoredData(fullRepoName)
  if (!storedData) {
    // 第一次，只存储
    storedData = {
      issues_comment: new Map(),
    }
    storedData.lastUpdatedIssue = {
      id: issues[0].id,
      updated_at: issues[0].updated_at
    }
    for (const issue of issues) {
      const comments = await client.getIssueTimeline(issue.number, org, repo) as any[]
      // comments按照created_at从新到旧排序
      comments.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      if (comments.length > 0) {
        storedData.issues_comment.set(issue.id, comments[0].created_at)
      }
    }
    saveStoredData(storedData, fullRepoName)
  }
  // 不是第一次了，检查是否有新的comment
  const lastUpdatedIssue = storedData.lastUpdatedIssue
  let lastUpdatedIssueIndex = issues.findIndex(issue => issue.id === lastUpdatedIssue!.id)
  if (lastUpdatedIssueIndex === -1) {
    // 说明上次记录的issue已经不存在了，从头开始检查
    lastUpdatedIssueIndex = 0
  }
  for (let i = lastUpdatedIssueIndex; i < issues.length; i++) {
    const issue = issues[i]
    const comments = await client.getIssueTimeline(issue.number, org, repo) as any[]
    // comments按照created_at从新到旧排序
    comments.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    if (comments.length > 0) {
      const lastCommentCreatedAt = storedData.issues_comment.get(issue.id)
      // 找到所有新的comments放入results
      for (const comment of comments) {
        if (new Date(comment.created_at) > new Date(lastCommentCreatedAt!)) {
          results.push(comment)
        }
      }
      storedData.issues_comment.set(issue.id, comments[0].created_at)
      saveStoredData(storedData, fullRepoName)
    }
  }
  return results
}
