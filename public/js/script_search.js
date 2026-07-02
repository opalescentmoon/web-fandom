function getParam(key, fallback = '') {
  return new URLSearchParams(location.search).get(key) || fallback
}

function setParam(key, value) {
  const url = new URL(location.href)
  if (value === '' || value == null) url.searchParams.delete(key)
  else url.searchParams.set(key, value)
  history.replaceState({}, '', url.toString())
}

function normalizeQuery(q) {
  return String(q || '').trim().replace(/^#/, '')
}

function renderWikiCard(w) {
  const wikiId = w.id
  const title = w.title ?? 'Untitled'
  const contentId = w.contentId ?? w.content_id
  const branch = contentId === 5 ? 'Lore' : contentId === 6 ? 'Worldbuilding' : 'Official'
  const hashtags = Array.isArray(w.hashtags) ? w.hashtags : []
  const hashtagHtml = hashtags.map(h => {
    const name = h.name ?? h.hashtagName ?? h.hashtag_name ?? ''
    if (!name) return ''
    return `<a href="#" class="post-hashtag js-hashtag" data-tag="${escapeHtml(name)}">#${escapeHtml(name)}</a>`
  }).filter(Boolean).join(' ')

  return `
    <article class="post-card" onclick="window.location.href='/wiki/${wikiId}'" style="cursor:pointer">
      <header class="post-header">
        <div class="post-user-text">
          <div class="wiki-card-title">${escapeHtml(title)}</div>
        </div>
        <div class="post-branch">${escapeHtml(branch)}</div>
      </header>
      <main class="post-body">
        <p class="wiki-card-hint">Click to read more</p>
      </main>
      <footer class="post-footer">
        <div class="post-hashtags">${hashtagHtml}</div>
      </footer>
    </article>
  `
}

async function loadSearch() {
  const feed = document.getElementById('feedSection')
  if (!feed) return

  const fandomId = getParam('fandomId', document.body.dataset.fandomId || '')
  const qRaw = getParam('q', '')
  const q = normalizeQuery(qRaw)

  const tab = getParam('tab', document.body.dataset.activeTab || 'fanworks')
  const branch = getParam('branch', '')

  // no query -> don't call API, keep your "before search" UI
  if (!q) return
  if (!fandomId) {
    feed.innerHTML = `<div class="feed-loading">Missing fandom</div>`
    return
  }

  const api = new URL('/api/search', location.origin)
  api.searchParams.set('fandomId', fandomId)
  api.searchParams.set('q', q)
  api.searchParams.set('tab', tab)
  if (branch) api.searchParams.set('branch', branch)

  feed.innerHTML = `<div class="feed-loading">Loading...</div>`

  const res = await fetch(api.toString(), { headers: { Accept: 'application/json' } })
  const posts = await res.json().catch(() => [])


  if (!res.ok) {
    feed.innerHTML = `<div class="feed-loading">Search failed</div>`
    return
  }

  feed.innerHTML = (posts || []).length
    ? posts.map((p) => 
        p.__type === 'wiki' 
          ? renderWikiCard(p) 
          : renderPostCard({ ...p, __src: 'search' })
      ).join('')
    : `<div class="feed-loading">No results</div>`
}

/**
 * Branch toggle in search page:
 * - click branch -> set branch param
 * - click same again -> clear branch param
 * - keep q + tab
 */
document.addEventListener('click', (e) => {
  const el = e.target.closest('.js-branch')
  if (!el) return
  e.preventDefault()

  const clicked = String(el.dataset.branch || '').trim()
  if (!clicked) return

  const current = getParam('branch', '')
  setParam('branch', current === clicked ? '' : clicked)

  // reload results without full navigation
  loadSearch().catch(console.error)
})

/**
 * Hashtag click -> go to /search (navigation)
 * Works for:
 * - post-card hashtags (if you render them with class js-hashtag + data-tag)
 * - trending sidebar items
 */
document.addEventListener('click', (e) => {
  const el = e.target.closest('.js-hashtag')
  if (!el) return
  e.preventDefault()

  const tag = normalizeQuery(el.dataset.tag || el.textContent || '')
  if (!tag) return

  const fandomId = getParam('fandomId', document.body.dataset.fandomId || '')
  const fandomName = getParam('fandom_name', document.body.dataset.fandomName || '')
  const tab = getParam('tab', document.body.dataset.activeTab || 'fanworks')

  const url = new URL('/search', location.origin)
  if (fandomId) url.searchParams.set('fandomId', fandomId)
  if (fandomName) url.searchParams.set('fandom_name', fandomName)
  url.searchParams.set('tab', tab)
  url.searchParams.set('q', tag)

  // when starting a new search, clear branch
  url.searchParams.delete('branch')

  location.href = url.toString()
})

document.addEventListener('DOMContentLoaded', () => {
  // helpful datasets if you want them later
  document.body.dataset.activeTab = getParam('tab', document.body.dataset.activeTab || 'fanworks')
  document.body.dataset.fandomId = getParam('fandomId', document.body.dataset.fandomId || '')
  document.body.dataset.fandomName = getParam('fandom_name', document.body.dataset.fandomName || '')

  loadSearch().catch(console.error)
})
