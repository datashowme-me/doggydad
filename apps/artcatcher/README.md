# ArtCatcher 游戏模块

基于 React、Three.js 和 Vite 的 3D 艺术抓娃娃游戏。模块构建后由 DoggyDad 主站托管在 `/games/artcatcher/`。

## 本地开发

在仓库根目录运行：

```bash
npm install
npm run dev:artcatcher
```

类型检查与构建：

```bash
npm run check:artcatcher
npm run build:artcatcher
```

构建产物写入 `public/games/artcatcher/`，主站执行 `npm run build` 时会先构建本模块，再由 Astro 将其复制到最终的 `dist/games/artcatcher/`。

## 上游 Git 信息

- 源仓库：<https://github.com/datashowme-me/artCatcher>
- 导入分支：`main`
- 导入提交：`620304d21dcbbcd03bc2004e8085734df31d503b`
- 提交标题：`chore: rename project to ArtCatcher`
- 提交作者：`datashowme-me <datashowme@gmail.com>`
- 提交时间：`2026-10-15T17:51:24+08:00`

源码以普通目录导入，未保留上游 `.git`、提交历史或 Git 子模块配置。上游仓库在导入时未包含许可证文件。
