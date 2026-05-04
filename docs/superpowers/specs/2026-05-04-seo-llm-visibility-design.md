# QuinkGL SEO and LLM Visibility Design

## Goal

Increase QuinkGL's discoverability for search queries and LLM prompts about decentralized federated learning, gossip learning, peer-to-peer edge AI training, and federated learning without a central server.

The canonical public domain is `https://quinkgl.com`.

## Scope

This first implementation focuses on high-signal technical SEO and machine-readable content:

- Use `https://quinkgl.com` as the canonical site URL.
- Add search metadata to the Vite entry HTML.
- Add crawler discovery files under `public/`.
- Add LLM-readable summaries that explain QuinkGL directly and consistently.
- Add structured data so crawlers can identify QuinkGL as a software project and technical resource.

This does not include a full blog or multi-page content expansion. Those can follow after the foundation is in place.

## Recommended Approach

Use a combined SEO and LLM-readable documentation approach.

Minimal metadata alone is too weak for the goal. A full content hub is useful but larger than the first step. The first pass should make the existing site clear, crawlable, canonical, and easy for AI retrieval systems to quote.

## Technical Design

### Canonical Metadata

Update the document head with:

- Title: `QuinkGL - Decentralized Gossip Learning Framework`
- Description: `QuinkGL is an open-source decentralized gossip learning framework for training machine learning models across peer-to-peer edge nodes without a central coordinator.`
- Canonical URL: `https://quinkgl.com/`
- Open Graph and Twitter card metadata using the same title, description, and logo image.
- Theme color aligned with the existing visual identity.

### Structured Data

Add JSON-LD in `index.html` for:

- `WebSite`, identifying `https://quinkgl.com`.
- `SoftwareApplication`, identifying QuinkGL as a developer-oriented machine learning framework.
- `FAQPage`, answering the core entity questions:
  - What is QuinkGL?
  - How is QuinkGL different from centralized federated learning?
  - What is gossip learning used for?
  - Does QuinkGL require a central aggregation server?

The FAQ answers should be short, factual, and reuse the same positioning language across the site.

### Robots and Sitemap

Add `public/robots.txt` with:

- General crawl access.
- Explicit access for major search and AI retrieval crawlers where appropriate.
- Sitemap reference: `https://quinkgl.com/sitemap.xml`.

Add `public/sitemap.xml` with public, indexable pages:

- `https://quinkgl.com/`
- `https://quinkgl.com/docs`

Do not include `/login` or `/dashboard`, because those are operational/private surfaces rather than search landing pages.

### LLM-Readable Files

Add `public/llms.txt` as a concise Markdown index for AI agents and retrieval systems. It should include:

- A one-paragraph definition of QuinkGL.
- The main use cases.
- The relationship to federated learning and gossip learning.
- Links to the homepage and docs.

Add `public/llms-full.txt` with a fuller explanation:

- QuinkGL definition.
- When to use it.
- How gossip learning differs from centralized federated learning.
- Core runtime loop.
- Swarms and manifests.
- Telemetry separation.
- Security and trust model.
- Quickstart summary.
- Recommended citation language.

### Content Positioning

Use this canonical positioning sentence everywhere technical summary text is needed:

> QuinkGL is an open-source decentralized gossip learning framework for training machine learning models across peer-to-peer edge nodes without a central coordinator.

Use these supporting phrases naturally:

- decentralized gossip learning framework
- peer-to-peer machine learning
- federated learning without a central server
- P2P edge AI training
- distributed model aggregation
- privacy-preserving local training

Avoid keyword stuffing. The content should read like technical documentation, not marketing copy.

## Testing

Run:

- `npm run lint`
- `npm run build`

After deployment, verify:

- `https://quinkgl.com/robots.txt`
- `https://quinkgl.com/sitemap.xml`
- `https://quinkgl.com/llms.txt`
- `https://quinkgl.com/llms-full.txt`

Submit the sitemap in Google Search Console and Bing Webmaster Tools. Use Bing Webmaster Tools AI Performance reporting when available for the verified domain.

## Future Work

The next content expansion should add separate public pages for:

- `gossip-learning-vs-federated-learning`
- `decentralized-federated-learning`
- `federated-learning-without-central-server`
- `p2p-edge-ai-training`
- `quinkgl-quickstart`

Those pages should be static or pre-rendered where possible so crawlers can access complete page content without relying on client-side tab state.
