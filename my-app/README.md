# 接龙分队

基于父目录 `index.html` 的 Next.js App Router 重构。使用已安装的 Tailwind CSS v4 实现原页面外观，保留字体、文案、随机算法、出场选择、剪贴板回退、使用指南和 Google Analytics 事件。

## 运行

```sh
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm test
```

`pnpm test` 使用 Node.js 自带测试运行器直接加载 TypeScript，需要 Node.js 22.18 或以上；无需额外测试依赖。

## MVC 分层

- `app/`：页面入口、根布局与元信息；页面与布局保持 Server Components。`globals.css` 只保留 Tailwind 入口、主题与动画配置，`theme.ts` 用完整的 utilities 定义原版明暗配色。
- `features/team-split/model.ts`：纯数据规则，负责接龙解析、备注、队服颜色、随机均分、复制文本和出场身份匹配，不依赖 React 或浏览器。
- `features/team-split/controller.ts`：管理名单、参与状态和结果，响应视图事件。`clipboard.ts`、`feedback.ts`、`analytics.ts` 分别封装浏览器剪贴板、按钮反馈和统计调用。
- `features/team-split/view.tsx` 与 `views/`：Client Component 入口和按功能拆分的视图，通过 props 接收数据与事件。
- `features/team-split/styles.ts`：共享按钮、焦点样式和静态队服色块 utilities，避免重复和动态拼接导致 Tailwind 漏生成样式。
- `features/feature-guide/`：独立的使用指南控制器与视图，使用原来的 localStorage key。

名单普通编辑保留已有出场选择；全选替换粘贴和粘贴按钮视为新接龙。参与人员变化会清除旧结果并提示重新分队；切换队数会立即重新分队。没有引入状态管理库、后端服务或新的运行依赖。

## 文档依据

已阅读安装版本的 `node_modules/next/dist/docs/`，以及 Next.js 官方的 [项目结构](https://nextjs.org/docs/app/getting-started/project-structure)、[Server 和 Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)、[CSS](https://nextjs.org/docs/app/getting-started/css)、[Script](https://nextjs.org/docs/app/api-reference/components/script) 文档。

样式使用 Tailwind utilities，PostCSS 通过已安装的 `@tailwindcss/postcss` 编译。保留原版 860px / 560px 断点、系统暗色模式与 `data-theme` 覆盖、减少动画设置；不再包含手写组件 CSS 或 inline style。Google 字体沿用原始 stylesheet 地址；统计脚本通过 `next/script` 加载。

Tailwind 实现依据官方 [Next.js 集成](https://tailwindcss.com/docs/installation/framework-guides/nextjs)、[主题](https://tailwindcss.com/docs/theme)、[状态 variants](https://tailwindcss.com/docs/hover-focus-and-other-states)、[动画](https://tailwindcss.com/docs/animation) 文档。
