---
title: 如何向博客添加新文章
date: 2025-12-14
description: 详细说明如何在这个博客系统中创建和发布新文章的步骤指南。
tags: [教程, Markdown, 博客]
---

# 如何向博客添加新文章

这篇文章将指导你如何在这个博客系统中添加新的文章。整个过程非常简单！

## 步骤一：创建 Markdown 文件

在 `src/content/posts/<category>/` 目录下创建新的 `.md` 文件。文件名和分类目录会共同组成文章 URL（例如：`general/my-article.md` → `/posts/general/my-article/`）。

```bash
# 在项目根目录下执行
touch posts/my-new-article.md
```

## 步骤二：添加 Frontmatter

每篇文章都需要在文件开头添加 YAML frontmatter，包含文章的元数据：

```yaml
---
title: 你的文章标题
date: 2025-12-14
description: 文章的简短描述，会显示在文章列表中
tags: [标签1, 标签2, 标签3]
---
```

### Frontmatter 字段说明

- **title** (必需): 文章标题
- **date** (必需): 发布日期，格式为 YYYY-MM-DD
- **description** (可选): 文章摘要，显示在首页卡片上
- **tags** (可选): 文章标签数组

## 步骤三：撰写内容

在 frontmatter 之后，使用 Markdown 语法撰写你的文章内容。

### 支持的 Markdown 特性

这个博客支持完整的 GitHub Flavored Markdown (GFM)：

#### 标题

```markdown
# H1 标题
## H2 标题
### H3 标题
```

#### 强调

```markdown
**粗体文本**
*斜体文本*
~~删除线~~
```

#### 列表

```markdown
- 无序列表项 1
- 无序列表项 2
  - 嵌套项

1. 有序列表项 1
2. 有序列表项 2
```

#### 链接和图片

```markdown
[链接文本](https://example.com)
![图片描述](image-url.jpg)
```

#### 代码块

使用三个反引号创建代码块，并指定语言以启用语法高亮：

````markdown
```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
}
```
````

支持的语言包括：JavaScript, Python, Java, C++, CSS, HTML, Bash 等。

#### 引用

```markdown
> 这是一个引用块
> 可以包含多行
```

#### 表格

```markdown
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 数据1 | 数据2 | 数据3 |
```

## 步骤四：更新文章列表

打开 `main.js` 文件，在 `loadPosts()` 函数的 `postFiles` 数组中添加你的新文件：

```javascript
const postFiles = [
  'welcome.md',
  'getting-started.md',
  'my-new-article.md'  // 添加你的新文章
];
```

## 步骤五：本地预览

在发布之前，先在本地预览你的文章：

```bash
# 启动开发服务器
npm run dev
```

然后在浏览器中打开 `http://localhost:5173` 查看效果。

## 步骤六：部署到 Cloudflare Pages

当你对文章满意后，把代码提交并推送到 GitHub：

```bash
git add .
git commit -m "Add new article: [文章标题]"
git push origin main
```

Cloudflare Pages 会监听 GitHub 仓库的 `main` 分支，自动构建并部署到线上站点。这里使用的是 Cloudflare Pages，不是 GitHub Pages。

## 写作建议 ✍️

1. **使用清晰的标题结构** - 帮助读者快速浏览文章
2. **添加代码示例** - 实际的代码比纯文字更容易理解
3. **包含图片** - 适当的可视化内容能提升阅读体验
4. **保持段落简短** - 每段专注于一个想法
5. **使用列表和表格** - 让信息更易于扫读

## 高级技巧

### 自定义样式

如果需要自定义某些文章的样式，可以在 `index.css` 中添加特定的 CSS 类。

### 添加图片

1. 在项目中创建 `public/images` 目录
2. 将图片放入该目录
3. 在 Markdown 中引用：`![描述](/images/my-image.jpg)`

### 嵌入媒体

你可以直接在 Markdown 中嵌入 HTML：

```html
<video controls width="100%">
  <source src="/videos/demo.mp4" type="video/mp4">
</video>
```

## 总结

现在你已经知道如何添加新文章了！整个流程非常简单：

1. ✅ 创建 `.md` 文件
2. ✅ 添加 frontmatter
3. ✅ 用 Markdown 撰写内容
4. ✅ 更新文件列表
5. ✅ 部署到 Cloudflare Pages

祝你写作愉快！🎉
