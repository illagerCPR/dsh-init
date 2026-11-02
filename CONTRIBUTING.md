# Development

面向维护者。用户安装与使用见 [README](README.md)。

## 结构

| 文件 | 作用 |
| --- | --- |
| `index.js` | Host 插件：`inject = ['commands']`，注册全局 `/init`，把提示词作为 follow-up 用户消息交给智能体 |
| `lib/prompt.js` | 读取 `prompt.md`，替换 `{{cwd}}` 与 `{{focus}}` |
| `prompt.md` | 提示词模板；改提示词只动这里 |
| `cordis.patch.yml` | bundle 补丁：`insert` 一行 Host 插件（id `dsh-init`） |
| `locale/{en,zh}.json` | 插件管理器里的标题与描述 |
| `icon.svg` | 插件图标 |
| `test/command.test.js` | 命令注册、消息构造、占位符替换的单元测试 |

`package.json` 的 `files` 决定 npm 包里实际带什么；新增运行期文件时要同步更新 `files` 与发布工作流里的打包检查。

## 本地检查

```sh
npm test
node -e "import('./index.js').then(m => console.log(typeof m.apply))"
```

没有依赖、没有构建步骤；测试直接跑源码。

## 本地安装

用插件管理器安装这个目录（等价于 `plugin_manager` 的 `install_bundle` + 绝对路径），或用 Web 插件页的目录安装。安装后：

- 输入 `/` 应能看到 `/init`，描述是 “Create or update AGENTS.md for this repository”；
- 真正发送一次 `/init` 会启动一轮模型对话，测试时请在临时目录里进行，避免在本仓库执行提示词。

## 发布

1. `npm test`，并把 `package.json` 的 `version` 提升到目标版本。
2. 提交，打签名 tag `vX.Y.Z`，推送 tag：

   ```sh
   git tag -s vX.Y.Z -m "vX.Y.Z"
   git push origin vX.Y.Z
   ```

3. GitHub Actions 的 `publish.yml` 校验 tag 与 manifest 一致、跑测试、检查 tarball 内容，然后以 OIDC provenance 发布。版本已在 registry 上时工作流直接跳过。
4. 首次发布（0.1.0）必须在本地完成，因为 npm 的可信发布要求包已经存在：

   ```sh
   npm publish --access public
   ```

   然后到 npm 包的 Settings → Trusted Publisher 配置 GitHub Actions：仓库 `illagerCPR/dsh-init`、workflow 文件名 `publish.yml`、environment 留空。

发布前确认 `npm pack --dry-run --json` 中的文件列表包含 `prompt.md`、`lib/`、`cordis.patch.yml`、locale 与图标。
