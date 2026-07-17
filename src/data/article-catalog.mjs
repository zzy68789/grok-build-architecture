export const ARTICLE_GROUPS = [
  { key: 'overview', label: '系统总览' },
  { key: 'runtime', label: '运行时与会话' },
  { key: 'tui', label: 'TUI 与渲染' },
  { key: 'agent', label: 'Agent 与上下文' },
  { key: 'workspace', label: '工具与 Workspace' },
  { key: 'operations', label: '安全、扩展与运维' },
];

const overview = 'https://docs.x.ai/build/overview';
const extensions = 'https://docs.x.ai/build/features/skills-plugins-marketplaces';

function define(group, slug, title, description, thesis, stages, failures, boundaries, sourceCrates = [], officialDocs = [overview]) {
  return { group, slug, title, description, thesis, stages, failures, boundaries, sourceCrates, officialDocs };
}

export const ARTICLE_CATALOG = [
  define('overview', 'introduction/what-is-grok-build', '什么是 Grok Build', '从公开 Rust 源码界定 terminal-native agentic coding system 的职责、入口与边界。', 'Grok Build 的核心不是一层终端界面，而是把会话、模型采样、工具执行、权限决策和工作区状态组织成可持续推进的运行系统。', ['终端或协议入口接收意图', 'Session 建立可恢复上下文', 'Sampler 流式产生文本与工具请求', '工具结果回写并驱动下一轮'], ['任一边界失败都会转化为显式事件，而不是悄悄丢失一次 turn', 'UI 退出不等于持久化会话被删除'], ['产品能力以源码基线为准；安装、价格与最新命令以官方文档为准'], ['xai-grok-shell', 'xai-grok-pager', 'xai-grok-tools', 'xai-grok-workspace']),
  define('overview', 'introduction/architecture-overview', '架构全景', '梳理 workspace、核心 crate 和端到端数据流，建立阅读源码的总地图。', 'workspace 通过窄接口把终端、Agent、工具和平台能力分层；真正的耦合点集中在 session、事件协议与共享数据类型。', ['进程初始化基础设施', 'Leader 创建或恢复 Session', 'Agent 组装上下文', '工具通过注册表进入工作区', '事件投影到不同客户端'], ['共享类型漂移会同时破坏客户端与服务端', '长生命周期 actor 需要独立处理取消和背压'], ['架构图表达静态职责；真实运行顺序以对应文章和源码引用为准'], ['xai-grok-shell', 'xai-grok-agent', 'xai-grok-sampler', 'xai-grok-tools', 'xai-grok-workspace']),
  define('overview', 'introduction/workspace-and-crates', 'Rust Workspace 与 Crate 分层', '解释 73 个一方 crate 如何按协议、基础设施、运行时和交互层协作。', '大量小 crate 不是简单拆文件，而是在编译期建立依赖方向：纯类型与协议位于底层，带 I/O 的运行时位于上层，TUI 只消费状态。', ['读取 workspace member', '识别叶子类型 crate', '沿依赖边构建架构层', '检查反向依赖与公共入口'], ['跨层循环依赖会迫使类型回流到错误位置', '测试辅助 crate 不应被误判为产品运行路径'], ['源码图谱覆盖一方 crate；build、prod 与 third_party 在附录单独解释'], ['xai-grok-config-types', 'xai-tool-types', 'xai-tool-protocol', 'xai-grok-shared']),
  define('overview', 'introduction/end-to-end-request', '一次请求的端到端链路', '从用户输入追踪到模型采样、工具调用、工作区变更和最终渲染。', '一次请求不是单个 HTTP 调用，而是一条跨越 UI、Session、Sampler、Tool Runtime 与 Workspace 的事件链，工具结果会再次成为模型上下文。', ['输入变成 prompt 事件', 'Session 创建 turn', 'Sampler 返回增量事件', '工具调用经过权限与调度', '结果进入历史并继续采样', '最终状态投影到客户端'], ['取消必须跨越采样和工具执行传播', '部分工具成功时不能把整轮误标记为无副作用'], ['链路图是基于固定提交的结构化重建；服务器内部实现不在公开源码证明范围内'], ['xai-grok-pager', 'xai-grok-shell', 'xai-grok-sampler', 'xai-tool-runtime', 'xai-grok-workspace']),
  define('overview', 'introduction/process-actor-concurrency', '进程、Actor 与并发模型', '解释进程边界、actor 邮箱、异步任务、取消和背压如何共同工作。', 'Grok Build 以 Tokio 任务和 actor 风格状态所有权减少共享可变状态；并发正确性依赖消息顺序、取消传播和生命周期收敛。', ['入口创建运行时与服务', 'actor 独占可变状态', '调用方通过命令或事件通信', '取消令牌关闭子任务', 'join/cleanup 收敛资源'], ['邮箱阻塞会放大流式延迟', '孤儿任务可能在 Session 结束后继续持有资源'], ['本文区分源码中明确的 actor 与仅具有 actor 行为的异步任务'], ['xai-chat-state', 'xai-grok-sampler', 'xai-agent-lifecycle', 'xai-prompt-queue']),

  define('runtime', 'runtime/startup-and-modes', '启动入口与运行模式', '追踪 TUI、headless、stdio 与 serve 如何汇合到共享进程基础设施。', '多个运行模式共享初始化、配置和 Session 能力，差异主要位于输入输出适配器，而不是复制 Agent 核心。', ['解析命令与环境', '初始化日志和崩溃处理', '选择运行模式', '创建 Leader 或客户端', '进入对应事件循环'], ['无 TTY 环境需要避开交互式假设', '初始化失败必须发生在终端接管之前'], ['公开二进制入口与内部服务入口分开说明，不把实验路径写成稳定产品承诺'], ['xai-grok-pager-bin', 'xai-grok-shell', 'xai-grok-pager-minimal', 'xai-tty-utils']),
  define('runtime', 'runtime/bootstrap-environment-version', 'Bootstrap、环境、路径与版本', '说明配置根目录、环境预设、版本信息和启动前检查怎样形成稳定基座。', '启动阶段先把环境、路径、版本和配置归一化，后续模块因此可以依赖类型化结果而不是重复读取进程环境。', ['确定后端环境', '解析 Grok home 与工作目录', '加载版本和默认模型', '合并配置', '发布给运行时'], ['错误环境可能把请求发送到错误端点', '非 UTF-8 或相对路径需要在边界处拒绝'], ['环境默认值属于当前源码实现，不等价于长期不变的线上配置'], ['xai-grok-env', 'xai-grok-paths', 'xai-grok-version', 'xai-grok-config']),
  define('runtime', 'runtime/leader-session-acp', 'Leader、Session 与 ACP', '解释多客户端如何共享 Agent 状态，以及 ACP 如何承载会话控制与事件。', 'Leader 是会话所有权和客户端接入的协调层；ACP 把会话能力投影给 stdio 或其他客户端，但不接管 Agent 内部状态。', ['客户端完成协议初始化', 'Leader 选择新建或恢复 Session', 'Session 接收 prompt 与控制命令', '事件广播给订阅客户端', '断开时回收客户端资源'], ['客户端断开不能直接杀死仍被共享的 Session', '协议版本或扩展能力不匹配必须显式降级'], ['ACP 是公开协议边界；xAI 服务端未公开部分不作实现推断'], ['xai-acp-lib', 'xai-grok-shell', 'xai-hooks-plugins-types']),
  define('runtime', 'runtime/agentic-loop', 'Agentic Loop', '追踪 Turn、Sampler、流式事件、工具回路和终止条件。', 'Agentic Loop 是由 Session 驱动的多轮状态机：模型事件、工具结果与用户插话共同决定下一次采样，而不是固定次数循环。', ['冻结本轮上下文', '提交采样请求', '消费流式事件', '执行并记录工具调用', '判断继续、完成、取消或失败'], ['预算耗尽需要保留可恢复历史', '工具结果乱序会破坏模型看到的因果关系'], ['终止条件只描述客户端循环；服务端模型内部推理不可见'], ['xai-grok-shell', 'xai-grok-sampler', 'xai-interjection-core']),
  define('runtime', 'runtime/session-chat-journal', 'Session 持久化、Chat State 与 SQLite Journal', '说明会话状态、聊天历史和文件系统感知的 SQLite journal 策略。', '持久化不是事后保存整份对象，而是把聊天状态和会话元数据通过明确边界写入存储，并根据本地盘或网络盘选择安全 journal 模式。', ['加载会话元数据', 'Chat State 接收增量变更', '持久化关键事件', '按文件系统选择 journal', '恢复时重建投影'], ['网络文件系统上的 WAL 共享内存并不安全', '崩溃发生在批次中间时需要从已提交边界恢复'], ['持久化格式可能随版本迁移；本文不承诺跨未知未来版本兼容'], ['xai-chat-state', 'xai-sqlite-journal', 'xai-grok-shell']),
  define('runtime', 'runtime/prompt-queue-interjection', 'Prompt Queue 与 Mid-turn Interjection', '解释排队输入和运行中插话如何进入同一会话而不破坏事件顺序。', 'Prompt Queue 处理 turn 之间的排队，Interjection 处理 turn 内的追加意图；二者必须在明确检查点合并，避免并发修改采样上下文。', ['客户端提交新输入', '判断当前是否正在运行', '排队或写入插话缓冲', '在安全检查点格式化', '合入下一次模型输入'], ['重复消费会让同一插话出现两次', '无限排队会形成内存和体验背压'], ['插话何时被模型采纳取决于客户端循环检查点，不推断模型服务端行为'], ['xai-prompt-queue', 'xai-interjection-core', 'xai-grok-shell']),
  define('runtime', 'runtime/lifecycle-crash-power', '生命周期、公告、崩溃恢复与系统休眠', '串联 Agent 生命周期、公告状态、崩溃检测以及休眠/唤醒通知。', '长期运行的终端 Agent 必须把正常退出、崩溃重启和系统休眠视为不同事件，并在恢复前重新确认外部资源。', ['注册生命周期观察者', '记录启动与公告状态', '安装平台崩溃处理', '监听休眠边界', '恢复或结束资源'], ['休眠跨越中的计时器和网络连接可能失效', '崩溃处理器自身必须避免复杂分配和锁'], ['平台信号能力不同，Windows、macOS 与 Linux 路径分别核验'], ['xai-agent-lifecycle', 'xai-crash-handler', 'xai-grok-announcements', 'xai-system-power']),

  define('tui', 'runtime/tui-architecture', 'TUI Action、Dispatch 与 Effect', '拆解 Action、Dispatch、Effect 和可测试状态变更边界。', 'TUI 通过 Action 描述意图、Dispatch 推进状态、Effect 承载 I/O，把纯状态转换与异步副作用分开。', ['输入映射为 Action', 'Reducer/Dispatch 更新状态', '生成待执行 Effect', '异步执行副作用', '结果再次进入 Action'], ['Effect 回调过期会覆盖新状态', '直接在渲染中执行 I/O 会破坏可重放性'], ['本文把源码命名与 Elm/Redux 类比时会明确标为推断'], ['xai-grok-pager', 'xai-grok-pager-render']),
  define('tui', 'tui/event-loop-effects', 'Event Loop 与副作用调度', '追踪终端事件、网络事件、计时器和后台结果如何进入统一循环。', '事件循环是不同时间源的仲裁器；公平性、批处理和重绘节流共同决定交互延迟。', ['等待多路事件', '归一化输入', '批量处理状态变更', '调度副作用', '按需重绘'], ['高频流事件可能饿死键盘输入', '阻塞式终端操作会冻结所有交互'], ['调度策略按当前实现说明，不宣称实时系统保证'], ['xai-grok-pager', 'xai-ratatui-inline', 'xai-tty-utils']),
  define('tui', 'tui/chat-view-rendering', 'Chat View、State 与渲染流水线', '解释会话状态如何投影为消息块、工具卡片和终端帧。', 'Chat View 不拥有业务真相，它把 Session 投影转换为稳定布局；增量内容必须在不破坏滚动锚点的前提下更新。', ['读取聊天投影', '构造可见消息节点', '计算布局与滚动范围', '渲染局部组件', '提交终端帧'], ['消息高度变化会造成滚动跳跃', '不可见区域的昂贵布局会浪费每帧预算'], ['视觉结构是客户端实现，不代表协议消息的唯一呈现方式'], ['xai-grok-pager', 'xai-grok-pager-render', 'xai-ratatui-inline']),
  define('tui', 'tui/streaming-markdown', '流式 Markdown 与 Headless Markdown', '分析不完整 Markdown 如何被增量解析、终端渲染并在无 UI 场景复用。', '流式 Markdown 必须接受暂时不闭合的语法；渲染器保留解析状态，headless 层复用相同配置做结构判断。', ['接收文本增量', '维护未完成块', '运行统一解析配置', '转换为终端样式', '完成后固化结果'], ['未闭合代码围栏可能吞掉后续正文', '宽字符和 ANSI 样式会影响实际列宽'], ['Markdown 方言以共享解析配置为准，不与浏览器 CommonMark 渲染完全等同'], ['xai-grok-markdown', 'xai-grok-markdown-core']),
  define('tui', 'tui/mermaid-rendering', 'Mermaid 渲染链路', '追踪 Mermaid 源码、布局引擎、SVG/位图转换和终端展示。', '终端无法直接执行浏览器 Mermaid，因此源码通过可替换引擎生成图形，再以适合终端的位图或降级文本呈现。', ['识别 Mermaid 代码块', '调用布局与 SVG 引擎', '栅格化输出', '缓存或返回图片', '失败时保留源码'], ['不受信任图形源码需要限制资源消耗', '字体和布局差异可能改变图尺寸'], ['第三方布局算法在附录说明，本文聚焦一方封装和失败降级'], ['xai-grok-mermaid', 'xai-grok-markdown']),
  define('tui', 'tui/terminal-components-input', '终端组件、输入框与 Inline UI', '解析 textarea、inline ratatui、选择区和输入编辑的组合方式。', '输入组件需要同时处理字符、字素、显示宽度和终端区域；复用组件把这些低层约束从业务页面隔离。', ['终端事件进入组件', '按字素更新编辑状态', '计算光标和选择区', '在限定区域布局', '产生高层提交动作'], ['Unicode 字节索引与显示列混用会越界', '粘贴大文本会阻塞逐字符路径'], ['快捷键受终端和平台影响，实际用户操作以官方手册为准'], ['xai-ratatui-textarea', 'xai-ratatui-inline', 'xai-grok-pager']),
  define('tui', 'tui/pty-tty-minimal-client', 'PTY、TTY 与 Minimal Client', '说明无头 PTY 控制、TTY 安全进程和最小客户端如何支持测试与降级。', 'PTY 把交互式终端变成可编程字节流；TTY 工具负责子进程边界，Minimal Client 提供更小的运行面用于验证和非完整 UI 场景。', ['创建伪终端', '生成隔离进程组', '读取终端字节流', '解析屏幕或协议结果', '退出时回收整个进程树'], ['子进程继承控制终端会触发交互式 pager', '只杀父进程可能遗留后台子进程'], ['PTY harness 属于测试基础设施，但其协议边界可解释真实 TTY 行为'], ['ptyctl', 'ptyctl-cli', 'xai-tty-utils', 'xai-grok-pager-minimal']),

  define('agent', 'agent/definition-prompt-assembly', 'Agent 定义与 Prompt Assembly', '解释 Agent 定义解析、角色配置和 system prompt 组装。', 'Agent 不是单一提示词字符串，而是定义、工具能力、项目规则、运行模式和会话上下文的确定性组合。', ['解析 Agent 定义', '解析 persona 与覆盖项', '装配系统指令', '加入工具和环境能力', '产出采样请求'], ['非确定合并顺序会让同一项目得到不同提示词', '把秘密或无关文件拼入 prompt 会扩大数据边界'], ['提示词内容可由源码核验，模型如何内部执行不作推断'], ['xai-grok-agent', 'xai-grok-subagent-resolution']),
  define('agent', 'context/system-prompt-and-rules', 'System Prompt、项目规则与配置合并', '追踪 requirements、用户配置、AGENTS.md 和工作区上下文的优先级。', '项目规则在进入模型前经过发现、作用域判断和有序合并；越靠近工作目录的规则只影响其覆盖范围。', ['读取受管要求', '加载用户配置', '向上发现项目规则', '按作用域合并', '装配最终上下文'], ['错误缓存会在切换目录后继续使用旧规则', '规则冲突若不保留来源将难以解释'], ['配置键的使用方式以官方文档为准；本文解释内部合并链路'], ['xai-grok-config', 'xai-grok-agent', 'xai-grok-workspace']),
  define('agent', 'agent/sampler-actor-streaming-retry', 'Sampler Actor、流式事件与重试', '深入 actor 命令、HTTP 流、重试边界和采样事件转换。', 'Sampler 独占请求状态并把网络流归一化为领域事件；重试只能发生在不会重复提交不可逆结果的边界。', ['接收采样命令', '建立认证 HTTP 请求', '消费 SSE/流响应', '转换为采样事件', '按错误类别重试或结束'], ['首字节前失败与流中断不能使用同一重试策略', '取消后仍写入事件会污染下一轮'], ['服务端限流和模型策略属于外部系统，只记录客户端可观察响应'], ['xai-grok-sampler', 'xai-grok-http', 'xai-circuit-breaker']),
  define('agent', 'agent/sampling-wire-model-catalog', 'Sampling Wire Types 与模型目录', '说明纯数据类型、模型 ID 和采样协议如何隔离网络与业务层。', 'Wire types 保持序列化稳定，模型目录集中提供默认 ID；业务层因此不需要散落字符串和传输字段判断。', ['选择模型与能力', '构造纯请求类型', '序列化到传输层', '解析流式响应类型', '映射为领域事件'], ['未知字段和新事件需要向前兼容', '模型默认值变化不能悄悄改写已有会话'], ['模型可用性与价格始终以官方服务为准'], ['xai-grok-sampling-types', 'xai-grok-models']),
  define('agent', 'agent/http-auth-circuit-breaker', 'HTTP、Auth 与 Circuit Breaker', '解释共享客户端、认证反转接口和熔断器怎样限制故障扩散。', 'HTTP 层统一连接、User-Agent 和超时；Auth 通过 trait 注入凭据；Circuit Breaker 在连续失败时阻止无意义请求风暴。', ['构造共享客户端', '凭据提供者注入认证', '发送带超时请求', '记录成功或失败', '熔断、探测并恢复'], ['凭据刷新并发会形成惊群', '熔断统计粒度过粗会误伤健康端点'], ['不展示凭据值；认证支持范围以官方登录文档为准'], ['xai-grok-http', 'xai-grok-auth', 'xai-circuit-breaker']),
  define('agent', 'context/compaction-and-token-budget', '上下文压缩与 Token 预算', '追踪预算估算、压缩触发、摘要提交和失败回退。', '压缩是带提交点的上下文变换：先估算预算，再生成摘要，只有摘要可用时才替换旧上下文，失败则保留原历史。', ['估算当前 token', '计算安全余量', '选择压缩范围', '生成并验证摘要', '原子提交或回退'], ['低估 token 会在请求边界失败', '摘要失败不能先删除原消息'], ['token 估算是近似值；服务端最终计费和限制以官方说明为准'], ['xai-grok-compaction', 'xai-token-estimation', 'xai-grok-shell']),
  define('agent', 'context/cross-session-memory', '跨会话 Memory、检索与 Dream', '解释记忆存储、切分、Embedding、检索和 Dream 后台整理。', 'Memory 将会话信息转化为可检索片段，并在新会话中按相关性受控注入；Dream 是异步整理而非第二个主会话。', ['提取候选记忆', '切分并生成向量', '持久化索引', '按查询检索', '后台 Dream 合并或清理'], ['错误记忆会跨会话放大', '后台整理与前台写入需要一致性边界'], ['记忆内容涉及隐私，本文只解释本地公开实现和数据路径'], ['xai-grok-memory']),
  define('agent', 'agents/subagents-and-background-tasks', '子 Agent、后台任务与 Resolution', '追踪子 Agent 规格合并、任务调度、结果回传和资源回收。', '子 Agent 通过解析后的不可变规格启动，后台任务由父会话持有句柄；结果必须带身份和生命周期信息回到协调器。', ['合并 persona/role/override', '创建隔离任务上下文', '启动后台执行', '监控状态和输出', '汇总结果并回收'], ['父会话退出时孤儿任务必须有明确策略', '多个子 Agent 修改同一工作区会产生冲突'], ['多 Agent 策略属于客户端协调，不能据此推断模型之间存在隐藏通信'], ['xai-grok-subagent-resolution', 'xai-grok-tools', 'xai-agent-lifecycle']),
  define('agent', 'agent/voice-dictation', 'Voice Dictation', '说明流式语音输入如何连接设备、STT 传输和文本编辑状态。', 'Voice 模块把音频采集与文本输入解耦，通过流式 STT 事件更新可编辑草稿，而不是绕过正常 prompt 提交流程。', ['打开音频输入', '编码并发送流', '接收部分与最终转写', '更新输入草稿', '由用户确认提交'], ['设备权限和采样率错误需要可恢复提示', '部分转写不能重复追加到最终文本'], ['语音服务可用区域和隐私政策以官方说明为准'], ['xai-grok-voice']),

  define('workspace', 'tools/tool-system', 'Tool Registry、Search Index 与 Bridge', '解释工具注册、索引、选择以及本地与 Hub 工具桥接。', '工具不是硬编码分支集合：描述进入注册表和搜索索引，调用经统一运行时分派，桥接器把外部工具适配为相同契约。', ['发现并注册工具', '构建描述搜索索引', '模型选择工具', '运行时解析实现', '返回结构化结果'], ['重复名称会产生解析歧义', '注册成功不等于运行时依赖可用'], ['工具发现与实际授权是两个独立边界'], ['xai-tool-runtime', 'xai-grok-tools', 'xai-computer-hub-core']),
  define('workspace', 'tools/contract-protocol-runtime-api', 'Tool Contract、Protocol、Runtime 与 API', '分解 Tool trait、wire protocol、错误分类、通知和 Protobuf API。', '工具体系把描述类型、传输协议、执行 trait 和生成 API 分层，使进程内工具与远程工具共享语义而不共享实现。', ['声明工具描述与输入 schema', '编码协议请求', '分派到 Tool trait', '产生通知和结果', '编码稳定响应'], ['协议错误与工具业务错误必须区分', 'schema 漂移会造成运行前无法发现的调用失败'], ['wire 类型稳定性高于具体工具实现，版本兼容在边界处处理'], ['xai-tool-types', 'xai-tool-protocol', 'xai-tool-runtime', 'xai-grok-tools-api']),
  define('workspace', 'tools/file-search-edit', '文件、搜索与编辑工具', '追踪文件读取、代码搜索、补丁应用和 hunk 归因。', '文件工具应把路径解析、访问跟踪、内容变更和差异归因分开，确保模型看到的结果与工作区真实状态一致。', ['解析工作区相对路径', '执行读取或搜索', '构造编辑补丁', '原子写入并追踪 hunk', '返回结构化摘要'], ['符号链接可能逃逸工作区边界', '并发外部编辑会让补丁上下文过期'], ['本文只描述工具实现，不建议绕过权限或版本控制'], ['xai-grok-tools', 'xai-file-utils', 'xai-hunk-tracker']),
  define('workspace', 'tools/shell-process-pty-background', 'Shell、Process、PTY 与后台命令', '解释命令构造、进程组、PTY 会话、输出流和后台生命周期。', 'Shell 工具把命令执行视为长期资源：进程组、输出通道、TTY 模式和取消句柄必须一起管理。', ['解析命令与工作目录', '选择 pipe 或 PTY', '创建进程组', '流式收集输出', '取消、等待并回收'], ['仅终止 shell 可能遗留孙进程', '无限输出需要背压和截断策略'], ['OS shell 语义与沙箱支持存在平台差异'], ['xai-grok-shell-base', 'xai-grok-tools', 'ptyctl', 'xai-tty-utils']),
  define('workspace', 'tools/task-scheduler-monitor-plan', 'Task、Scheduler、Monitor 与 Plan Tools', '说明长任务、计划状态、监控事件和后台结果如何被工具化。', '任务工具把异步工作暴露成可查询状态，而计划工具提供用户可见的结构化进度；两者不能用文本日志替代。', ['创建任务或计划', '调度后台执行', '发布状态变化', '监控器聚合输出', '完成、阻塞或取消'], ['状态机允许非法跳转会产生假完成', '监控器丢事件会让 UI 永久等待'], ['计划是协调数据，不扩大工具原有权限'], ['xai-grok-tools', 'xai-agent-lifecycle', 'xai-prompt-queue']),
  define('workspace', 'tools/computer-hub', 'Computer Hub Core、SDK 与 MCP Adapter', '解释 Hub 的传输、注册表、连接池、重连和 MCP 适配。', 'Computer Hub 提供独立于具体 Agent 的工具平面；Core 定义抽象，SDK 管连接，MCP Adapter 把发现结果注册为原生 Hub 工具。', ['建立 Hub 连接', '注册或发现工具', '解析目标工具服务器', '通过连接池调用', '断线后透明重连'], ['重连后旧调用不能被重复提交', '远程工具描述变化需要刷新索引'], ['Hub 是工具传输层，不替代权限策略'], ['xai-computer-hub-core', 'xai-computer-hub-sdk', 'xai-computer-hub-mcp-adapter']),
  define('workspace', 'workspace/fs-discovery-rules', 'Workspace FS、Discovery 与项目规则', '说明工作区根、文件访问、忽略规则和项目规则发现。', 'Workspace FS 先建立可信根目录，再把发现、读取和规则作用域绑定到该根，其他模块不直接拼接任意系统路径。', ['确定 workspace root', '加载 ignore 与发现配置', '枚举文件和项目标记', '解析规则作用域', '提供类型化文件接口'], ['根目录识别错误会扩大访问范围', '大仓库全量遍历需要忽略和取消'], ['文件系统大小写、符号链接和权限按平台分别处理'], ['xai-grok-workspace', 'xai-grok-paths']),
  define('workspace', 'workspace/execution-vcs-fsevents-status', 'Workspace Execution、VCS、FS Events 与 Gix Status', '串联命令执行、版本控制状态、语义文件事件和线程预算。', '工作区通过统一执行层观察命令和文件变化，VCS 状态把外部修改与 Agent 修改重新汇合为可解释状态。', ['启动受控执行', '监听语义 FsEvent', '刷新 Git 状态', '控制 gix 工作线程预算', '向 Session 发布变更'], ['事件风暴需要合并而不能逐个全量刷新', '进程线程上限可能让状态扫描直接 abort'], ['Git 状态是工作区观察，不等于自动提交或恢复授权'], ['xai-grok-workspace', 'xai-fsnotify', 'xai-gix-status']),
  define('workspace', 'workspace/codebase-graph', 'Codebase Graph', '解释 tree-sitter 查询、增量索引和代码关系图的生成。', 'Codebase Graph 把源码文件解析为符号与关系，而不是把全文搜索包装成图；查询、语言支持和缓存决定图的边界。', ['枚举支持文件', '按语言运行 tree-sitter query', '提取符号与边', '更新图索引', '向工具返回相关子图'], ['语法错误和生成代码会降低关系准确率', '全量重建在大仓库中成本过高'], ['关系图是静态分析结果，不保证等同运行时调用'], ['xai-codebase-graph']),
  define('workspace', 'agents/worktree-checkpoint-hunk', 'Worktree、Checkpoint 与 Hunk Tracking', '解释 CoW worktree、检查点和代码 hunk 归因怎样支持隔离与恢复。', '隔离工作树负责空间边界，Checkpoint 负责可恢复时间点，Hunk Tracker 负责变更来源；三者解决的是不同问题。', ['创建 CoW worktree', '记录初始 checkpoint', '观察并归因 hunk', '比较外部与 Agent 修改', '按明确操作恢复'], ['恢复不能覆盖未归因的用户修改', 'worktree 元数据和实际目录可能失配'], ['恢复操作具有破坏性，必须由明确用户动作触发'], ['xai-fast-worktree', 'xai-hunk-tracker', 'xai-grok-workspace']),
  define('workspace', 'workspace/remote-client-wire-types', 'Remote Workspace Client 与 Wire Types', '说明代理模式下 workspace RPC、分块事件和客户端恢复。', 'Remote Workspace 把本地 FS/VCS/执行能力投影为类型化 RPC；客户端依赖共享 wire types 保持请求、chunk 和事件顺序。', ['构造 workspace 请求', '通过 Hub 代理发送', '接收分块响应', '转换为本地领域结果', '断线时重新建立连接'], ['分块丢失或乱序会破坏文件与命令结果', '远端路径不能被当成本地路径直接解释'], ['远程能力取决于部署端，源码只证明客户端和共享类型'], ['xai-grok-workspace-client', 'xai-grok-workspace-types']),

  define('operations', 'safety/permission-plan-sandbox', 'Permission、Auto、Plan 与 OS Sandbox', '拆解用户授权、自动模式、计划模式和内核沙箱的多层边界。', 'Permission 决定是否允许动作，Auto/Plan 决定交互策略，OS Sandbox 限制进程实际能力；任何一层都不能代替其他层。', ['工具提出带风险动作', '策略计算是否需询问', '用户或模式作出决策', '沙箱构造最小能力环境', '执行并记录结果'], ['仅靠提示词不能形成安全边界', '沙箱初始化失败必须默认拒绝或明确降级'], ['平台沙箱能力不同；本文不提供绕过方式'], ['xai-grok-sandbox', 'xai-grok-tools', 'xai-grok-shell']),
  define('operations', 'safety/secrets-outbound-boundary', 'Secrets 与 Outbound Data Boundary', '解释出站遥测、错误上报和产品事件之前的秘密清洗。', '秘密防护应位于每条出站边界之前，以集中 sanitizer 处理文本和结构化字段，而不是要求所有调用者记住手工遮盖。', ['收集候选遥测或错误', '序列化前识别敏感模式', '替换或删除字段', '限制附加上下文', '发送清洗后的事件'], ['新凭据格式可能未被已有正则识别', '先序列化日志再清洗会留下本地副本'], ['正则清洗是纵深防御，不等于允许上传任意工作区内容'], ['xai-grok-secrets', 'xai-grok-telemetry', 'xai-mixpanel']),
  define('operations', 'extensibility/mcp-integration', 'MCP Transport 与生命周期', '追踪 MCP 传输建立、Server 生命周期、工具发现和调用。', 'MCP 集成同时管理进程/网络传输和工具目录；连接建立、初始化、发现、调用与关闭必须遵守协议顺序。', ['解析 Server 配置', '启动 stdio 或网络传输', '完成 initialize', '发现并注册工具', '调用、通知并关闭'], ['Server 崩溃需要从工具目录移除过期能力', '传输关闭时在途调用必须得到明确失败'], ['MCP 协议能力与 Grok Build 产品支持范围分别说明'], ['xai-grok-mcp', 'xai-computer-hub-mcp-adapter'], [overview, extensions]),
  define('operations', 'extensibility/mcp-oauth-credential-catalog', 'MCP OAuth、Credential 与 Catalog', '说明 OAuth 编排、凭据存储和受管 MCP catalog 缓存。', 'OAuth 状态、凭据材料和 Server catalog 有不同生命周期；Session 支持层只暴露可用连接信息，不泄漏原始凭据。', ['读取受管 catalog', '检查 credential 状态', '发起 OAuth 流', '安全保存令牌', '刷新缓存并连接 Server'], ['OAuth state 不匹配必须拒绝回调', '缓存过期会展示已撤销 Server'], ['凭据存储和浏览器登录受平台能力约束'], ['xai-grok-mcp', 'xai-grok-shell-session-support']),
  define('operations', 'extensibility/hooks-runtime', 'Hooks Runtime', '解释文件发现、命令执行、策略拦截和 hook 结果传播。', 'Hooks 是执行边界而非简单脚本列表：发现结果先经过信任和匹配，再在受控环境运行，并把允许、拒绝或修改结果返回调用链。', ['发现 hook 定义', '解析事件匹配规则', '建立受控命令环境', '执行并收集结果', '应用策略或继续默认路径'], ['超时 hook 不能永久阻塞 Agent', '未受信任仓库 hook 不能自动获得执行权'], ['Hook 命令具有本地副作用，启用方式以官方文档为准'], ['xai-grok-hooks', 'xai-hooks-plugins-types'], [extensions]),
  define('operations', 'extensibility/skills-plugins-hooks', 'Skills、Plugins、Marketplace 与 Extension DTO', '串联扩展发现、信任、Marketplace 元数据和 ACP wire DTO。', 'Skill 提供上下文与流程，Plugin 聚合扩展能力，Marketplace 负责分发元数据，DTO 只负责跨边界传输；四者不应混为一个加载器。', ['发现本地或市场扩展', '解析 manifest 与能力', '检查来源和信任', '装配 Skill/Plugin', '通过 DTO 暴露给客户端'], ['同名扩展需要确定覆盖规则', '市场元数据不能被当作已执行代码的可信证明'], ['不复制官方完整安装手册，只解释当前源码加载链路'], ['xai-grok-plugin-marketplace', 'xai-hooks-plugins-types', 'xai-grok-agent'], [extensions]),
  define('operations', 'operations/telemetry-tracing-macros', 'Telemetry、Mixpanel、Tracing 与 Macros', '区分产品事件、错误上报、内部 tracing 和计时宏。', '可观测性分为用户行为事件、错误诊断和进程内 tracing；共享宏统一时间与字段，但数据出站前仍需清洗。', ['创建结构化 span', '记录产品或性能事件', '宏补充时间字段', '秘密清洗', '发送或落本地诊断'], ['高基数字段会增加成本和泄漏风险', '遥测失败不能阻塞核心 Agent 流程'], ['不推断线上采样率、保留期限或仪表盘配置'], ['xai-grok-telemetry', 'xai-mixpanel', 'xai-tracing', 'xai-tracing-macros']),
  define('operations', 'operations/shared-foundations', 'Shared Foundations：配置、环境、路径与 Shell Base', '解释 leaf types、共享工具和依赖倒置如何稳定上层 crate。', 'Shared Foundations 将无状态类型和低层能力下沉，使 Shell、Agent、Tools 不必互相依赖；价值在于依赖方向而非代码量。', ['定义叶子配置类型', '建立环境和路径不变量', '封装进程/文件基础能力', '由上层组合而非反向调用', '在边界统一错误'], ['共享 crate 过度膨胀会重新形成隐式单体', '平台分支若泄漏到上层会扩大测试矩阵'], ['共享不等于稳定公共 API，仅描述 workspace 内部边界'], ['xai-grok-shared', 'xai-grok-config-types', 'xai-grok-env', 'xai-grok-paths', 'xai-grok-shell-base']),
  define('operations', 'operations/update-version-announcements-crash', 'Update、Version、Announcements 与 Crash/Power', '说明版本锁步、更新检查、公告展示和异常生命周期的运维闭环。', '版本与更新模块回答“运行的是什么”，公告回答“需要提示什么”，崩溃与电源模块回答“进程为何中断”；它们共同影响恢复但互不替代。', ['读取锁步版本', '检查更新元数据', '选择待展示公告', '记录启动/异常状态', '在恢复后重新核验'], ['更新中断不能破坏当前可执行文件', '公告状态与版本迁移不一致会重复展示'], ['更新渠道和发布节奏以官方发布为准'], ['xai-grok-update', 'xai-grok-version', 'xai-grok-announcements', 'xai-crash-handler', 'xai-system-power']),
];

const primaryRules = [
  [/^xai-grok-pager-render$/, 'tui/chat-view-rendering'],
  [/^xai-grok-pager-pty-harness$/, 'tui/pty-tty-minimal-client'],
  [/^xai-grok-pager-minimal$/, 'tui/pty-tty-minimal-client'],
  [/^xai-grok-pager-bin$/, 'runtime/startup-and-modes'],
  [/^xai-grok-pager$/, 'runtime/tui-architecture'],
  [/^xai-ratatui-textarea$/, 'tui/terminal-components-input'],
  [/^xai-ratatui-inline$/, 'tui/event-loop-effects'],
  [/^xai-grok-markdown-core$/, 'tui/streaming-markdown'],
  [/^xai-grok-markdown$/, 'tui/streaming-markdown'],
  [/^xai-grok-mermaid$/, 'tui/mermaid-rendering'],
  [/^ptyctl-cli$|^ptyctl$|^xai-tty-utils$/, 'tui/pty-tty-minimal-client'],
  [/^xai-acp-lib$/, 'runtime/leader-session-acp'],
  [/^xai-chat-state$|^xai-sqlite-journal$/, 'runtime/session-chat-journal'],
  [/^xai-prompt-queue$|^xai-interjection-core$/, 'runtime/prompt-queue-interjection'],
  [/^xai-agent-lifecycle$|^xai-crash-handler$|^xai-system-power$/, 'runtime/lifecycle-crash-power'],
  [/^xai-grok-announcements$/, 'operations/update-version-announcements-crash'],
  [/^xai-grok-agent$/, 'agent/definition-prompt-assembly'],
  [/^xai-grok-subagent-resolution$/, 'agents/subagents-and-background-tasks'],
  [/^xai-grok-sampler$/, 'agent/sampler-actor-streaming-retry'],
  [/^xai-grok-sampling-types$|^xai-grok-models$/, 'agent/sampling-wire-model-catalog'],
  [/^xai-grok-http$|^xai-grok-auth$|^xai-circuit-breaker$/, 'agent/http-auth-circuit-breaker'],
  [/^xai-grok-compaction$|^xai-token-estimation$/, 'context/compaction-and-token-budget'],
  [/^xai-grok-memory$/, 'context/cross-session-memory'],
  [/^xai-grok-voice$/, 'agent/voice-dictation'],
  [/^xai-tool-types$|^xai-tool-protocol$|^xai-tool-runtime$|^xai-grok-tools-api$/, 'tools/contract-protocol-runtime-api'],
  [/^xai-computer-hub-/, 'tools/computer-hub'],
  [/^xai-file-utils$/, 'tools/file-search-edit'],
  [/^xai-grok-tools$/, 'tools/tool-system'],
  [/^xai-fsnotify$|^xai-gix-status$/, 'workspace/execution-vcs-fsevents-status'],
  [/^xai-codebase-graph$/, 'workspace/codebase-graph'],
  [/^xai-fast-worktree$|^xai-hunk-tracker$/, 'agents/worktree-checkpoint-hunk'],
  [/^xai-grok-workspace-client$|^xai-grok-workspace-types$/, 'workspace/remote-client-wire-types'],
  [/^xai-grok-workspace$/, 'workspace/fs-discovery-rules'],
  [/^xai-grok-sandbox$/, 'safety/permission-plan-sandbox'],
  [/^xai-grok-secrets$/, 'safety/secrets-outbound-boundary'],
  [/^xai-grok-mcp$/, 'extensibility/mcp-integration'],
  [/^xai-grok-shell-session-support$/, 'extensibility/mcp-oauth-credential-catalog'],
  [/^xai-grok-hooks$/, 'extensibility/hooks-runtime'],
  [/^xai-grok-plugin-marketplace$|^xai-hooks-plugins-types$/, 'extensibility/skills-plugins-hooks'],
  [/^xai-grok-telemetry$|^xai-mixpanel$|^xai-tracing$|^xai-tracing-macros$/, 'operations/telemetry-tracing-macros'],
  [/^xai-grok-update$|^xai-grok-version$/, 'operations/update-version-announcements-crash'],
  [/^xai-grok-config$|^xai-grok-config-types$|^xai-grok-env$|^xai-grok-paths$|^xai-grok-shared$|^xai-grok-shell-base$/, 'operations/shared-foundations'],
  [/^xai-grok-shell$/, 'runtime/agentic-loop'],
  [/^xai-grok-test-support$|^xai-test-utils$/, 'introduction/workspace-and-crates'],
];

export function primaryArticleForCrate(crateName) {
  return primaryRules.find(([pattern]) => pattern.test(crateName))?.[1] ?? 'introduction/architecture-overview';
}

export function articleBySlug(slug) {
  return ARTICLE_CATALOG.find((article) => article.slug === slug);
}
