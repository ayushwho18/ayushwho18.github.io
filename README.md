# theayushdewangan.me

Personal website of Ayush Dewangan, built with Jekyll and hosted free on GitHub Pages.
GitHub builds the site automatically every time you change a file. Nothing to install.

## Write a new post (from your laptop or phone)

1. Open the `_posts` folder on github.com and choose **Add file → Create new file**.
2. Name it `YYYY-MM-DD-short-title.md`, for example `2026-11-02-bihar-registry-update.md`.
   The date in the name is the post's date.
3. Copy everything from `_templates/new-post.md`, paste it in, and fill it in.
   `category` is `news`, `analysis` or `notes`.
4. Click **Commit changes**. The post is live in about a minute at `/posts/`.

To fix a post later, open its file, click the pencil icon, edit, and commit.

**Pictures:** upload them to `assets/img/` (Add file → Upload files), then use
`![What the picture shows](/assets/img/name.jpg)` inside a post, or `image:` at the top for a cover.

## Change the site

| What | Where |
| --- | --- |
| Name, email, LinkedIn, tagline | `_config.yml` |
| Post categories | `categories_list` in `_config.yml` |
| Work shown on Home and Work pages | `_data/projects.yml` |
| About page | `about/index.md` |
| Home page text | `index.html` |
| CV PDF | replace `files/Ayush_Dewangan_CV.pdf` (keep the name) |
| Colours and fonts | `assets/css/site.css` (top of file) |

## Pages that are full HTML

`registries/` (The Next Ten Registries) and `sro-scorecard/` (Sub-Registrar Performance Scorecard)
are standalone pages and are copied as they are.

## Connect your own domain later

1. Claim a free `.me` (Namecheap) or `.tech` domain from the GitHub Student Developer Pack.
2. At the domain provider, add these DNS records:
   - four `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - one `CNAME` record for `www` pointing to `theayushdewangan.me`
3. In this repo: **Settings → Pages → Custom domain**, type your domain, save, then tick **Enforce HTTPS** once it appears.
4. Change `url:` in `_config.yml` to your domain.

## Rules for this site while I am a fellow

Public sources and synthetic data only. No departmental files, internal figures or screenshots of government portals.
Views are my own.
