# 依赖说明

下列均为 **`package.json` 里声明的直接依赖**（不含间接依赖）。版本以仓库内 `package-lock.json` 为准。

---

## 根目录 `addchess/package.json`

根项目 **不声明 runtime 依赖**，仅使用 npm **workspaces** 管理子包。

| 类型 | 名称 | 用途 |
|------|------|------|
| 机制 | `npm workspaces` | 将 `packages/*` 下的包链接到同一 `node_modules`，根脚本用 `-w @addchess/...` 调用子包 |

---

## `packages/core`（`@addchess/core`）

**运行时无 npm 依赖**，逻辑全部为本地 TypeScript 源码。

| 类型 | 包名 | 版本约束（package.json） | 用途 |
|------|------|--------------------------|------|
| devDependency | `typescript` | ^5.9.2 | 类型检查与编辑器支持 |
| devDependency | `vitest` | ^3.2.4 | 单元测试运行器 |
| devDependency | `tsup` | ^8.5.0 | 将 core 打成 `dist/`（ESM + d.ts），可选发布流程 |

测试或构建时 Vitest/tsup 会拉取各自的传递依赖（如 `esbuild`、`vite` 相关），无需手写进 core 的 `package.json`。

---

## `packages/app`（`@addchess/app`）

| 类型 | 包名 | 版本约束 | 用途 |
|------|------|----------|------|
| dependency | `@addchess/core` | `*` | 同一 monorepo 内本地包；npm install 时解析为 workspace 链接 |
| dependency | `react` | ^19.1.0 | UI 框架 |
| dependency | `react-dom` | ^19.1.0 | 浏览器 DOM 渲染 |
| devDependency | `vite` | ^6.3.5 | 开发服务器与生产打包 |
| devDependency | `@vitejs/plugin-react` | ^4.6.0 | Vite 下 JSX/TSX 与 Fast Refresh |
| devDependency | `typescript` | ^5.9.2 | 类型检查 |
| devDependency | `@types/react` | ^19.1.8 | React 类型定义 |
| devDependency | `@types/react-dom` | ^19.1.6 | ReactDOM 类型定义 |

---

## 如何查看完整依赖树（含间接依赖）

在仓库根目录执行：

```bash
npm ls --all
```

仅查看某一子包：

```bash
npm ls -w @addchess/app
npm ls -w @addchess/core
```

---

## 升级依赖时注意

- **React / Vite 大版本**升级后需重新跑 `npm run build` 与手动点一遍关键流程（加子、连将、空降）。  
- **`@addchess/core` 若改为发布到 npm**，把 app 里 `"@addchess/core": "*"` 换成固定版本号或 `workspace:*`（视 npm 版本而定）。
