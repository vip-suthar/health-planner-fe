# Strapi CMS — Explore content

Powers the **Explore** tab + article reader. One `Article` collection covers
articles, recipes and guides (discriminated by `kind`).

## 1. Create the content type

Either copy the schema into an existing Strapi v4/v5 project, or let the Content-Type
Builder create it from these fields.

Copy `strapi/src/api/article/` into your Strapi project's `src/api/`, then restart:

```
your-strapi/
  src/api/article/
    content-types/article/schema.json   ← provided here
    controllers/article.js              ← `module.exports = createCoreController('api::article.article')`
    routes/article.js                   ← `module.exports = createCoreRouter('api::article.article')`
    services/article.js                 ← `module.exports = createCoreService('api::article.article')`
```

(The Content-Type Builder generates the controller/route/service for you if you
build the type through the admin UI instead.)

### Fields
| field        | type                                   | notes                              |
|--------------|----------------------------------------|------------------------------------|
| title        | string (required)                      |                                    |
| slug         | uid → title (required)                  | used in `/article?slug=`           |
| kind         | enum: article / recipe / guide / community | drives card label + filter     |
| tone         | enum: forecast / brand / caution       | card/eyebrow accent color          |
| excerpt      | text                                    | card + feature description         |
| body         | richtext (markdown)                     | `## ` headings, `> ` quotes render |
| category     | string                                  | eyebrow, e.g. "NUTRITION SCIENCE"  |
| readTime     | string                                  | e.g. "4 MIN"                       |
| authorName   | string                                  | byline                             |
| authorRole   | string                                  | byline subtitle                    |
| cover        | media (single image)                    | card + hero background             |
| featured     | boolean                                 | first featured = Explore hero      |
| takeaways    | json (string[])                         | "Key takeaways" list               |

## 2. Make content readable

Settings → Roles → **Public** → Article: enable `find` and `findOne`.
Otherwise create an API token (Settings → API Tokens, read-only) and set
`NEXT_PUBLIC_CMS_TOKEN` in the app's `.env.local`.

## 3. Point the app at Strapi

```
NEXT_PUBLIC_CMS_URL=http://localhost:1337
NEXT_PUBLIC_CMS_TOKEN=        # only if content isn't public
```

The client (`src/lib/cms/`) normalizes both Strapi v4 (`data[].attributes`) and
v5 (flat) response shapes, and resolves relative media URLs against `NEXT_PUBLIC_CMS_URL`.
If the CMS is unreachable or empty, the Explore tab falls back to bundled mock content.
```
