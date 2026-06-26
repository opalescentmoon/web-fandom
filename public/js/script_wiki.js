// =============================================
// OFFICIAL TAB — Announcement + Wiki sections
// =============================================

const ANNOUNCEMENT_PREVIEW_LIMIT = 2
let showingAllAnnouncements = false
let currentAnnouncementPage = 1

// ── helpers ──────────────────────────────────

function getBody() { return document.body }
function getFandomId() { return Number(getBody().dataset.fandomId) }
function getActiveBranch() { return getBody().dataset.activeBranch || '' }

// ── Announcement ─────────────────────────────

async function loadAnnouncements(loadAll = false) {
  const feed = document.getElementById('announcementFeed')
  const loadMoreBtn = document.getElementById('loadMoreAnnouncementBtn')
  if (!feed) return

  feed.innerHTML = `<div class="feed-loading">Loading...</div>`

  const fandomId = getFandomId()
  const accessToken = localStorage.getItem('accessToken')

  try {
    const params = new URLSearchParams()
    params.set('tab', 'official')
    params.set('branch', 'Announcement')

    const res = await fetch(`/api/posts/fandom/${fandomId}?${params}`, {
      headers: {
        Accept: 'application/json',
        ...(accessToken ? authHeaders() : {}),
      },
    })

    const posts = await res.json().catch(() => [])
    if (!res.ok || !Array.isArray(posts) || !posts.length) {
      feed.innerHTML = `<div class="feed-loading">No announcements yet</div>`
      if (loadMoreBtn) loadMoreBtn.style.display = 'none'
      return
    }

    const toShow = loadAll ? posts : posts.slice(0, ANNOUNCEMENT_PREVIEW_LIMIT)
    feed.innerHTML = toShow.map(p => renderPostCard({ ...p, __src: 'announcement' })).join('')

    // show/hide load more button
    if (loadMoreBtn) {
      loadMoreBtn.style.display = (!loadAll && posts.length > ANNOUNCEMENT_PREVIEW_LIMIT) ? 'inline-block' : 'none'
    }
  } catch (err) {
    console.error(err)
    feed.innerHTML = `<div class="feed-loading">Failed to load announcements</div>`
  }
}

// ── Wiki ─────────────────────────────────────

function renderWikiCard(w) {
  const wikiId = w.id
  const title = w.title ?? 'Untitled'
  const contentId = w.contentId ?? w.content_id
  const branch = contentId === 5 ? 'Lore' : contentId === 6 ? 'Worldbuilding' : 'Official'

  return `
    <article class="post-card" onclick="window.location.href='/wiki/${wikiId}'" style="cursor:pointer">
      <header class="post-header">
        <div class="post-user-mini">
          <div class="post-user-text">
            <div class="post-username">${escapeHtml(title)}</div>
          </div>
        </div>
        <div class="post-branch">${escapeHtml(branch)}</div>
      </header>
      <main class="post-body">
        <p class="wiki-card-hint">Click to read more</p>
      </main>
    </article>
  `
}

async function loadWikis(contentId = null) {
  const feed = document.getElementById('wikiFeed')
  if (!feed) return

  feed.innerHTML = `<div class="feed-loading">Loading...</div>`

  const fandomId = getFandomId()
  const accessToken = localStorage.getItem('accessToken')

  try {
    const params = new URLSearchParams()
    if (contentId) params.set('contentId', contentId)

    const res = await fetch(`/api/wikis/fandom/${fandomId}?${params}`, {
      headers: {
        Accept: 'application/json',
        ...(accessToken ? authHeaders() : {}),
      },
    })

    const json = await res.json().catch(() => ({}))
    const wikis = Array.isArray(json) ? json : (json?.data ?? [])

    if (!wikis.length) {
      feed.innerHTML = `<div class="feed-loading">No wiki pages yet</div>`
      return
    }

    feed.innerHTML = wikis.map(w => renderWikiCard(w)).join('')
  } catch (err) {
    console.error(err)
    feed.innerHTML = `<div class="feed-loading">Failed to load wiki pages</div>`
  }
}

// ── Branch filter ─────────────────────────────

let selectedBranch = null

function setBranchActiveUI() {
  document.querySelectorAll('.js-branch[data-branch]').forEach((el) => {
    el.classList.toggle('is-active', el.dataset.branch === selectedBranch)
  })
}

function closeAllCollapses(exceptId = null) {
  document.querySelectorAll('.collapse-body').forEach((ul) => {
    if (!exceptId || ul.id !== exceptId) ul.classList.remove('is-open')
  })
  document.querySelectorAll('.collapse-header[data-collapse-target]').forEach((btn) => {
    if (!exceptId || btn.dataset.collapseTarget !== exceptId) btn.classList.remove('is-open')
  })
}

async function applyBranchFilter(branch) {
  const announcementSection = document.getElementById('announcementSection')
  const wikiSection = document.getElementById('wikiSection')
  const loadMoreBtn = document.getElementById('loadMoreAnnouncementBtn')

  if (branch === 'Announcement') {
    // show all announcements, hide wiki
    announcementSection.style.display = 'block'
    wikiSection.style.display = 'none'
    if (loadMoreBtn) loadMoreBtn.style.display = 'none'
    await loadAnnouncements(true)
  } else if (branch === 'Lore') {
    // hide announcements, show wiki filtered by Lore (contentId 5)
    announcementSection.style.display = 'none'
    wikiSection.style.display = 'block'
    await loadWikis(5)
  } else if (branch === 'Worldbuilding') {
    // hide announcements, show wiki filtered by Worldbuilding (contentId 6)
    announcementSection.style.display = 'none'
    wikiSection.style.display = 'block'
    await loadWikis(6)
  } else {
    // no filter — show both
    announcementSection.style.display = 'block'
    wikiSection.style.display = 'block'
    await loadAnnouncements(false)
    await loadWikis()
  }
}

document.addEventListener('click', async (e) => {
  // collapse headers (Lore, Worldbuilding)
  const collapseBtn = e.target.closest('.collapse-header[data-collapse-target]')
  if (collapseBtn) {
    e.preventDefault()
    e.stopImmediatePropagation()

    const b = collapseBtn.dataset.branch
    const targetId = collapseBtn.dataset.collapseTarget
    const body = document.getElementById(targetId)
    if (!body) return

    const isSameBranch = selectedBranch === b
    const isOpen = body.classList.contains('is-open')

    if (isSameBranch && isOpen) {
      selectedBranch = null
      closeAllCollapses(null)
      getBody().dataset.activeBranch = ''
      setBranchActiveUI()
      await applyBranchFilter(null)
      return
    }

    selectedBranch = b
    closeAllCollapses(targetId)
    body.classList.add('is-open')
    collapseBtn.classList.add('is-open')
    getBody().dataset.activeBranch = b
    setBranchActiveUI()
    await applyBranchFilter(b)
    return
  }

  // normal branch links (Announcement)
  const branchBtn = e.target.closest('.js-branch[data-branch]')
  if (branchBtn) {
    e.preventDefault()
    e.stopImmediatePropagation()

    const b = branchBtn.dataset.branch
    selectedBranch = selectedBranch === b ? null : b
    closeAllCollapses(null)
    getBody().dataset.activeBranch = selectedBranch || ''
    setBranchActiveUI()
    await applyBranchFilter(selectedBranch)
    return
  }

  // load more announcements
  const loadMoreBtn = e.target.closest('#loadMoreAnnouncementBtn')
  if (loadMoreBtn) {
    e.preventDefault()
    showingAllAnnouncements = true
    await loadAnnouncements(true)
    return
  }
}, true)

// ── Tag lists ─────────────────────────────────

async function loadBranchTagList(branch, ulId) {
  const ul = document.getElementById(ulId)
  if (!ul) return

  ul.innerHTML = `<li class="muted">Loading...</li>`

  const fandomId = getFandomId()
  const url = `/api/hashtags/used?fandomId=${fandomId}&branch=${encodeURIComponent(branch)}`

  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
  })

  const data = await res.json().catch(() => [])
  if (!res.ok || !Array.isArray(data) || !data.length) {
    ul.innerHTML = `<li class="muted">No tags yet</li>`
    return
  }

  ul.innerHTML = data.map(t => {
    const name = t.hashtagName || t.hashtag_name
    return `<li><a href="#" class="js-hashtag" data-tag="${escapeHtml(name)}">#${escapeHtml(name)}</a></li>`
  }).join('')
}

// ── Create Wiki button visibility ─────────────

function setupCreateWikiBtn() {
  const btn = document.getElementById('createWikiBtn')
  if (!btn) return
  if (!window.isMod) return

  btn.style.display = 'inline-block'
  btn.addEventListener('click', () => openCreateWikiModal())
  setupCreateWikiModal()
}

function openCreateWikiModal() {
  const overlay = document.getElementById('createWikiOverlay')
  const errorEl = document.getElementById('createWikiError')
  const titleInput = document.getElementById('createWikiTitle')
  const contentInput = document.getElementById('createWikiContent')
  const branchSelect = document.getElementById('createWikiBranch')

  if (!overlay) return

  // reset fields
  if (titleInput) titleInput.value = ''
  if (contentInput) contentInput.value = ''
  if (branchSelect) branchSelect.value = '5'
  if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = '' }

  overlay.style.display = 'flex'
}

function closeCreateWikiModal() {
  const overlay = document.getElementById('createWikiOverlay')
  if (overlay) overlay.style.display = 'none'
}

function setupCreateWikiModal() {
  const overlay = document.getElementById('createWikiOverlay')
  const closeBtn = document.getElementById('createWikiCloseBtn')
  const cancelBtn = document.getElementById('createWikiCancelBtn')
  const saveBtn = document.getElementById('createWikiSaveBtn')
  const errorEl = document.getElementById('createWikiError')

  if (!overlay) return

  if (closeBtn) closeBtn.addEventListener('click', closeCreateWikiModal)
  if (cancelBtn) cancelBtn.addEventListener('click', closeCreateWikiModal)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeCreateWikiModal()
  })

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const title = document.getElementById('createWikiTitle')?.value.trim()
      const content = document.getElementById('createWikiContent')?.value.trim()
      const contentId = Number(document.getElementById('createWikiBranch')?.value)
      const fandomId = getFandomId()

      if (!title) {
        errorEl.textContent = 'Title is required.'
        errorEl.style.display = 'block'
        return
      }
      if (!content) {
        errorEl.textContent = 'Content is required.'
        errorEl.style.display = 'block'
        return
      }

      try {
        saveBtn.disabled = true
        saveBtn.textContent = 'Creating...'

        // step 1: create wiki page (title + branch)
        const createRes = await fetch('/api/wikis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ fandomId, contentId, title }),
        })

        const createJson = await createRes.json().catch(() => ({}))
        if (!createRes.ok) throw new Error(createJson?.message || 'Failed to create wiki page')

        const wikiId = createJson?.data?.id

        // step 2: add content (first revision)
        const contentRes = await fetch(`/api/wikis/${wikiId}/edits/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ fandomId, content }),
        })

        const contentJson = await contentRes.json().catch(() => ({}))
        if (!contentRes.ok) throw new Error(contentJson?.message || 'Failed to add wiki content')

        closeCreateWikiModal()
        await loadWikis()

      } catch (err) {
        errorEl.textContent = err.message || 'Something went wrong.'
        errorEl.style.display = 'block'
      } finally {
        saveBtn.disabled = false
        saveBtn.textContent = 'Create'
      }
    })
  }
}

// ── Init ──────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadAnnouncements(false)
  await loadWikis()
  await loadBranchTagList('Lore', 'lore-list')
  await loadBranchTagList('Worldbuilding', 'world-list')
  setupCreateWikiBtn()
})