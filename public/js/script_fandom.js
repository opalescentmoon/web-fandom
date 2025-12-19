// tells JS whether user is logged in (Edge will insert true/false)
const accessToken = localStorage.getItem('accessToken')
window.IS_LOGGED_IN = !!accessToken
document.body.dataset.isLoggedIn = window.IS_LOGGED_IN ? 'true' : 'false';

// ===== CONTENT BRANCH FILTERING =====
function setupBranchFilterToggle() {
  const aside = document.querySelector('.fandom-filter')
  if (!aside) return

  aside.addEventListener('click', (e) => {
    const a = e.target.closest('a.js-branch')
    if (!a) return

    e.preventDefault()

    const clicked = (a.dataset.branch || '').trim()
    if (!clicked) return

    const body = document.body
    const current = body.dataset.activeBranch || ''

    // toggle
    body.dataset.activeBranch = (current === clicked) ? '' : clicked

    // highlight active
    aside.querySelectorAll('a.js-branch').forEach((el) => {
      el.classList.toggle('is-active', el.dataset.branch === body.dataset.activeBranch)
    })

    loadFeed().catch(console.error)
  })
}


// ===== AUTH MODAL JS =====
const authOverlay = document.getElementById('authOverlay')
const authModal = document.getElementById('authModal')
const authLogin = document.getElementById('authLogin')
const authSignup = document.getElementById('authSignup')

function openAuthModal (mode) {
  if (!authModal || !authOverlay) return

  authModal.classList.add('is-open')
  authOverlay.classList.add('is-visible')

  if (authLogin && authSignup) {
    authLogin.style.display = mode === 'signup' ? 'none' : 'block'
    authSignup.style.display = mode === 'signup' ? 'block' : 'none'
  }
}

function closeAuthModal () {
  if (!authModal || !authOverlay) return
  authModal.classList.remove('is-open')
  authOverlay.classList.remove('is-visible')

  if (authLogin) authLogin.style.display = 'none'
  if (authSignup) authSignup.style.display = 'none'
}

// open from any element with .js-open-auth
document.querySelectorAll('.js-open-auth').forEach((btn) => {
  btn.addEventListener('click', (event) => {
    event.preventDefault()
    const mode = btn.getAttribute('data-auth-mode') || 'login'
    openAuthModal(mode)
  })
})

document.querySelectorAll('.auth-modal-close').forEach((btn) => {
btn.addEventListener('click', (event) => {
    event.preventDefault()
    closeAuthModal()
  })
})

if (authModal) {
  authModal.addEventListener('click', (event) => {
    if (event.target === authModal) {
      closeAuthModal()
    }
  })
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeAuthModal()
  }
})

// ===== REQUIRE-AUTH CLICK GUARD =====
document.querySelectorAll('[data-requires-auth="true"]').forEach((el) => {
  el.addEventListener('click', (event) => {
    if (!window.IS_LOGGED_IN) {
      event.preventDefault()
      const mode = el.getAttribute('data-auth-mode') || 'login'
      openAuthModal(mode)
    }
  })
})


// ===== JOIN / POST BUTTON LOGIC =====
function authHeaders () {
  const token = localStorage.getItem('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function escapeHtml (str) {
  return String(str || '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[m]))
}

function renderPostCard (p) {
  const postId = p.postId ?? p.post_id ?? p.id
  const caption = p.caption ?? ''
  const contentBranch = p.contentBranch ?? p.content_branch ?? ''
  const username =
    p.user?.displayName ??
    p.user?.display_name ??
    p.user?.userName ??
    p.user?.user_name ??
    'Username'
  const hashtags = Array.isArray(p.hashtags) ? p.hashtags : []
  const hashtagHtml = hashtags
    .map((h) => {
      const name = h.hashtagName ?? h.hashtag_name ?? h.name ?? ''
      if (!name) return ''
      return `<a href="#" class="post-hashtag js-hashtag" data-tag="${escapeHtml(name)}">#${escapeHtml(name)}</a>`
    })
    .filter(Boolean)
    .join(' ')
  const liked = !!(p.likedByMe ?? p.liked_by_me)
  const likeCount = Number(p.likeCount ?? p.like_count ?? 0)
  const media = p.media || []
  const mediaHtml = media.map(m => {
    const url = m.fileUrl ?? m.file_url
    const type = m.mediaType ?? m.media_type
    if (!url) return ''
    if (type === 'video') {
      return `<video class="post-media" controls src="${url}"></video>`
    }
    return `<img class="post-media" src="${url}" alt="Post media" />`
  }).join('')
  const poll = p.poll
  const myVoted = poll?.myVotedOptionId
  const pollHtml = poll?.options?.length
    ? `
      <div class="poll-box" data-poll-id="${poll.id}" data-voted="${myVoted ? 'true' : 'false'}">
        ${poll.options.map((o) => `
          <button type="button"
            class="poll-option-btn ${Number(myVoted) === Number(o.id) ? 'is-selected' : ''}"
            data-option-id="${o.id}"
            ${myVoted ? 'disabled' : ''}
          >
            <span class="poll-option-text">${o.optionText}</span>
            <span class="poll-option-votes">${o.votes}</span>
          </button>
        `).join('')}
      </div>
    `
    : ''


  return `
    <article class="post-card" data-post-id="${postId}">
      <header class="post-header">
        <div class="post-user-mini">
          <div class="avatar-circle"></div>
          <div class="post-user-text">
            <div class="post-username">${escapeHtml(username)}</div>
          </div>
        </div>
        <div class="post-branch">${escapeHtml(contentBranch || '')}</div>
      </header>

      <main class="post-body">
        <p>${escapeHtml(caption)}</p>
        ${pollHtml}
        ${mediaHtml}
      </main>

      <footer class="post-footer">
        <div class="post-hashtags">
          ${hashtagHtml || ''}
        </div>
        <div class="post-actions">
          <button
            class="post-like-btn"
            data-requires-auth="true"
            data-auth-mode="login"
            data-like-url="/api/likes/toggle"
            data-post-id="${postId}"
            data-liked="${liked ? 'true' : 'false'}"
          >
            <span class="post-like-icon">${liked ? '♥' : '♡'}</span>
            <span class="post-like-count">${likeCount}</span>
          </button>
        </div>
      </footer>
    </article>
  `
}

async function loadFeed () {
  const feed = document.getElementById('feedSection')
  if (!feed) return

  const body = document.body
  const activeTab = body.dataset.activeTab || 'fanworks'
  const activeBranch = document.body.dataset.activeBranch || '' 
  const fandomId = Number(body.dataset.fandomId)

  const params = new URLSearchParams()
  params.set('tab', activeTab)
  if (activeBranch) params.set('branch', activeBranch)

  const accessToken = localStorage.getItem('accessToken')

  const res = await fetch(`/api/posts/fandom/${fandomId}?${params}`, {
    headers: {
      'Accept': 'application/json',
      ...(window.IS_LOGGED_IN ? authHeaders() : {}),
    },
  })

  const posts = await res.json()


  if (!res.ok) {
    feed.innerHTML = `<div class="feed-loading">Failed to load posts</div>`
    return
  }

  // filter by tab (because you are storing tab as postType)
  if (!Array.isArray(posts) || !posts.length) {
    feed.innerHTML = `<div class="feed-loading">No posts yet</div>`
    return
  }

  feed.innerHTML = posts.map((p) => renderPostCard({ ...p, __src: 'loadFeed' })).join('')
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('.js-hashtag')
  if (!a) return
  e.preventDefault()

  const tag = String(a.dataset.tag || '').trim().replace(/^#/, '')
  if (!tag) return

  const fandomId = document.body.dataset.fandomId
  const fandomName = document.body.dataset.fandomName || ''
  const tab = document.body.dataset.activeTab || 'fanworks'

  const url = new URL('/search', location.origin)
  if (fandomId) url.searchParams.set('fandomId', fandomId)
  if (fandomName) url.searchParams.set('fandom_name', fandomName)
  url.searchParams.set('tab', tab)
  url.searchParams.set('q', tag)
  url.searchParams.delete('branch') // new search resets branch

  location.href = url.toString()
})

async function loadTrendingHashtags() {
  const list = document.getElementById('trendingList')
  if (!list) return

  const fandomId = document.body.dataset.fandomId
  if (!fandomId) {
    list.innerHTML = ''
    return
  }

  try {
    const url = new URL('/api/hashtags/trending', location.origin)
    url.searchParams.set('fandomId', fandomId)
    url.searchParams.set('limit', '5')

    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    })

    const data = await res.json().catch(() => [])
    if (!res.ok) throw new Error(data?.error || 'Trending failed')

    const tags = Array.isArray(data) ? data : []
    if (!tags.length) {
      list.innerHTML = `<li class="feed-loading">No trending tags yet</li>`
      return
    }

    list.innerHTML = tags.map((t) => `
      <li>
        <a href="#" class="js-hashtag" data-tag="${escapeHtml(t.name)}">#${escapeHtml(t.name)}</a>
      </li>
    `).join('')
  } catch (err) {
    console.error(err)
    list.innerHTML = `<li class="feed-loading">Failed to load</li>`
  }
}

async function fetchJoinStatus(fandomId) {
  const res = await fetch(`/api/fandom/join-status?fandomId=${fandomId}`, {
    headers: { Accept: 'application/json', ...authHeaders() },
  })
  if (!res.ok) return false
  const data = await res.json().catch(() => ({}))
  return !!data.hasJoined
}

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.poll-option-btn')
  if (!btn) return
  if (!window.IS_LOGGED_IN) return

  const box = btn.closest('.poll-box')
  if (!box) return

  // prevent double click / spam while waiting
  if (box.dataset.voting === 'true' || box.dataset.voted === 'true') return

  const pollId = Number(box.dataset.pollId)
  const pollOptionId = Number(btn.dataset.optionId)
  if (!pollId || !pollOptionId) return

  // Snapshot current UI (so we can revert if API fails)
  const buttons = Array.from(box.querySelectorAll('.poll-option-btn'))
  const prevTexts = buttons.map((b) => ({
    id: Number(b.dataset.optionId),
    text: b.querySelector('.poll-option-votes')?.textContent ?? '',
  }))

  // lock UI while voting (prevents “freeze” flicker)
  box.dataset.voting = 'true'
  buttons.forEach((b) => {
    b.disabled = true
    b.style.opacity = '0.85'
    b.style.cursor = 'default'
  })

  try {
    const res = await fetch('/api/poll/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({ pollId, pollOptionId }),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      // restore UI if vote failed (eg already voted)
      buttons.forEach((b) => {
        const id = Number(b.dataset.optionId)
        const prev = prevTexts.find((x) => x.id === id)
        const voteEl = b.querySelector('.poll-option-votes')
        if (voteEl && prev) voteEl.textContent = prev.text
      })
      box.dataset.voting = 'false'
      // keep disabled if user already voted (twitter style)
      if (String(json?.error || '').toLowerCase().includes('already voted')) {
        box.dataset.voted = 'true'
        return
      }
      // otherwise allow retry
      buttons.forEach((b) => (b.disabled = false))
      return
    }

    // ✅ success: update counts from server response
    const countsArr = Array.isArray(json.counts) ? json.counts : []
    const countsMap = new Map(countsArr.map((c) => [Number(c.optionId), Number(c.total)]))
    const totalVotes =
      Number(json.totalVotes) ||
      Array.from(countsMap.values()).reduce((a, b) => a + b, 0)

    buttons.forEach((b) => {
      const id = Number(b.dataset.optionId)
      const votes = countsMap.get(id) || 0

      // if you want percentage:
      const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0

      const voteEl = b.querySelector('.poll-option-votes')
      //if (voteEl) voteEl.textContent = `${votes} • ${pct}%`
      // if you DON’T want percentage, replace line above with:
      if (voteEl) voteEl.textContent = String(votes)
    })
    buttons.forEach((b) => b.classList.remove('is-selected'))
    btn.classList.add('is-selected')
    box.dataset.voted = 'true'
    box.dataset.voting = 'false'
    // keep disabled permanently after successful vote (twitter feel)
  } catch (err) {
    console.error(err)
    // revert UI and re-enable
    buttons.forEach((b) => {
      const id = Number(b.dataset.optionId)
      const prev = prevTexts.find((x) => x.id === id)
      const voteEl = b.querySelector('.poll-option-votes')
      if (voteEl && prev) voteEl.textContent = prev.text
      b.disabled = false
      b.style.opacity = ''
      b.style.cursor = ''
    })
    box.dataset.voting = 'false'
  }
})

document.addEventListener('DOMContentLoaded', async () => {
  setupBranchFilterToggle()

  // determine login state
  const token = localStorage.getItem('accessToken')
  document.body.dataset.isLoggedIn = token ? 'true' : 'false'
  const body = document.body
  const isLoggedIn = body.dataset.isLoggedIn === 'true'

  const joinBtn = document.querySelector('.js-join-or-post')
  if (!joinBtn) return

  // track join state
  const fandomId = Number(document.body.dataset.fandomId)
  let hasJoined = document.body.dataset.initialHasJoined === 'true'

  // If token exists, trust DB (not SSR)
  if (localStorage.getItem('accessToken') && Number.isFinite(fandomId)) {
    hasJoined = await fetchJoinStatus(fandomId)
    document.body.dataset.initialHasJoined = hasJoined ? 'true' : 'false'
  }

  function updateJoinButton () {
    joinBtn.textContent = hasJoined ? 'POST' : 'JOIN'
  }

  updateJoinButton()

  joinBtn.addEventListener('click', async(event) => {
    event.preventDefault()

    // if user not logged in → open auth modal
    if (!isLoggedIn) {
      if (typeof openAuthModal === 'function') {
        openAuthModal('login')
      } else {
        console.warn('openAuthModal not available')
      }
      return
    }

    // logged in but not joined yet → JOIN
    if (!hasJoined) {
      try {
        const fandomId = Number(document.body.dataset.fandomId)
        const res = await fetch('/api/fandom/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ fandomId }),
        })

        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || data?.message || 'Join failed')

        hasJoined = true
        document.body.dataset.initialHasJoined = 'true'
        updateJoinButton()

      } catch (err) {
        alert(err.message || String(err))

      }
      return
    }

    // logged in + already joined → open create-post modal
    if (typeof window.openPostModal === 'function') {
    window.openPostModal()
    }
  })
  setupPostModal()
  const isSearch = document.body.dataset.isSearch === 'true'
  if (!isSearch) {
    loadFeed().catch(console.error)
  }
  loadTrendingHashtags().catch(console.error)
})

const POST_CONTENT_TYPES = {
  fanworks: ['#Fanfiction', '#Fanart', '#Merch'],
  wiki: ['Announcement', 'Lore', 'Worldbuilding'],
  forum: ['#Discussion', '#Poll', '#QnA']
}

const CONTENT_ID_MAP = {
  fanworks: { '#Fanart': 1, '#Fanfiction': 2, '#Merch': 3 },
  wiki: { 'Announcement': 4, 'Lore': 5, 'Worldbuilding': 6 },
  forum: { '#Discussion': 7, '#Poll': 8, '#QnA': 9 },
}

function setupPostModal () {
  const overlay = document.getElementById('postOverlay')
  const modal = document.getElementById('postModal')
  const closeBtn = document.getElementById('postCloseBtn')
  const tabSelect = document.getElementById('postTabSelect')
  const typeSelect = document.getElementById('postTypeSelect')
  const contentInput = document.getElementById('postContent')
  const tagsInput = document.getElementById('postTags')
  const submitBtn = document.getElementById('postSubmitBtn')

  const mediaInput = document.getElementById('postMediaInput')
  const imageBtn = document.getElementById('postImageBtn')
  const previewEl = document.getElementById('postMediaPreview')

  const pollBtn = document.getElementById('postPollBtn')
  const pollBuilder = document.getElementById('pollBuilder')
  const pollOptionsWrap = document.getElementById('pollOptionsWrap')
  const pollAddOptionBtn = document.getElementById('pollAddOptionBtn')
  const pollRemoveOptionBtn = document.getElementById('pollRemoveOptionBtn')


  if (!overlay || !modal || !tabSelect || !typeSelect || !contentInput || !tagsInput || !submitBtn) {
    return
  }

  const body = document.body
  const initialTab = body.dataset.activeTab || 'fanworks'

  function fillTypeOptions (tab) {
    const options = POST_CONTENT_TYPES[tab] || []
    typeSelect.innerHTML = ''
    options.forEach((label) => {
      const opt = document.createElement('option')
      opt.value = label
      opt.textContent = label
      typeSelect.appendChild(opt)
    })
  }

  let selectedMediaFile = null

  function resetMediaUI () {
    selectedMediaFile = null
    if (mediaInput) mediaInput.value = ''
    if (previewEl) {
      previewEl.style.display = 'none'
      previewEl.innerHTML = ''
    }
  }

  const POLLS_CONTENT_ID = 8
  const POLL_MIN = 2
  const POLL_MAX = 4

  function getSelectedContentId () {
    const tab = tabSelect.value
    const type = typeSelect.value
    return Number(CONTENT_ID_MAP[tab]?.[type])
  }

  function isPollBranchSelected () {
    return tabSelect.value === 'forum' && getSelectedContentId() === POLLS_CONTENT_ID
  }

  function setPollUIVisible (show) {
    if (!pollBuilder) return
    pollBuilder.style.display = show ? 'block' : 'none'
  }

  function resetPollInputs () {
    if (!pollOptionsWrap) return
    pollOptionsWrap.innerHTML = `
      <input class="poll-option-input" type="text" placeholder="Option 1" />
      <input class="poll-option-input" type="text" placeholder="Option 2" />
    `
  }

  function updatePollAvailability () {
    if (!pollBtn) return

    const ok = isPollBranchSelected()
    pollBtn.disabled = !ok
    pollBtn.style.opacity = ok ? '1' : '0.35'
    pollBtn.style.cursor = ok ? 'pointer' : 'not-allowed'

    if (!ok) {
      setPollUIVisible(false)
    }
  }

  function openPostModal (tab) {
    const chosenTab = tab || initialTab || 'fanworks'
    tabSelect.value = chosenTab
    fillTypeOptions(chosenTab)

    updatePollAvailability()
    resetPollInputs()
    setPollUIVisible(false)

    overlay.classList.add('is-visible')

    contentInput.value = ''
    tagsInput.value = ''
    resetMediaUI()

    contentInput.focus()
  }

  function closePostModal () {
    overlay.classList.remove('is-visible')
    resetMediaUI()
  }

  window.openPostModal = openPostModal

  tabSelect.addEventListener('change', () => {
    fillTypeOptions(tabSelect.value)
    updatePollAvailability()
  })

  typeSelect.addEventListener('change', () => {
    updatePollAvailability()
  })

  updatePollAvailability()
  resetPollInputs()

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault()
      closePostModal()
    })
  }

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closePostModal()
  })

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePostModal()
  })

  // ✅ Camera click → open file picker
  if (imageBtn && mediaInput) {
    imageBtn.addEventListener('click', () => mediaInput.click())
  }

  // ✅ THIS is the preview logic and MUST be outside submit
  if (mediaInput) {
    mediaInput.addEventListener('change', () => {
      selectedMediaFile = mediaInput.files?.[0] || null

      if (!previewEl) return

      previewEl.innerHTML = ''
      previewEl.style.display = 'none'

      if (!selectedMediaFile) return

      const isVideo = selectedMediaFile.type.startsWith('video/')
      const url = URL.createObjectURL(selectedMediaFile)

      previewEl.style.display = 'block'
      const previewMaxH = 100
      previewEl.innerHTML = `
        <div class="post-media-preview-meta" style="display:flex;justify-content:space-between;align-items:center;">
          <span class="post-media-filename" style="max-width:70%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          ${selectedMediaFile.name}
          </span>
          <button type="button" class="post-media-remove" id="postMediaRemoveBtn">Remove</button>
        </div>

        <div style="
          margin-top:8px;
          width:100%;
          max-height:${previewMaxH}px;
          overflow:hidden;
          border-radius:12px;
          background: rgba(0,0,0,0.04);
        ">
        ${
          isVideo
            ? `<video style="width:100%; height:${previewMaxH}px; object-fit:cover; display:block;" muted controls src="${url}"></video>`
            : `<img style="width:100%; height:${previewMaxH}px; object-fit:cover; display:block;" src="${url}" alt="Selected media" />`
        }
      </div>
    `

      document.getElementById('postMediaRemoveBtn')?.addEventListener('click', () => {
        resetMediaUI()
      })
    })
  }

  if (pollBtn) {
    pollBtn.addEventListener('click', () => {
      if (!isPollBranchSelected()) return
      const isOpen = pollBuilder?.style.display === 'block'
      if (isOpen) {
        setPollUIVisible(false)
      } else {
        resetPollInputs()
        setPollUIVisible(true)
      }
    })
  }

  function getPollOptions () {
    if (!pollOptionsWrap) return []
    return Array.from(pollOptionsWrap.querySelectorAll('.poll-option-input'))
      .map((i) => i.value.trim())
      .filter(Boolean)
  }

  pollAddOptionBtn?.addEventListener('click', () => {
    if (!pollOptionsWrap) return
    const inputs = pollOptionsWrap.querySelectorAll('.poll-option-input')
    if (inputs.length >= POLL_MAX) return

    const nextIndex = inputs.length + 1
    const inp = document.createElement('input')
    inp.className = 'poll-option-input'
    inp.type = 'text'
    inp.placeholder = `Option ${nextIndex}`
    pollOptionsWrap.appendChild(inp)
  })

  pollRemoveOptionBtn?.addEventListener('click', () => {
    if (!pollOptionsWrap) return
    const inputs = pollOptionsWrap.querySelectorAll('.poll-option-input')
    if (inputs.length <= POLL_MIN) return
    pollOptionsWrap.removeChild(inputs[inputs.length - 1])
  })


  submitBtn.addEventListener('click', async (event) => {
    event.preventDefault()
    event.stopPropagation()

    const caption = contentInput.value.trim()
    const tagsRaw = tagsInput.value.trim()
    const tab = tabSelect.value
    const type = typeSelect.value
    const contentId = CONTENT_ID_MAP[tab]?.[type]

    if (!contentId) {
      alert('Invalid content type selected')
      return
    }

    if (!caption) return

    try {
      const fandomId = Number(document.body.dataset.fandomId)

      // 1) Create the post
      const res = await fetch('/api/posts', {
        method: 'POST',
        redirect: 'manual',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          caption,
          fandomId,
          parentId: null,
          contentId,
          postType: 'normal',
        }),
      })

      const post = await res.json()
      if (!res.ok) throw new Error(post?.error || 'Create post failed')

      const createdPostId = post.postId ?? post.post_id ?? post.id

      // ✅ If poll, create poll options
      const isPoll = isPollBranchSelected()

      if (isPoll) {
        const options = getPollOptions()
        if (options.length < POLL_MIN) {
          alert('Poll needs at least 2 options')
          return
        }
        if (options.length > POLL_MAX) {
          alert('Max 4 options')
          return
        }

        // 1) create poll (question copies caption)
        const pRes = await fetch('/api/poll/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({
            postId: Number(createdPostId),
            question: caption,
          }),
        })

        const poll = await pRes.json().catch(() => ({}))
        if (!pRes.ok) throw new Error(poll?.error || 'Create poll failed')

        // 2) add options
        const oRes = await fetch('/api/poll/options/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({
            pollId: poll.id,
            options, // controller expects { pollId, options }
          }),
        })

        const oJson = await oRes.json().catch(() => ({}))
        if (!oRes.ok) throw new Error(oJson?.error || 'Add poll options failed')
      }


      // 2) Hashtags attach (your existing logic)
      const tagSet = new Set()
      const branchName = String(type || '').replace(/^#/, '').trim().toLowerCase()

      if (tagsRaw) {
        tagsRaw
          .split(/[\s,]+/)
          .map(t => t.replace(/^#/, '').trim())
          .filter(t => t && t.toLowerCase() !== branchName)
          .filter(Boolean)
          .forEach(t => tagSet.add(t))
      }

      const tagList = [...tagSet]

      for (const tag of tagList) {
        const hRes = await fetch('/api/hashtags/find-or-create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...authHeaders(),
          },
          body: JSON.stringify({ tag }),
        })

        const hashtag = await hRes.json().catch(() => ({}))
        if (!hRes.ok) continue

        const hashtagId = hashtag.hashtagId ?? hashtag.id ?? hashtag.hashtag?.id
        if (!hashtagId) continue

        await fetch(`/api/posts/${createdPostId}/hashtags`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...authHeaders(),
          },
          body: JSON.stringify({ hashtagId }),
        })
      }

      // 3) ✅ Upload media if selected
      if (selectedMediaFile) {
        const fd = new FormData()
        fd.append('media', selectedMediaFile)

        const mRes = await fetch(`/api/posts/${createdPostId}/media`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            ...authHeaders(),
          },
          body: fd,
        })

        const mJson = await mRes.json().catch(() => ({}))
        if (!mRes.ok) throw new Error(mJson?.error || 'Upload media failed')
      }

      await loadFeed().catch(console.error)
      closePostModal()
      setPollUIVisible(false) 
      resetPollInputs()
    } catch (err) {
      alert(err.message)
    }
  })

  // Optional: block unexpected form submit
  document.addEventListener('submit', (e) => {
    if (e.target.closest('#postModal')) {
      console.warn('🚫 blocked unexpected form submit from post modal')
      e.preventDefault()
      e.stopPropagation()
    }
  })
}


// ===== LIKE BUTTON LOGIC (token-based + delegated) =====
document.addEventListener('click', async (event) => {
  const btn = event.target.closest('.post-like-btn')
  if (!btn) return

  event.preventDefault()

  // token-based login check
  const accessToken = localStorage.getItem('accessToken')
  window.IS_LOGGED_IN = !!accessToken

  if (!accessToken) {
    // you can optionally trigger your login modal here based on:
    // btn.dataset.requiresAuth / btn.dataset.authMode
    return
  }

  const url = btn.dataset.likeUrl
  const postIdRaw = btn.dataset.postId
  const postId = Number(postIdRaw)

  if (!url || !postIdRaw || Number.isNaN(postId)) {
    console.warn('Missing/invalid data-like-url or data-post-id on like button')
    return
  }

  const iconEl = btn.querySelector('.post-like-icon')
  const countEl = btn.querySelector('.post-like-count')

  const wasLiked = btn.dataset.liked === 'true'
  const currentCount = Number.parseInt(countEl?.textContent || '0', 10) || 0

  // optimistic UI
  if (iconEl) iconEl.textContent = wasLiked ? '♡' : '♥'
  btn.dataset.liked = wasLiked ? 'false' : 'true'
  if (countEl) {
    countEl.textContent = String(wasLiked ? Math.max(0, currentCount - 1) : currentCount + 1)
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ post_id: Number(postId) }),
    })

    if (!res.ok) {
      console.warn('Like failed with status', res.status)

      // If token expired / invalid
      if (res.status === 401) {
        // optional: clear token so UI updates properly next time
        // localStorage.removeItem('accessToken')
        // window.IS_LOGGED_IN = false
      }

      // revert optimistic UI
      btn.dataset.liked = wasLiked ? 'true' : 'false'
      if (iconEl) iconEl.textContent = wasLiked ? '♥' : '♡'
      if (countEl) countEl.textContent = String(currentCount)
      return
    }

    // If your backend returns JSON like { liked: true/false, likeCount: number }
    const data = await res.json().catch(() => null)
    if (data && typeof data.liked === 'boolean') {
      btn.dataset.liked = data.liked ? 'true' : 'false'
      if (iconEl) iconEl.textContent = data.liked ? '♥' : '♡'
    }
    if (data && typeof data.likeCount === 'number' && countEl) {
      countEl.textContent = String(data.likeCount)
    }
  } catch (err) {
    console.error('Like request failed:', err)

    // revert optimistic UI
    btn.dataset.liked = wasLiked ? 'true' : 'false'
    if (iconEl) iconEl.textContent = wasLiked ? '♥' : '♡'
    if (countEl) countEl.textContent = String(currentCount)
  }
})
