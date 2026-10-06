# 接龙分队

Next.js 源码位于 [`my-app/`](my-app/README.md)。仓库根目录保存 GitHub Pages 直接发布的静态 HTML、JavaScript、CSS 与 `CNAME`。

```sh
cd my-app
pnpm install --frozen-lockfile
pnpm test
pnpm lint
pnpm build:pages
pnpm check:pages
cd ..
git add .
```

将源码和构建产物一起提交 PR，目标为 `main`。Pages 使用 `main` 的根目录，地址是 [fendui.allenyzh.com](https://fendui.allenyzh.com/)。`.nojekyll` 确保 `_next/` 中的资源可以正常发布；`.pages-manifest.json` 和 PR 检查防止首页引用缺失或过期的资源。

生成文件由 `pnpm build:pages` 更新，勿直接编辑。根目录的 `index.js` 是本地命令行示例；页面实际加载的 JavaScript 在 `_next/static/` 中，构建命令会将这些资源一并纳入发布目录。
