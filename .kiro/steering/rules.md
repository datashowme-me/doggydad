# Blog Project Rules

## Content Location

- All blog posts must be placed in `src/content/posts/` directory
- Do NOT use the root `/posts` folder - it's not used by Astro
- Categories are subdirectories: `general/`, `reading-notes/`, `tech-learning/`, `turing-award/`

## SEO Requirements

Every blog post must include proper frontmatter for SEO:

```yaml
---
title: Descriptive title with keywords
date: YYYY-MM-DD
description: 150-160 character description with target keywords
tags: [keyword1, keyword2, keyword3]
keywords: [seo-keyword1, seo-keyword2]  # optional but recommended
---
```

### SEO Checklist
- Title should be descriptive and include primary keyword
- Description should be 150-160 characters, compelling, with keywords
- Tags should include relevant topics (3-7 tags recommended)
- Use proper heading hierarchy (H1 → H2 → H3)
- Include internal links to related posts when possible
- Add external reference links to authoritative sources

## Date Rules

- Use format: `YYYY-MM-DD` (e.g., 2025-12-14)
- For new posts: use current date
- For Turing Award posts: use the award year (e.g., `1966-01-01` for 1966 award)
- When updating posts, consider updating the date to reflect significant changes

## Build & Deploy

### Build Command
```bash
npm run build
```

### Index Structure
- Built files go to `dist/` directory
- Each post generates: `dist/posts/{category}/{slug}/index.html`
- Sitemap auto-generated at `dist/sitemap-index.xml`
- Always run build before pushing to verify no errors

## Git Workflow

### Commit Message Format
```
type: brief description

Types:
- feat: new feature/post
- fix: bug fix or correction
- docs: documentation changes
- style: formatting changes
- refactor: code restructuring
```

### Push Rules
- Always build successfully before pushing
- Commit related changes together
- Use meaningful commit messages
- Do NOT push broken builds

### Repository & Deployment Target
- **Remote URL**: `https://github.com/datashowme-me/doggydad.git`
- **Git User**: `datashowme-me` (or `pzhao16me`) <`datashowme@gmail.com`>
- **Credential Storage**: Stored via `git config --global credential.helper store`
- **CI/CD**: GitHub Actions workflow at `.github/workflows/deploy.yml` builds and deploys to GitHub Pages automatically on push to `main` branch

### User Limits
- Respect GitHub rate limits
- user must be : pzhao16me / datashowme-me
- Batch multiple small changes into single commits when possible
- Avoid force pushing to main branch

## File Naming

- Use lowercase with hyphens: `my-blog-post.md`
- Be descriptive but concise
- Include relevant keywords in filename (helps SEO)

## Language

- Chinese (中文) posts are welcome
- English posts are welcome
- Match the language in title, description, and content
