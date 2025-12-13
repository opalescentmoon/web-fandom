 // simple collapse handler for wiki filters
      document.addEventListener('click', (event) => {
        const header = event.target.closest('[data-collapse-target]')
        if (!header) return

        const targetId = header.getAttribute('data-collapse-target')
        const body = document.getElementById(targetId)
        if (!body) return

        const isOpen = body.classList.toggle('is-open')
        header.classList.toggle('is-open', isOpen)
      })

      // tells JS whether user is logged in (Edge will insert true/false)
      const accessToken = localStorage.getItem('accessToken')
      window.IS_LOGGED_IN = !!accessToken
      document.body.dataset.isLoggedIn = window.IS_LOGGED_IN ? 'true' : 'false';

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
    // only close if you clicked the backdrop, not inside the card
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

function titleCaseFromSlug (slug) {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// cache fandomId so we don’t keep requesting it
async function getFandomIdFromSlug (slug) {
  const cacheKey = `fandomId:${slug}`
  const cached = sessionStorage.getItem(cacheKey)
  if (cached) return Number(cached)

  const fandomName = titleCaseFromSlug(slug)

  // backend expects "fandomName"
  const res = await fetch(`/fandom/name?fandomName=${encodeURIComponent(fandomName)}`)
  const text = await res.text()
let data
try { data = JSON.parse(text) } catch { data = { error: text } }

if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`)
  if (!res.ok) throw new Error(data?.error || 'Failed to resolve fandomId')

  const fandom = Array.isArray(data) ? data[0] : data
  const fandomId = fandom?.fandomId ?? fandom?.fandom_id ?? fandom?.id
  if (!fandomId) throw new Error('Fandom not found in DB (name mismatch?)')

  sessionStorage.setItem(cacheKey, String(fandomId))
  return fandomId
}

  function getJoinedFandoms () {
    try {
      const raw = window.localStorage.getItem('joinedFandoms')
      if (!raw) return {}
      return JSON.parse(raw)
    } catch (err) {
      console.error('Failed to parse joinedFandoms from localStorage', err)
      return {}
    }
  }

  function saveJoinedFandoms (map) {
    try {
      window.localStorage.setItem('joinedFandoms', JSON.stringify(map))
    } catch (err) {
      console.error('Failed to save joinedFandoms to localStorage', err)
    }
  }

  function escapeHtml (str) {
  return String(str || '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[m]))
}

function renderPostCard (p) {
  const postId = p.postId ?? p.id
  const caption = p.caption ?? ''
  const postType = p.postType ?? p.post_type ?? ''
  const liked = false
  const likeCount = 0

  return `
    <article class="post-card" data-post-id="${postId}">
      <header class="post-header">
        <div class="post-user-mini">
          <div class="avatar-circle"></div>
          <div class="post-user-text">
            <div class="post-username">Username</div>
          </div>
        </div>
        <div class="post-tag">${escapeHtml(postType)}</div>
      </header>

      <main class="post-body">
        <p>${escapeHtml(caption)}</p>
      </main>

      <footer class="post-footer">
        <div class="post-actions">
          <button
            class="post-like-btn"
            data-like-url="/likes/toggle"
            data-post-id="${postId}"
            data-liked="${liked ? 'true' : 'false'}"
            data-requires-auth="true"
            data-auth-mode="login"
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
  const slug = body.dataset.fandomSlug || 'default-fandom'
  const activeTab = body.dataset.activeTab || 'fanworks'

  const fandomId = await getFandomIdFromSlug(slug)

  const res = await fetch(`/posts/fandom/${fandomId}`)
  const posts = await res.json()

  if (!res.ok) {
    feed.innerHTML = `<div class="feed-loading">Failed to load posts</div>`
    return
  }

  // filter by tab (because you are storing tab as postType)
  const filtered = (Array.isArray(posts) ? posts : []).filter((p) => {
    return (p.postType ?? p.post_type) === activeTab
  })

  if (!filtered.length) {
    feed.innerHTML = `<div class="feed-loading">No posts yet</div>`
    return
  }

  feed.innerHTML = filtered.map(renderPostCard).join('')
}


  document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('accessToken')
    document.body.dataset.isLoggedIn = token ? 'true' : 'false'
    const body = document.body
    const slug = body.dataset.fandomSlug || 'default-fandom'
    const isLoggedIn = body.dataset.isLoggedIn === 'true'
    const initialHasJoined = body.dataset.initialHasJoined === 'true'

    const joinBtn = document.querySelector('.js-join-or-post')
    if (!joinBtn) return

    // read from localStorage
    const joinedMap = getJoinedFandoms()
    let hasJoined = initialHasJoined || !!joinedMap[slug]

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
    const fandomId = await getFandomIdFromSlug(slug)

    const res = await fetch('/fandom/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({ fandomId }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || data?.message || 'Join failed')

    hasJoined = true
    joinedMap[slug] = true
    saveJoinedFandoms(joinedMap)
    updateJoinButton()
    } catch (err) {
    alert(err.message)
  }
        // later you can also show a toast like "Joined this fandom!"
        return
      }

      // logged in + already joined → open create-post modal
      if (typeof window.openPostModal === 'function') {
      window.openPostModal()
      }
    })

    setupPostModal()
    loadFeed().catch(console.error)
  })

  const POST_CONTENT_TYPES = {
    fanworks: ['#Fanfiction', '#Fanart', '#Merch'],
    wiki: ['Announcement', 'Lore', 'Worldbuilding'],
    forum: ['#Discussion', '#Poll', '#QnA']
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

    if (!overlay || !modal || !tabSelect || !typeSelect || !contentInput || !submitBtn) {
      return
    }

    const body = document.body
    const slug = body.dataset.fandomSlug || 'default-fandom'
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

    function openPostModal (tab) {
      const chosenTab = tab || initialTab || 'fanworks'
      tabSelect.value = chosenTab
      fillTypeOptions(chosenTab)

      overlay.classList.add('is-visible')
      contentInput.value = ''
      tagsInput.value = ''
      contentInput.focus()
    }

    function closePostModal () {
      overlay.classList.remove('is-visible')
    }

    // expose globally so join/POST button can call it
    window.openPostModal = openPostModal

    // when user changes "Post to" tab, update content-type options
    tabSelect.addEventListener('change', () => {
      fillTypeOptions(tabSelect.value)
    })

    // close handlers
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault()
        closePostModal()
      })
    }

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        closePostModal()
      }
    })

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closePostModal()
      }
    })

    submitBtn.addEventListener('click', async (event) => {
  event.preventDefault()

  const caption = contentInput.value.trim()
  const tagsRaw = tagsInput.value.trim()
  const tab = tabSelect.value          // fanworks / wiki / forum
  const type = typeSelect.value        // your dropdown value

  if (!caption) return

  try {
    const fandomId = await getFandomIdFromSlug(slug)

    // 1) Create the post
    const res = await fetch('/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({
        caption,
        fandomId,
        parentId: 0,
        contentId: 0,
        postType: tab,     // IMPORTANT: keep it URL-safe + consistent (fanworks/wiki/forum)
      }),
    })

    const post = await res.json()
    if (!res.ok) throw new Error(post?.error || 'Create post failed')

    // 2) Turn “type” into a hashtag too (optional but nice)
    //    Example: "Fanfiction" or "#Fanfiction" → "Fanfiction"
    const autoTag = String(type || '').replace(/^#/, '').trim()

    // 3) Parse user tags "#a #b,c" → ["a","b","c"]
    const tagList = []
    if (autoTag) tagList.push(autoTag)

    if (tagsRaw) {
      const cleaned = tagsRaw
        .split(/[\s,]+/)
        .map(t => t.replace(/^#/, '').trim())
        .filter(Boolean)
      tagList.push(...cleaned)
    }

    // 4) Find-or-create hashtags, then attach to post
    for (const tag of tagList) {
      const hRes = await fetch('/hashtags/find-or-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ tag }),
      })
      const hashtag = await hRes.json()
      if (!hRes.ok) continue // don’t block posting if a hashtag fails

      await fetch(`/posts/${post.postId || post.id}/hashtags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ hashtagId: hashtag.hashtagId || hashtag.id }),
      })
    }

    // 5) Update UI: either prepend, or reload feed
    // If you already render posts via JS, prepend. If not, reload.
    if (typeof window.prependPostToFeed === 'function') {
      window.prependPostToFeed(post)
    } else {
      // fallback: reload current feed if you have a load function
      if (typeof window.loadFandomFeed === 'function') {
        window.loadFandomFeed(fandomId)
      } else {
        // worst-case fallback
        location.reload()
      }
    }

    const feed = document.getElementById('feedSection')
if (feed) {
  const loading = feed.querySelector('.feed-loading')
  if (loading) loading.remove()
  feed.insertAdjacentHTML('afterbegin', renderPostCard(post))
}


    closePostModal()
  } catch (err) {
    alert(err.message)
  }
})

}

  // ===== LIKE BUTTON LOGIC =====
document.addEventListener('DOMContentLoaded', () => {
  let currentUser = null
  const rawUser = localStorage.getItem('currentUser')
  if (rawUser) {
    try {
      currentUser = JSON.parse(rawUser)
    } catch (e) {
      console.warn('Failed to parse currentUser', e)
    }
  }

  const likeButtons = document.querySelectorAll('.post-like-btn')
  if (!likeButtons.length) return

  likeButtons.forEach((btn) => {
    btn.addEventListener('click', async (event) => {
      event.preventDefault()

      if (!window.IS_LOGGED_IN || !currentUser) {
        return
      }

      const url = btn.dataset.likeUrl
      const postId = btn.dataset.postId
      if (!url || !postId) {
        console.warn('Missing data-like-url or data-post-id on like button')
        return
      }

      const userId = currentUser.userId ?? currentUser.user_id
      if (!userId) {
        console.warn('No userId found in currentUser')
        return
      }

      const iconEl = btn.querySelector('.post-like-icon')
      const countEl = btn.querySelector('.post-like-count')

      const wasLiked = btn.dataset.liked === 'true'
      let currentCount = 0
      if (countEl) {
        const parsed = parseInt(countEl.textContent || '0', 10)
        currentCount = Number.isNaN(parsed) ? 0 : parsed
      }

      // optimistic UI
      if (iconEl) iconEl.textContent = wasLiked ? '♡' : '♥'
      btn.dataset.liked = wasLiked ? 'false' : 'true'
      if (countEl) {
        const newCount = wasLiked ? Math.max(0, currentCount - 1) : currentCount + 1
        countEl.textContent = String(newCount)
      }

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/html,application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            userId: userId,
            postId: Number(postId),
          }),
        })

        if (!res.ok) {
          console.warn('Like failed with status', res.status)
          // revert optimistic UI
          btn.dataset.liked = wasLiked ? 'true' : 'false'
          if (iconEl) iconEl.textContent = wasLiked ? '♥' : '♡'
          if (countEl) countEl.textContent = String(currentCount)
          return
        }

        // res.ok → keep optimistic UI, no need to read body
      } catch (err) {
        console.error('Like request failed:', err)
        btn.dataset.liked = wasLiked ? 'true' : 'false'
        if (iconEl) iconEl.textContent = wasLiked ? '♥' : '♡'
        if (countEl) countEl.textContent = String(currentCount)
      }
    })
  })
})
