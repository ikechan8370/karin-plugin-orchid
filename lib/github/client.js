import Cfg from '../../lib/config/config.js'
import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch from 'node-fetch'

export class GithubClient {
    constructor (key) {
        this.key = key
        let proxy = Cfg.Default.proxy
        this.client = {
            request: (url, options = {}) => {
                const defaultOptions = proxy
                    ? {
                        agent: new HttpsProxyAgent(proxy)
                    }
                    : {}
                const mergedOptions = {
                    ...defaultOptions,
                    ...options
                }

                return fetch(url, mergedOptions)
            }
        }
        this.commonHeaders = {
            'X-GitHub-Api-Version': '2022-11-28',
            Accept: 'application/vnd.github+json'
        }
        if (this.key) {
            this.commonHeaders.Authorization = `Bearer ${this.key}`
        }
    }

    /**
     * 获取仓库详情
     * @param owner
     * @param repo
     * @returns {Promise<Object>}
     */
    async getRepository (owner, repo) {
        let res = await this.client.request(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: this.commonHeaders
        })
        return await this.toJson(res)
    }

    /**
     * 获取仓库commits信息
     * @see https://docs.github.com/en/rest/commits/commits?apiVersion=2022-11-28
     * @param owner
     * @param repo
     * @param options 可选参数：since, until, per_page, page, sha等
     * @returns {Promise<Object[]>}
     */
    async getCommits (options = {}, owner, repo) {
        let res = await this.client.request(`https://api.github.com/repos/${owner}/${repo}/commits${this.query(options)}`, {
            headers: this.commonHeaders
        })
        return await this.toJson(res)
    }

    /**
     * 获取仓库某个commit信息
     * @see https://docs.github.com/en/rest/commits/commits?apiVersion=2022-11-28#get-a-commit
     * @param owner
     * @param repo
     * @param sha commit sha
     * @returns {Promise<Object>}
     */
    async getCommitBySha (sha, owner, repo) {
        if (!sha) {
            throw new Error('sha cannot be empty')
        }
        let res = await this.client.request(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}`, {
            headers: this.commonHeaders
        })
        return await this.toJson(res)
    }

    /**
     * 获取仓库releases信息
     * @see https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28
     * @param owner
     * @param repo
     * @param options 可选参数：per_page, page
     * @returns {Promise<Object[]>}
     */
    async getReleases (options = {}, owner, repo) {
        let res = await this.client.request(`https://api.github.com/repos/${owner}/${repo}/releases${this.query(options)}`, {
            headers: this.commonHeaders
        })
        return await this.toJson(res)
    }

    /**
     * 获取仓库action artifacts信息
     * @see https://docs.github.com/en/rest/actions/artifacts?apiVersion=2022-11-28
     * @param owner
     * @param repo
     * @param options 可选参数：per_page, page, name
     * @returns {Promise<Object[]>}
     */
    async getActionsArtifacts (options = {}, owner, repo) {
        let res = await this.client.request(`https://api.github.com/repos/${owner}/${repo}/actions/artifacts${this.query(options)}`, {
            headers: this.commonHeaders
        })
        return await this.toJson(res)
    }

    /**
     * @typedef {{
     *   url: string,
     *   repository_url: string,
     *   labels_url: string,
     *   comments_url: string,
     *   events_url: string,
     *   html_url: string,
     *   id: number,
     *   node_id: string,
     *   number: number,
     *   title: string,
     *   user: {
     *     login: string,
     *     id: number,
     *     node_id: string,
     *     avatar_url: string,
     *     gravatar_id: string,
     *     url: string,
     *     html_url: string,
     *     followers_url: string,
     *     following_url: string,
     *     gists_url: string,
     *     starred_url: string,
     *     subscriptions_url: string,
     *     organizations_url: string,
     *     repos_url: string,
     *     events_url: string,
     *     received_events_url: string,
     *     type: string,
     *     site_admin: boolean
     *   },
     *   labels: Array<{
     *     id: number,
     *     node_id: string,
     *     url: string,
     *     name: string,
     *     color: string,
     *     default: boolean,
     *     description: string
     *   }>,
     *   state: string,
     *   locked: boolean,
     *   assignee: string,
     *   assignees: Array<string>,
     *   milestone: string,
     *   comments: number,
     *   created_at: string,
     *   updated_at: string,
     *   closed_at: string,
     *   author_association: string,
     *   active_lock_reason: string,
     *   body: string,
     *   performed_via_github_app: string,
     *   timeline_url: string,
     *   state_reason: string,
     *   reactions: Reaction,
     *   }} Issues
     */

    /**
     * @typedef {{
     *     url: string,
     *     total_count: number,
     *     '+1': number,
     *     '-1': number,
     *     laugh: number,
     *     hooray: number,
     *     confused: number,
     *     heart: number,
     *     rocket: number,
     *     eyes: number
     *   }} Reaction
     */

    /**
     * 获取仓库的issues
     * @param {{
     *   state?: 'open' | 'closed' | 'all',
     *   sort?: 'created' | 'updated' | 'comments',
     * }} options
     * @param {string} owner
     * @param {string} repo
     * @return {Promise<Issues[]>}
     */
    async getIssues (options = {}, owner, repo) {
        let res = await this.client.request(`https://api.github.com/repos/${owner}/${repo}/issues${this.query(options)}`, {
            headers: this.commonHeaders
        })
        return await this.toJson(res)
    }

    // // 20240818214602
    // // https://api.github.com/repos/ZZZure/ZZZ-Plugin/issues/47/timeline
    //
    // [
    //   {
    //     "url": "https://api.github.com/repos/ZZZure/ZZZ-Plugin/issues/comments/2295172725",
    //     "html_url": "https://github.com/ZZZure/ZZZ-Plugin/issues/47#issuecomment-2295172725",
    //     "issue_url": "https://api.github.com/repos/ZZZure/ZZZ-Plugin/issues/47",
    //     "id": 2295172725,
    //     "node_id": "IC_kwDOLzJzr86IzY51",
    //     "user": {
    //       "login": "bietiaop",
    //       "id": 43831609,
    //       "node_id": "MDQ6VXNlcjQzODMxNjA5",
    //       "avatar_url": "https://avatars.githubusercontent.com/u/43831609?v=4",
    //       "gravatar_id": "",
    //       "url": "https://api.github.com/users/bietiaop",
    //       "html_url": "https://github.com/bietiaop",
    //       "followers_url": "https://api.github.com/users/bietiaop/followers",
    //       "following_url": "https://api.github.com/users/bietiaop/following{/other_user}",
    //       "gists_url": "https://api.github.com/users/bietiaop/gists{/gist_id}",
    //       "starred_url": "https://api.github.com/users/bietiaop/starred{/owner}{/repo}",
    //       "subscriptions_url": "https://api.github.com/users/bietiaop/subscriptions",
    //       "organizations_url": "https://api.github.com/users/bietiaop/orgs",
    //       "repos_url": "https://api.github.com/users/bietiaop/repos",
    //       "events_url": "https://api.github.com/users/bietiaop/events{/privacy}",
    //       "received_events_url": "https://api.github.com/users/bietiaop/received_events",
    //       "type": "User",
    //       "site_admin": false
    //     },
    //     "created_at": "2024-08-18T08:16:07Z",
    //     "updated_at": "2024-08-18T08:16:07Z",
    //     "author_association": "CONTRIBUTOR",
    //     "body": "暂时没有",
    //     "reactions": {
    //       "url": "https://api.github.com/repos/ZZZure/ZZZ-Plugin/issues/comments/2295172725/reactions",
    //       "total_count": 0,
    //       "+1": 0,
    //       "-1": 0,
    //       "laugh": 0,
    //       "hooray": 0,
    //       "confused": 0,
    //       "heart": 0,
    //       "rocket": 0,
    //       "eyes": 0
    //     },
    //     "performed_via_github_app": null,
    //     "event": "commented",
    //     "actor": {
    //       "login": "bietiaop",
    //       "id": 43831609,
    //       "node_id": "MDQ6VXNlcjQzODMxNjA5",
    //       "avatar_url": "https://avatars.githubusercontent.com/u/43831609?v=4",
    //       "gravatar_id": "",
    //       "url": "https://api.github.com/users/bietiaop",
    //       "html_url": "https://github.com/bietiaop",
    //       "followers_url": "https://api.github.com/users/bietiaop/followers",
    //       "following_url": "https://api.github.com/users/bietiaop/following{/other_user}",
    //       "gists_url": "https://api.github.com/users/bietiaop/gists{/gist_id}",
    //       "starred_url": "https://api.github.com/users/bietiaop/starred{/owner}{/repo}",
    //       "subscriptions_url": "https://api.github.com/users/bietiaop/subscriptions",
    //       "organizations_url": "https://api.github.com/users/bietiaop/orgs",
    //       "repos_url": "https://api.github.com/users/bietiaop/repos",
    //       "events_url": "https://api.github.com/users/bietiaop/events{/privacy}",
    //       "received_events_url": "https://api.github.com/users/bietiaop/received_events",
    //       "type": "User",
    //       "site_admin": false
    //     }
    //   }
    // ]
    /**
     * @typedef {{
     *   login: string,
     *   id: number,
     *   node_id: string,
     *   avatar_url: string,
     *   gravatar_id: string,
     *   url: string,
     *   html_url: string,
     *   followers_url: string,
     *   following_url: string,
     *   gists_url: string,
     *   starred_url: string,
     *   subscriptions_url: string,
     *   organizations_url: string,
     *   repos_url: string,
     *   events_url: string,
     *   received_events_url: string,
     *   type: string,
     *   site_admin: boolean
     *   }} GithubUser
     */
    /**
     * @typedef {{
     *   url: string,
     *   html_url: string,
     *   issue_url: string,
     *   id: number,
     *   node_id: string,
     *   user: GithubUser,
     *   created_at: string,
     *   updated_at: string,
     *   author_association: string,
     *   body: string,
     *   performed_via_github_app: string,
     *   event: string,
     *   actor: GithubUser,
     *   reactions: Reaction
     *   }} Timeline
     */


    /**
     * 获取issue详情
     * @param {number} issueNumber
     * @param {string} owner
     * @param {string} repo
     * @return {Promise<Timeline[]>}
     */
    async getIssueTimeline (issueNumber, owner, repo) {
        let res = await this.client.request(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/timeline`, {
            headers: this.commonHeaders
        })
        return await this.toJson(res)
    }

    /**
     * params to query string
     * @param params
     * @param containsQuestionMark 结果前面是否包含?
     * @returns {string}
     */
    query (params, containsQuestionMark = true) {
        if (!params || typeof params !== 'object') {
            return ''
        }
        let q = ''
        Object.keys(params).forEach(k => {
            if (q) {
                q += '&'
            }
            q += `${k}=${params[k]}`
        })
        if (containsQuestionMark) {
            return q ? `?${q}` : ''
        }
        return q
    }

    /**
     *
     * @param {Response} res
     * @returns {Promise<Object | Object[]>}
     */
    async toJson (res) {
        if (res.status === 200) {
            return await res.json()
        } else if (res.status === 429 || (await res.text())?.includes('limited')) {
            throw new Error('Github API 访问速率超限，您可以配置免费的Github personal access token以将访问速率从60/小时提升至5,000/小时')
        }
    }
}
