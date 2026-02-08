# Personal site — GitHub Pages

A minimal, personal site for thoughts and posts (text, video, files). Plain HTML/CSS/JS.

## Edit content
- Update `content/posts.json` to add, edit, or remove posts. Supported fields:
  - `id` (string, unique)
  - `title` (string)
  - `date` (YYYY-MM-DD)
  - `section` (e.g., `life`, `tech`, `misc`)
  - `type` (`text` | `video` | `file`)
  - When `type: text`: `markdown` (path to a `.md` file), or `html`/`text`
  - When `type: video`: `embedUrl` (e.g., YouTube embed URL)
  - When `type: file`: `url` (path to a file) and optional `label`
- Place markdown in `content/` and files in `content/files/`.

## Local preview
Just open `index.html` in a browser. Some browsers block `fetch` of local files; if that happens, run a tiny static server:

```bash
cd /Users/tanmay/ws/website
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish to GitHub Pages
- Push this folder to a GitHub repository.
- In repo settings → Pages: choose `Deploy from a branch`, set `branch: main` and `folder: / (root)`.
- Ensure `.nojekyll` exists in the repo root (already added).
- If your Pages site uses a subpath (`username.github.io/repo`), links are relative so it will work.

## Customize
- Edit styles in `assets/style.css`.
- Update header links and copy in `index.html` and `thoughts.html`.
- The markdown parser is intentionally minimal; for advanced formatting, embed HTML in your markdown or extend `assets/app.js`.
