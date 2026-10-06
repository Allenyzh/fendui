# 接龙分队

基于原版接龙分队页面的 Next.js App Router 重构。使用 Tailwind CSS v4 实现原页面外观，保留随机算法、出场选择、剪贴板回退、使用指南和 Google Analytics 事件。通过 `next-intl` 支持简体中文、英语和法语。

## 运行

```sh
pnpm dev
pnpm build
pnpm build:pages
pnpm check:pages
pnpm lint
pnpm test
```

`pnpm test` 使用 Node.js 自带测试运行器直接加载 TypeScript，需要 Node.js 22.18 或以上。覆盖接龙解析、出场选择、分队规则、语言优先级、词典一致性与复制标题的复数规则；无需额外测试依赖。

## 多语言

页面右上角的下拉选单提供 `中文`、`English`、`Français`。界面、使用指南、剪贴板反馈、队名与复制结果随语言切换；页面标题和 `<html lang>` 同步更新。切换在客户端即时完成，保留输入名单、出场选择、队数与当前随机分队结果。

静态 HTML 使用简体中文。JavaScript 加载后按以下优先级恢复语言：用户上次选择（`team-split-locale` cookie，有效期一年）→ 浏览器 `navigator.languages`（按偏好顺序匹配，支持 `en-US`、`fr-CA` 等地区变体）→ 简体中文。首次 hydration 保持与静态 HTML 一致，随后恢复浏览器偏好，因此可能短暂显示中文。所有语言仍使用 `/`，没有语言路由或跳转。

语言仅影响展示。接龙识别规则与业务数据独立于界面语言：英文或法语界面仍能解析中文接龙，姓名和球员备注原样保留。队服以稳定的颜色标识保存，在展示和生成复制文本时才翻译；提示状态也保存语义 key，由当前语言生成文案。

- `i18n/config.ts`：支持语言、下拉选项名称、cookie key 与浏览器语言匹配。
- `i18n/request.ts`：构建时使用默认语言，不依赖请求头或服务端 cookie。
- `i18n/provider.tsx`、`language-select.tsx`：hydration 后读取浏览器偏好，客户端切换语言、持久化选择和更新页面语言。
- `messages/zh-CN.json`、`en.json`、`fr.json`：按 `App`、`Roster`、`Attendance`、`Results`、`Feedback`、`Kits`、`Guide` 等功能组织词典；使用 ICU 插值、复数与富文本标签。
- `i18n/types.d.ts`：以中文词典约束翻译 key；`i18n/i18n.test.mjs` 检查所有词典的 key、参数和富文本标签一致，并实际格式化消息。

新增语言时，在 `config.ts` 添加语言代码与本语言名称，创建同结构词典并注册到 `messages.ts`，补充需要的浏览器匹配规则和复制标题测试，然后运行 `pnpm test`、`pnpm lint`、`pnpm build`。

## GitHub Pages 发布

`next.config.ts` 开启 `output: "export"`，`pnpm build` 生成 `out/`，无需 Next.js 服务端运行时。`pnpm build:pages` 构建后将完整静态产物同步到仓库根目录，更新 `index.html`、`_next/` 内的 JavaScript/CSS、404 页面和静态数据，并生成 `.nojekyll` 与 `.pages-manifest.json`。再次构建时清理清单中已过期的文件，保留源码和 `CNAME`。

现有 Pages 设置为 **Deploy from a branch → main → / (root)**，自定义域名为 `fendui.allenyzh.com`，所以使用域名根路径，无需 `/fendui` 前缀。改用默认项目地址前必须先调整 `basePath` 并重新构建。

提交 PR 前运行 `pnpm test`、`pnpm lint`、`pnpm build:pages`，从仓库根目录暂存源码与所有生成产物，并将 PR 目标设为 `main`。`pnpm check:pages` 检查源码摘要、产物摘要、`.nojekyll` 和所有 HTML 引用的本地 JavaScript/CSS；源码变更未重新构建或缺少资源会报错。GitHub Actions 在 PR 与 `main` 上执行测试、lint、已提交产物检查与静态构建。合并后由现有 Pages 流程发布。

本地预览：构建后在仓库根目录运行 `python3 -m http.server 8000 --bind 127.0.0.1`，打开 `http://127.0.0.1:8000/`。静态导出不使用 `next start`。

## MVC 分层

- `app/`：页面入口、根布局与元信息；页面与布局保持 Server Components。`globals.css` 只保留 Tailwind 入口、主题与动画配置，`theme.ts` 用完整的 utilities 定义原版明暗配色。
- `features/team-split/model.ts`：纯数据规则，负责接龙解析、备注、队服颜色标识、随机均分、复制文本结构和出场身份匹配，不依赖 React 或浏览器。视图提供当前语言的队名与人数标题。
- `features/team-split/controller.ts`：管理名单、参与状态和结果，响应视图事件。`clipboard.ts`、`feedback.ts`、`analytics.ts` 分别封装浏览器剪贴板、按钮反馈和统计调用。
- `features/team-split/view.tsx` 与 `views/`：Client Component 入口和按功能拆分的视图，通过 props 接收数据与事件。
- `features/team-split/styles.ts`：共享按钮、焦点样式和静态队服色块 utilities，避免重复和动态拼接导致 Tailwind 漏生成样式。
- `features/feature-guide/`：独立的使用指南控制器与视图，使用原来的 localStorage key。

名单普通编辑保留已有出场选择；全选替换粘贴和粘贴按钮视为新接龙。参与人员变化会清除旧结果并提示重新分队；切换队数会立即重新分队。使用 `next-intl` 提供翻译能力，没有引入状态管理库或后端服务。

## 文档依据

已阅读安装版本的 `node_modules/next/dist/docs/`，以及 Next.js 官方的 [项目结构](https://nextjs.org/docs/app/getting-started/project-structure)、[Server 和 Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)、[CSS](https://nextjs.org/docs/app/getting-started/css)、[Script](https://nextjs.org/docs/app/api-reference/components/script) 文档。

样式使用 Tailwind utilities，PostCSS 通过已安装的 `@tailwindcss/postcss` 编译。保留原版 860px / 560px 断点、系统暗色模式与 `data-theme` 覆盖、减少动画设置；不再包含手写组件 CSS 或 inline style。Google 字体沿用原始 stylesheet 地址；统计脚本通过 `next/script` 加载。

Tailwind 实现依据官方 [Next.js 集成](https://tailwindcss.com/docs/installation/framework-guides/nextjs)、[主题](https://tailwindcss.com/docs/theme)、[状态 variants](https://tailwindcss.com/docs/hover-focus-and-other-states)、[动画](https://tailwindcss.com/docs/animation) 文档。
