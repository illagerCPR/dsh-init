# @illager_aris/dsh-init

在 DSH 聊天输入框里输入 `/init`，让智能体为当前仓库创建或改进 `AGENTS.md`。

## 它做什么

插件只注册一个斜杠命令 `/init`。命令本身不读写任何文件，它把一份 `AGENTS.md` 的调研与写作提示词作为**一条普通用户消息**发给当前智能体，并开始一轮对话。提示词要求智能体：

- 先读 `README`、清单文件、构建 / 测试 / lint / CI 配置、锁文件和已有指令文件；
- 再看少量有代表性的代码，确认真实入口、包边界和执行流程；
- 只写「智能体不看就会猜错」的内容，避免通用建议和长篇教程；
- 如果 `AGENTS.md` 已经存在，就在原文件上改进，而不是推倒重写。

提示词中的仓库路径取自当前会话的工作目录；`AGENTS.md` 由智能体按提示词自己创建或修改。

这份提示词改写自 OpenCode 的 `/init` 工作流，并按 DSH 做了少量调整（工具名、项目内配置习惯、当前会话目录）。

## 安装

```sh
dsh plugin add @illager_aris/dsh-init
```

装好后重启 Host（或按插件页的提示刷新）。打开任意会话，在输入框里输入 `/`，命令列表里应出现 `/init`。

要求：Node ≥ 22.14，DSH ≥ 0.2.1-rc.3 且 < 0.3.0。

## 用法

| 输入 | 结果 |
| --- | --- |
| `/init` | 发送完整提示词，没有额外的关注点。 |
| `/init 重点写清楚测试与发布命令` | 把这段话填进提示词的「User-provided focus or constraints」一节，其余不变。 |

命令结果只显示在界面上，不会进入模型上下文；进入对话的是那条携带提示词的普通用户消息。

## 行为细节

- 智能体正在跑一轮时，消息排在当前轮之后作为下一轮（follow-up），不会打断正在进行的轮次。
- 会话工作目录取自创建会话时的目录；取不到时，提示词里写「the repository root」。
- 全局命令：对 profile 里的每个会话和每个 preset 都可见。若某个 preset 自己注册了同名 `init`，preset 的命令会覆盖它。
- 提示词本身不限制模型能力，也不会阻止模型提问；是否真的创建 `AGENTS.md`、写成什么样，由智能体按提示词执行。

提示词原文见 [`prompt.md`](https://github.com/illagerCPR/dsh-init/blob/main/prompt.md)。

## 卸载

在 Web 侧边栏的「插件」页里移除这个 bundle。只从依赖里删掉包、却在 profile 的 `dsh.profile.bundles` 里留下它，会让 profile 启动时报加载失败。

## 许可

MIT。见 [LICENSE](https://github.com/illagerCPR/dsh-init/blob/main/LICENSE)。
