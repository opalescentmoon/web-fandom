// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function authHeaders() {
  const token = localStorage.getItem('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const IS_LOGGED_IN = !!localStorage.getItem('accessToken')

// ─── Load Wiki ────────────────────────────────────────────────────────────────

async function loadWiki() {
  const wikiId = document.body.dataset.wikiId
  const section = document.getElementById('wikiSection')
  if (!section) return

  try {
    const res = await fetch(`/api/wikis/${wikiId}`, {
      headers: {
        Accept: 'application/json',
        ...(IS_LOGGED_IN ? authHeaders() : {}),
      },
    })
    const wiki = await res.json()
    if (!res.ok) throw new Error(wiki?.error || 'Failed to load wiki')

    const data = wiki.data ?? wiki

    // fill fandom name in header
    const fandomNameEl = document.getElementById('wikiFandomName')
    if (fandomNameEl) fandomNameEl.textContent = data.fandomName ?? data.fandom?.fandomName ?? 'Wiki'

    // store fandomId for trending
    const fandomId = data.fandomId ?? data.fandom_id
    if (fandomId) document.body.dataset.fandomId = fandomId

    const contentId = data.contentId ?? data.content_id
    const branch = contentId === 5 ? 'Lore' : contentId === 6 ? 'Worldbuilding' : 'Official'
    const content = data.content ?? 'No content yet.'

    section.innerHTML = `
      <article class="post-card">
        <header class="post-header">
          <div class="post-user-text">
            <div class="post-username">${escapeHtml(data.title ?? 'Untitled')}</div>
          </div>
          <div class="post-branch">${escapeHtml(branch)}</div>
        </header>
        <main class="post-body">
          <p>${escapeHtml(content)}</p>
        </main>
        <footer class="post-footer">
          <div class="post-actions">
            <button class="wiki-request-edit-btn" id="requestEditBtn">+ Request Edit</button>
          </div>
        </footer>
      </article>
    `

    // show request edit button only if logged in
    const requestEditBtn = document.getElementById('requestEditBtn')
    if (requestEditBtn) {
      if (!IS_LOGGED_IN) {
        requestEditBtn.style.display = 'none'
      } else {
        requestEditBtn.addEventListener('click', () => {
          // hook up later
          console.log('open request edit modal')
        })
      }
    }

  } catch (err) {
    console.error(err)
    section.innerHTML = `<div class="feed-loading">Failed to load wiki page</div>`
  }
}

// ─── Load Comments ────────────────────────────────────────────────────────────

function renderComment(c) {
  const username =
    c.user?.displayName ?? c.user?.display_name ?? c.user?.userName ?? c.user?.user_name ?? 'User'
  const avatarUrl = c.user?.profilePicture ?? c.user?.profile_picture ?? null
  const caption = c.caption ?? ''
  const userId = c.user?.userId ?? c.user?.user_id

  return `
    <div class="comment-card">
      <a href="/profile/${userId}" class="post-user-link">
        <div class="avatar-circle" style="${avatarUrl ? `background-image:url('${avatarUrl}'); background-size:cover; background-position:center;` : ''}"></div>
      </a>
      <div class="comment-body">
        <a href="/profile/${userId}" class="post-user-link">
          <span class="post-username">${escapeHtml(username)}</span>
        </a>
        <p>${escapeHtml(caption)}</p>
      </div>
    </div>
  `
}

async function loadComments() {
  const wikiId = document.body.dataset.wikiId
  const section = document.getElementById('commentsSection')
  if (!section) return

  try {
    const res = await fetch(`/api/wikis/${wikiId}/comments`, {
      headers: {
        Accept: 'application/json',
        ...(IS_LOGGED_IN ? authHeaders() : {}),
      },
    })

    if (!res.ok) {
      section.innerHTML = `<div class="feed-loading">No comments yet.</div>`
      return
    }

    const comments = await res.json()

    if (!Array.isArray(comments) || !comments.length) {
      section.innerHTML = `<div class="feed-loading">No comments yet. Be the first!</div>`
      return
    }

    section.innerHTML = comments.map(renderComment).join('')
  } catch (err) {
    console.error(err)
    section.innerHTML = `<div class="feed-loading">No comments yet.</div>`
  }
}

// ─── Load Trending ────────────────────────────────────────────────────────────

async function loadTrendingHashtags() {
  const list = document.getElementById('trendingList')
  if (!list) return

  const fandomId = document.body.dataset.fandomId
  if (!fandomId) { list.innerHTML = ''; return }

  try {
    const url = new URL('/api/hashtags/trending', location.origin)
    url.searchParams.set('fandomId', fandomId)
    url.searchParams.set('limit', '5')

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    })

    const data = await res.json().catch(() => [])
    if (!res.ok) throw new Error(data?.error || 'Trending failed')

    const tags = Array.isArray(data) ? data : []
    if (!tags.length) {
      list.innerHTML = `<li class="feed-loading">No trending tags yet</li>`
      return
    }

    list.innerHTML = tags.map(t => `
      <li><a href="#" data-tag="${escapeHtml(t.name)}">#${escapeHtml(t.name)}</a></li>
    `).join('')
  } catch (err) {
    list.innerHTML = `<li class="feed-loading">Failed to load</li>`
  }
}

// ─── Comment Input ────────────────────────────────────────────────────────────

async function submitComment() {
  const wikiId = document.body.dataset.wikiId
  const input = document.getElementById('commentInput')
  const caption = input?.value?.trim()
  if (!caption) return

  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({
        caption,
        parentId: null,
        postType: 'normal',
        fandomId: null,
        contentId: 0,
        wikiId: Number(wikiId),
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Failed to post comment')

    input.value = ''
    await loadComments()
  } catch (err) {
    alert('Failed to post comment. Please try again.')
  }
}

function setupCommentInput() {
  if (!IS_LOGGED_IN) return

  const box = document.getElementById('commentInputBox')
  if (box) box.style.display = 'flex'

  const avatarEl = document.getElementById('commentAvatar')
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
  const savedAvatar = currentUser.profilePicture
  if (avatarEl && savedAvatar) {
    avatarEl.style.backgroundImage = `url('${savedAvatar}')`
    avatarEl.style.backgroundSize = 'cover'
    avatarEl.style.backgroundPosition = 'center'
  }

  const btn = document.getElementById('commentSubmitBtn')
  if (btn) btn.addEventListener('click', submitComment)

  const input = document.getElementById('commentInput')
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitComment()
    })
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadWiki()
  await loadComments()
  loadTrendingHashtags()
  setupCommentInput()
})