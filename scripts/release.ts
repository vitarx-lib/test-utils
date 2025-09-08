#!/usr/bin/env ts-node

import { execSync } from 'node:child_process'
import fs from 'node:fs'

function run(cmd: string) {
  console.log(`\n▶ ${cmd}`)
  execSync(cmd, { stdio: 'inherit' })
}

// 检查 git 状态
const gitStatus = execSync('git status --porcelain').toString().trim()
if (gitStatus) {
  console.error('❌ 请先提交或暂存当前更改再发布。')
  process.exit(1)
}

// 获取版本类型参数 patch minor major
const type = process.argv[2] || 'patch' // 默认 patch

// 更新版本号（但不打 git tag）
run(`pnpm version ${type} --no-git-tag-version`)

// 读取新版本号
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
const newVersion: string = pkg.version
console.log(`\n📦 新版本: v${newVersion}`)

// 生成 CHANGELOG
run(
  `conventional-changelog -p angular -i CHANGELOG.md -s -r 0`
)

// 构建（会跑 prepublishOnly）
run('pnpm build')

// 提交更新并打 tag
run('git add package.json CHANGELOG.md')
run(`git commit -m "build(test-utils): v${newVersion}"`)
run(`git tag -a v${newVersion} -m "Releases ${newVersion}"`)

// 发布到 npm
run('pnpm publish --access=public --registry https://registry.npmjs.org/')

// 推送到远程仓库
run('git push && git push --tags')

console.log(`\n✅ 发布完成 v${newVersion}`)
