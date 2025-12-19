let selectedFandomId = null
let selectedBranch = null
let me = null

function setActive(el, on) {
  if (!el) return
  el.classList.toggle('is-active', !!on)
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', ...authHeaders() },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`)
  return json
}

async function loadMe() {
  me = await fetchJson('/api/user/me')

  document.body.dataset.userId = me.userId ?? ''

  const displayNameEl = document.querySelector('[data-display-name]')
  const usernameEl = document.querySelector('[data-username]')
  const bioEl = document.querySelector('[data-bio]')

  const displayName =
    me.displayName ?? me.display_name ?? me.userName ?? me.user_name ?? 'User'
  const username = me.userName ?? me.user_name ?? ''

  if (displayNameEl) displayNameEl.textContent = displayName
  if (usernameEl) usernameEl.textContent = username ? '@' + username : ''
  if (bioEl) bioEl.textContent = me.bio ?? ''
}

async function loadJoinedFandoms() {
  const list = document.getElementById('joinedFandomsList')
  if (!list) return

  const fandoms = await fetchJson('/api/user/me/joined-fandoms')

  if (!Array.isArray(fandoms) || fandoms.length === 0) {
    list.innerHTML = `<li class="muted">No joined fandoms yet</li>`
    return
  }

  list.innerHTML = fandoms
    .map(
      (f) => `
      <li>
        <a href="#" class="js-fandom" data-fandom-id="${f.fandomId}">
          ${escapeHtml(f.fandomName)}
        </a>
      </li>
    `
    )
    .join('')
}

async function loadProfileFeed() {
  const feed = document.getElementById('profileFeed')
  if (!feed || !me?.userId) return

  feed.innerHTML = `<div class="feed-loading">Loading posts...</div>`

  const qs = new URLSearchParams()
  if (selectedFandomId) qs.set('fandomId', String(selectedFandomId))
  if (selectedBranch) qs.set('branch', selectedBranch)

  const posts = await fetchJson(`/api/posts/user/${me.userId}?${qs.toString()}`)

  feed.innerHTML =
    Array.isArray(posts) && posts.length
      ? posts.map(renderPostCard).join('')
      : `<div class="feed-loading">No posts found.</div>`
}

document.addEventListener('click', async (e) => {
  const fandomLink = e.target.closest('.js-fandom')
  if (fandomLink) {
    e.preventDefault()
    const id = Number(fandomLink.dataset.fandomId)
    selectedFandomId = selectedFandomId === id ? null : id

    document.querySelectorAll('.js-fandom').forEach((a) => {
      setActive(a, Number(a.dataset.fandomId) === selectedFandomId)
    })

    await loadProfileFeed()
    return
  }

  const branchLink = e.target.closest('.js-branch')
  if (branchLink) {
    e.preventDefault()
    const b = branchLink.dataset.branch
    selectedBranch = selectedBranch === b ? null : b

    document.querySelectorAll('.js-branch').forEach((a) => {
      setActive(a, a.dataset.branch === selectedBranch)
    })

    await loadProfileFeed()
    return
  }
})

async function initProfile() {
  const token = localStorage.getItem('accessToken')
  if (!token) return // or open login modal

  await loadMe()
  await loadJoinedFandoms()
  await loadProfileFeed()
}

initProfile().catch(console.error)
