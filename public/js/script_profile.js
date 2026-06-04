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
    me.displayName ?? me.display_name ?? 'User'
  const username = me.userName ?? me.user_name ?? me.username ?? ''

  if (displayNameEl) displayNameEl.textContent = displayName
  if (usernameEl) usernameEl.textContent = username ? '@' + username : ''
  if (bioEl) bioEl.textContent = me.bio ?? ''

  // set profile picture if available
  updateAvatarDisplay(me.profilePicture ?? me.profile_picture ?? null)
}

function updateAvatarDisplay(url) {
  const avatarImg = document.getElementById('profileAvatarImg')
  const modalPreview = document.getElementById('modalAvatarPreview')

  if (url) {
    if (avatarImg) {
      avatarImg.src = url
      avatarImg.style.display = 'block'
    }
    if (modalPreview) {
      modalPreview.style.backgroundImage = `url('${url}')`
      modalPreview.style.backgroundSize = 'cover'
      modalPreview.style.backgroundPosition = 'center'
    }
  } else {
    if (avatarImg) avatarImg.style.display = 'none'
    if (modalPreview) {
      modalPreview.style.backgroundImage = ''
    }
  }
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

function renderPostCard(p) {
  const postId = p.postId ?? p.post_id ?? p.id
  const caption = p.caption ?? ''
  const contentBranch = p.contentBranch ?? p.content_branch ?? ''
  const username =
    p.user?.displayName ??
    p.user?.display_name ??
    p.user?.userName ??
    p.user?.user_name ??
    'Username'
  const avatarUrl = p.user?.profilePicture ?? p.user?.profile_picture ?? null
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
  const mediaHtml = media
    .map((m) => {
      const url = m.fileUrl ?? m.file_url
      const type = m.mediaType ?? m.media_type
      if (!url) return ''
      if (type === 'video') {
        return `<video class="post-media" controls src="${url}"></video>`
      }
      return `<img class="post-media" src="${url}" alt="Post media" />`
    })
    .join('')
  const poll = p.poll
  const myVoted = poll?.myVotedOptionId
  const pollHtml = poll?.options?.length
    ? `
      <div class="poll-box" data-poll-id="${poll.id}" data-voted="${myVoted ? 'true' : 'false'}">
        ${poll.options
          .map(
            (o) => `
          <button type="button"
            class="poll-option-btn ${Number(myVoted) === Number(o.id) ? 'is-selected' : ''}"
            data-option-id="${o.id}"
            ${myVoted ? 'disabled' : ''}
          >
            <span class="poll-option-text">${o.optionText}</span>
            <span class="poll-option-votes">${o.votes}</span>
          </button>
        `
          )
          .join('')}
      </div>
    `
    : ''

  return `
    <article class="post-card" data-post-id="${postId}">
      <header class="post-header">
        <div class="post-user-mini">
          <div class="avatar-circle" style="${avatarUrl ? `background-image:url('${avatarUrl}'); background-size:cover; background-position:center;` : ''}"></div>
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

// ── Edit Profile Modal ──────────────────────────────────────────────

const editModal = document.getElementById('editProfileModal')
const editOpenBtn = document.getElementById('editProfileBtn')
const editCloseBtn = document.getElementById('editProfileClose')
const editCancelBtn = document.getElementById('editProfileCancel')
const editSaveBtn = document.getElementById('editProfileSave')
const editDisplayNameInput = document.getElementById('editDisplayName')
const editBioInput = document.getElementById('editBio')
const editErrorEl = document.getElementById('editProfileError')
const avatarFileInput = document.getElementById('avatarFileInput')

let pendingAvatarFile = null

function openEditModal() {
  if (!me) return

  const displayName = me.displayName ?? me.display_name ?? me.userName ?? me.user_name ?? ''
  editDisplayNameInput.value = displayName
  editBioInput.value = me.bio ?? ''
  pendingAvatarFile = null
  hideEditError()

  // sync avatar preview in modal
  updateAvatarDisplay(me.profilePicture ?? me.profile_picture ?? null)

  editModal.style.display = 'flex'
  document.body.style.overflow = 'hidden'
}

function closeEditModal() {
  editModal.style.display = 'none'
  document.body.style.overflow = ''
  pendingAvatarFile = null
}

function showEditError(msg) {
  editErrorEl.textContent = msg
  editErrorEl.style.display = 'block'
}

function hideEditError() {
  editErrorEl.style.display = 'none'
  editErrorEl.textContent = ''
}

// avatar file picker preview
if (avatarFileInput) {
  avatarFileInput.addEventListener('change', () => {
    const file = avatarFileInput.files?.[0]
    if (!file) return
    pendingAvatarFile = file

    const reader = new FileReader()
    reader.onload = (e) => {
      const modalPreview = document.getElementById('modalAvatarPreview')
      if (modalPreview) {
        modalPreview.style.backgroundImage = `url('${e.target.result}')`
        modalPreview.style.backgroundSize = 'cover'
        modalPreview.style.backgroundPosition = 'center'
      }
    }
    reader.readAsDataURL(file)
  })
}

async function saveProfile() {
  hideEditError()
  editSaveBtn.disabled = true
  editSaveBtn.textContent = 'Saving...'

  try {
    let profilePictureUrl = me.profilePicture ?? me.profile_picture ?? null

    // 1) upload avatar first if a new file was picked
    if (pendingAvatarFile) {
      const formData = new FormData()
      formData.append('avatar', pendingAvatarFile)

      const avatarRes = await fetch('/api/user/profile/avatar', {
        method: 'POST',
        headers: { ...authHeaders() },
        body: formData,
      })
      const avatarJson = await avatarRes.json().catch(() => ({}))
      if (!avatarRes.ok) throw new Error(avatarJson?.error || 'Failed to upload photo')
      profilePictureUrl = avatarJson.profilePicture ?? avatarJson.profile_picture ?? profilePictureUrl
    }

    // 2) save everything in one single request
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...authHeaders() },
      body: JSON.stringify({
        displayName: editDisplayNameInput.value.trim(),
        bio: editBioInput.value.trim(),
        profilePicture: profilePictureUrl,
      }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.error || 'Failed to save profile')

    // 3) update local `me` and the UI
    me.displayName = editDisplayNameInput.value.trim()
    me.bio = editBioInput.value.trim()
    me.profilePicture = profilePictureUrl

    const displayNameEl = document.querySelector('[data-display-name]')
    const bioEl = document.querySelector('[data-bio]')
    if (displayNameEl) displayNameEl.textContent = me.displayName
    if (bioEl) bioEl.textContent = me.bio
    updateAvatarDisplay(profilePictureUrl)

    closeEditModal()
  } catch (err) {
    showEditError(err.message || 'Something went wrong. Please try again.')
  } finally {
    editSaveBtn.disabled = false
    editSaveBtn.textContent = 'Save'
  }
}

if (editOpenBtn) editOpenBtn.addEventListener('click', openEditModal)
if (editCloseBtn) editCloseBtn.addEventListener('click', closeEditModal)
if (editCancelBtn) editCancelBtn.addEventListener('click', closeEditModal)
if (editSaveBtn) editSaveBtn.addEventListener('click', saveProfile)

// close on overlay click
if (editModal) {
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal()
  })
}

// ── Filters ─────────────────────────────────────────────────────────

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

// ── Init ─────────────────────────────────────────────────────────────

async function initProfile() {
  const token = localStorage.getItem('accessToken')
  if (!token) return

  await loadMe()
  await loadJoinedFandoms()
  await loadProfileFeed()
}

initProfile().catch(console.error)