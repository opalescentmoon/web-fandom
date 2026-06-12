// ─── Helpers ────────────────────────────────────────────────────────────────

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

// ─── Render Post Card ────────────────────────────────────────────────────────

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
  const pollHtml =
    poll?.options?.length
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
          <a href="/profile/${p.user?.userId ?? p.user?.user_id}" class="post-user-link">
            <div class="avatar-circle" style="${avatarUrl ? `background-image:url('${avatarUrl}'); background-size:cover; background-position:center;` : ''}"></div>
            <div class="post-user-text">
              <div class="post-username">${escapeHtml(username)}</div>
            </div>
          </a>
        </div>
        <div class="post-branch">${escapeHtml(contentBranch || '')}</div>
      </header>

      <main class="post-body">
        <p>${escapeHtml(caption)}</p>
        ${pollHtml}
        ${mediaHtml}
      </main>

      <footer class="post-footer">
        <div class="post-hashtags">${hashtagHtml || ''}</div>
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
          <a href="/posts/${postId}" class="post-comment-btn" onclick="event.stopPropagation()">
            <span>💬</span>
            <span class="post-comment-count">${Number(p.commentCount ?? p.comment_count ?? 0)}</span>
          </a>
        </div>
      </footer>
    </article>
  `
}

// ─── Render Comment ──────────────────────────────────────────────────────────

function renderComment(c) {
  const username =
    c.user?.displayName ??
    c.user?.display_name ??
    c.user?.userName ??
    c.user?.user_name ??
    'User'
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

// ─── Load Post ───────────────────────────────────────────────────────────────

async function loadPost() {
  const postId = document.body.dataset.postId
  const section = document.getElementById('postSection')
  if (!section) return

  try {
    const res = await fetch(`/api/posts/${postId}`, {
      headers: {
        Accept: 'application/json',
        ...(IS_LOGGED_IN ? authHeaders() : {}),
      },
    })
    const post = await res.json()
    if (!res.ok) throw new Error(post?.error || 'Failed to load post')

    // Fill in the fandom name in the banner
    const fandomName = post.fandomName ?? post.fandom_name ?? post.fandom?.fandomName ?? ''
    const bannerName = document.getElementById('postFandomName')
    if (bannerName && fandomName) bannerName.textContent = fandomName

    // Store fandomId on body for trending to use
    const fandomId = post.fandomId ?? post.fandom_id
    if (fandomId) document.body.dataset.fandomId = fandomId

    section.innerHTML = renderPostCard(post)
  } catch (err) {
    console.error(err)
    section.innerHTML = `<div class="feed-loading">Failed to load post</div>`
  }
}

// ─── Load Comments ───────────────────────────────────────────────────────────

async function loadComments() {
  const postId = document.body.dataset.postId
  const section = document.getElementById('commentsSection')
  if (!section) return

  try {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      headers: {
        Accept: 'application/json',
        ...(IS_LOGGED_IN ? authHeaders() : {}),
      },
    })
    const comments = await res.json()
    if (!res.ok) throw new Error(comments?.error || 'Failed to load comments')

    if (!Array.isArray(comments) || !comments.length) {
      section.innerHTML = `<div class="feed-loading">No comments yet. Be the first!</div>`
      return
    }

    section.innerHTML = comments.map(renderComment).join('')
  } catch (err) {
    console.error(err)
    section.innerHTML = `<div class="feed-loading">Failed to load comments</div>`
  }
}

// ─── Load Trending ───────────────────────────────────────────────────────────

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
        Accept: 'application/json',
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

    list.innerHTML = tags
      .map(
        (t) => `
      <li>
        <a href="#" class="js-hashtag" data-tag="${escapeHtml(t.name)}">#${escapeHtml(t.name)}</a>
      </li>
    `
      )
      .join('')
  } catch (err) {
    console.error(err)
    list.innerHTML = `<li class="feed-loading">Failed to load</li>`
  }
}

// ─── Submit Comment ──────────────────────────────────────────────────────────

async function submitComment() {
  const postId = document.body.dataset.postId
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
        parentId: Number(postId),
        postType: 'normal',
        fandomId: null,
        contentId: 0,
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Failed to post comment')

    input.value = ''
    await loadComments() // refresh comments after posting
  } catch (err) {
    console.error(err)
    alert('Failed to post comment. Please try again.')
  }
}

// ─── Show Comment Input If Logged In ────────────────────────────────────────

function setupCommentInput() {
  if (!IS_LOGGED_IN) return

  const box = document.getElementById('commentInputBox')
  if (box) box.style.display = 'flex'

  // Set avatar from localStorage
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

  // Also allow Enter key to submit
  const input = document.getElementById('commentInput')
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitComment()
    })
  }
}

// ─── Init ────────────────────────────────────────────────────────────────────

async function init() {
  await loadPost()
  await loadComments()
  loadTrendingHashtags() // no need to await, loads independently
  setupCommentInput()
}

document.addEventListener('DOMContentLoaded', init)