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

async function checkIsMod(fandomId) {
  const token = localStorage.getItem('accessToken')
  if (!token) return false

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
  if (!currentUser?.userId) return false

  try {
    const res = await fetch(`/api/mods/fandom/${fandomId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
    const data = await res.json()
    const mods = data?.data || []
    return mods.some(m => m.userId === currentUser.userId)
  } catch {
    return false
  }
}

// ─── Pending Edits (mod only) ─────────────────────────────────────────────────

async function loadPendingEdits() {
  const wikiId = document.body.dataset.wikiId
  const section = document.getElementById('pendingEditsSection')
  if (!section) return

  try {
    const res = await fetch(`/api/wikis/${wikiId}/edits`, {
      headers: {
        Accept: 'application/json',
        ...authHeaders(),
      },
    })

    const json = await res.json().catch(() => ({}))
    const edits = Array.isArray(json.data) ? json.data : []

    const pending = edits.filter(e => e.status === 'Pending')

    if (!pending.length) {
      section.innerHTML = `<div class="feed-loading">No pending edits</div>`
      return
    }

    section.innerHTML = pending.map(e => {
      const username = e.editor?.displayName ?? e.editor?.username ?? 'Unknown'
      return `
        <div class="post-card" style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:0.9rem;">Proposed by <strong>${escapeHtml(username)}</strong></div>
          <button class="modal-save-btn js-review-btn" 
            data-edit-id="${e.id}" 
            data-content="${escapeHtml(e.content)}"
            data-author="${escapeHtml(username)}"
            style="padding:0.3rem 0.8rem; font-size:0.85rem;">
            Review
          </button>
        </div>
      `
    }).join('')

  } catch (err) {
    console.error(err)
  }
}

function setupReviewModal() {
  const overlay = document.getElementById('reviewEditOverlay')
  const closeBtn = document.getElementById('reviewEditCloseBtn')
  const approveBtn = document.getElementById('reviewEditApproveBtn')
  const rejectBtn = document.getElementById('reviewEditRejectBtn')
  let currentEditId = null

  function closeReviewModal() {
    if (overlay) overlay.style.display = 'none'
    currentEditId = null
  }

  if (closeBtn) closeBtn.addEventListener('click', closeReviewModal)
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeReviewModal()
    })
  }

  // open modal when Review button clicked (delegated)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.js-review-btn')
    if (!btn) return

    currentEditId = btn.dataset.editId
    const author = btn.dataset.author
    const content = btn.dataset.content

    document.getElementById('reviewEditAuthor').textContent = author
    document.getElementById('reviewEditContent').textContent = content
    if (overlay) overlay.style.display = 'flex'
  })

  if (approveBtn) {
    approveBtn.addEventListener('click', async () => {
      if (!currentEditId) return
      try {
        approveBtn.disabled = true
        approveBtn.textContent = 'Approving...'

        const res = await fetch(`/api/wikis/edits/${currentEditId}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ fandomId: Number(document.body.dataset.fandomId) }),
        })

        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.message || 'Failed to approve edit')

        closeReviewModal()
        alert('Edit approved!')
        await loadWiki()
        await loadPendingEdits()
      } catch (err) {
        alert(err.message || 'Something went wrong.')
      } finally {
        approveBtn.disabled = false
        approveBtn.textContent = 'Approve'
      }
    })
  }

  if (rejectBtn) {
    rejectBtn.addEventListener('click', async () => {
      if (!currentEditId) return
      try {
        rejectBtn.disabled = true
        rejectBtn.textContent = 'Rejecting...'

        const res = await fetch(`/api/wikis/edits/${currentEditId}/reject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ fandomId: Number(document.body.dataset.fandomId) }),
        })

        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.message || 'Failed to reject edit')

        closeReviewModal()
        alert('Edit rejected.')
        await loadPendingEdits()
      } catch (err) {
        alert(err.message || 'Something went wrong.')
      } finally {
        rejectBtn.disabled = false
        rejectBtn.textContent = 'Reject'
      }
    })
  }
}

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

    // check mod status
    const isMod = fandomId ? await checkIsMod(fandomId) : false

    const contentId = data.contentId ?? data.content_id
    const branch = contentId === 5 ? 'Lore' : contentId === 6 ? 'Worldbuilding' : 'Official'
    const content = data.content ?? 'No content yet.'
    const hashtags = Array.isArray(data.hashtags) ? data.hashtags : []
    const hashtagHtml = hashtags.map(h => {
    const name = h.name ?? h.hashtagName ?? h.hashtag_name ?? ''
    if (!name) return ''
    return `<a href="#" class="post-hashtag js-hashtag" data-tag="${escapeHtml(name)}">#${escapeHtml(name)}</a>`
    }).filter(Boolean).join(' ')
    const media = Array.isArray(data.media) ? data.media : []
    const mediaHtml = media.map(m => {
    const url = m.fileUrl ?? m.file_url
    if (!url) return ''
    return `
        <div class="post-media-wrap" style="position:relative; display:inline-block;">
        <img class="post-media" src="${url}" alt="Wiki media" />
        ${isMod ? `<button class="js-remove-media-btn" data-media-id="${m.id}" style="position:absolute; top:4px; right:4px; background:rgba(0,0,0,0.5); color:white; border:none; border-radius:50%; width:24px; height:24px; cursor:pointer;">×</button>` : ''}
        </div>
    `
    }).join('')

    section.innerHTML = `
    <article class="post-card">
        <header class="post-header">
        <div class="post-user-text">
            <div class="wiki-card-title">${escapeHtml(data.title ?? 'Untitled')}</div>
        </div>
        <div class="post-branch">${escapeHtml(branch)}</div>
        </header>
        <main class="post-body">
        <p>${escapeHtml(content)}</p>
        ${mediaHtml}
        </main>
        <footer class="post-footer">
        <div class="post-hashtags">${hashtagHtml}</div>
        <div class="post-actions">
            ${IS_LOGGED_IN ? `
            <button class="wiki-request-edit-btn" id="requestEditBtn">
                ${isMod ? '+ Edit' : '+ Request Edit'}
            </button>
            ${isMod ? `
                <button class="wiki-request-edit-btn" id="addMediaBtn">📷 Add Image</button>
                <input type="file" id="wikiMediaInput" accept="image/jpg,image/jpeg,image/png" style="display:none;" />
            ` : ''}
            ` : ''}
        </div>
        </footer>
    </article>
    `

    const requestEditBtn = document.getElementById('requestEditBtn')
    if (requestEditBtn) {
    requestEditBtn.addEventListener('click', () => {
        if (isMod) {
        openEditModal(content, data.hashtags ?? [])
        } else {
        openRequestEditModal(content)
        }
    })
    }

    // add media button (mod only)
    const addMediaBtn = document.getElementById('addMediaBtn')
    const wikiMediaInput = document.getElementById('wikiMediaInput')

    if (addMediaBtn && wikiMediaInput) {
    addMediaBtn.addEventListener('click', () => wikiMediaInput.click())

    wikiMediaInput.addEventListener('change', async () => {
        const file = wikiMediaInput.files?.[0]
        if (!file) return

        try {
        addMediaBtn.disabled = true
        addMediaBtn.textContent = 'Uploading...'

        const fd = new FormData()
        fd.append('media', file)
        fd.append('wikiId', wikiId)
        fd.append('fandomId', document.body.dataset.fandomId)

        const res = await fetch(`/api/wikis/${wikiId}/add/media`, {
            method: 'POST',
            headers: { ...authHeaders() },
            body: fd,
        })

        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.error || 'Failed to upload media')

        await loadWiki()
        } catch (err) {
        alert(err.message || 'Failed to upload media')
        } finally {
        addMediaBtn.disabled = false
        addMediaBtn.textContent = '📷 Add Image'
        }
    })
    }

    // remove media buttons (mod only)
    document.querySelectorAll('.js-remove-media-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const mediaId = btn.dataset.mediaId
        if (!confirm('Remove this image?')) return

        try {
        const res = await fetch(`/api/wikis/${wikiId}/delete/media`, {
            method: 'DELETE',
            headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...authHeaders(),
            },
            body: JSON.stringify({
            wikiId: Number(wikiId),
            mediaId: Number(mediaId),
            fandomId: Number(document.body.dataset.fandomId),
            }),
        })

        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.error || 'Failed to remove media')

        await loadWiki()
        } catch (err) {
        alert(err.message || 'Failed to remove media')
        }
    })
    })

    if (isMod) {
        const pendingSection = document.createElement('div')
        pendingSection.id = 'pendingEditsSection'
        pendingSection.innerHTML = `
            <div style="margin-top:1rem;">
            <h4 style="margin-bottom:0.5rem;">Pending Edits</h4>
            <div class="feed-loading">Loading...</div>
            </div>
        `
        section.appendChild(pendingSection)
        await loadPendingEdits()
    }

  } catch (err) {
    console.error(err)
    section.innerHTML = `<div class="feed-loading">Failed to load wiki page</div>`
  }
}

function openRequestEditModal(currentContent) {
  const overlay = document.getElementById('requestEditOverlay')
  const textarea = document.getElementById('requestEditContent')
  const errorEl = document.getElementById('requestEditError')
  if (!overlay) return

  if (textarea) textarea.value = currentContent
  if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = '' }
  overlay.style.display = 'flex'
}

function openEditModal(currentContent, currentHashtags = []) {
  const overlay = document.getElementById('editWikiOverlay')
  const textarea = document.getElementById('editWikiContent')
  const tagsInput = document.getElementById('editWikiTags')
  const errorEl = document.getElementById('editWikiError')
  if (!overlay) return

  if (textarea) textarea.value = currentContent
  if (tagsInput) {
    // prefill dengan hashtags yang udah ada
    tagsInput.value = currentHashtags.map(h => `#${h.name ?? h.hashtagName ?? h.hashtag_name ?? ''}`).join(' ')
  }
  if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = '' }
  overlay.style.display = 'flex'
}

function setupModals() {
  const wikiId = document.body.dataset.wikiId

  // ── Request Edit Modal (non-mod) ──
  const requestEditOverlay = document.getElementById('requestEditOverlay')
  const requestEditCloseBtn = document.getElementById('requestEditCloseBtn')
  const requestEditCancelBtn = document.getElementById('requestEditCancelBtn')
  const requestEditSaveBtn = document.getElementById('requestEditSaveBtn')
  const requestEditError = document.getElementById('requestEditError')

  function closeRequestEditModal() {
    if (requestEditOverlay) requestEditOverlay.style.display = 'none'
  }

  if (requestEditCloseBtn) requestEditCloseBtn.addEventListener('click', closeRequestEditModal)
  if (requestEditCancelBtn) requestEditCancelBtn.addEventListener('click', closeRequestEditModal)
  if (requestEditOverlay) {
    requestEditOverlay.addEventListener('click', (e) => {
      if (e.target === requestEditOverlay) closeRequestEditModal()
    })
  }

  if (requestEditSaveBtn) {
    requestEditSaveBtn.addEventListener('click', async () => {
      const content = document.getElementById('requestEditContent')?.value.trim()
      if (!content) {
        requestEditError.textContent = 'Content cannot be empty.'
        requestEditError.style.display = 'block'
        return
      }

      try {
        requestEditSaveBtn.disabled = true
        requestEditSaveBtn.textContent = 'Submitting...'

        const res = await fetch(`/api/wikis/${wikiId}/edit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ content }),
        })

        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.message || 'Failed to submit edit')

        closeRequestEditModal()
        alert('Edit submitted for review!')
      } catch (err) {
        requestEditError.textContent = err.message || 'Something went wrong.'
        requestEditError.style.display = 'block'
      } finally {
        requestEditSaveBtn.disabled = false
        requestEditSaveBtn.textContent = 'Submit'
      }
    })
  }

  // ── Edit Modal (mod) ──
  const editWikiOverlay = document.getElementById('editWikiOverlay')
  const editWikiCloseBtn = document.getElementById('editWikiCloseBtn')
  const editWikiCancelBtn = document.getElementById('editWikiCancelBtn')
  const editWikiSaveBtn = document.getElementById('editWikiSaveBtn')
  const editWikiError = document.getElementById('editWikiError')
  const fandomId = document.body.dataset.fandomId

  function closeEditWikiModal() {
    if (editWikiOverlay) editWikiOverlay.style.display = 'none'
  }

  if (editWikiCloseBtn) editWikiCloseBtn.addEventListener('click', closeEditWikiModal)
  if (editWikiCancelBtn) editWikiCancelBtn.addEventListener('click', closeEditWikiModal)
  if (editWikiOverlay) {
    editWikiOverlay.addEventListener('click', (e) => {
      if (e.target === editWikiOverlay) closeEditWikiModal()
    })
  }

  if (editWikiSaveBtn) {
    editWikiSaveBtn.addEventListener('click', async () => {
      const content = document.getElementById('editWikiContent')?.value.trim()
      const tagsRaw = document.getElementById('editWikiTags')?.value.trim()
      if (!content) {
        editWikiError.textContent = 'Content cannot be empty.'
        editWikiError.style.display = 'block'
        return
      }

      try {
        editWikiSaveBtn.disabled = true
        editWikiSaveBtn.textContent = 'Saving...'

        const res = await fetch(`/api/wikis/${wikiId}/edits/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ fandomId: Number(fandomId), content }),
        })

        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.message || 'Failed to save edit')
        
        // step 2: sync hashtags
        const newTags = (tagsRaw || '')
            .split(/[\s,]+/)
            .map(t => t.replace(/^#/, '').trim().toLowerCase())
            .filter(Boolean)

        // get current hashtags from page
        const currentWikiRes = await fetch(`/api/wikis/${wikiId}`, {
            headers: { Accept: 'application/json', ...authHeaders() },
        })
        const currentWikiJson = await currentWikiRes.json()
        const currentWikiData = currentWikiJson.data ?? currentWikiJson
        const currentHashtags = Array.isArray(currentWikiData.hashtags) ? currentWikiData.hashtags : []
        const currentTagNames = currentHashtags.map(h => (h.name ?? h.hashtagName ?? '').toLowerCase())
        const currentTagMap = new Map(currentHashtags.map(h => [
            (h.name ?? h.hashtagName ?? '').toLowerCase(),
            h.id
        ]))

        // tags to add
        const tagsToAdd = newTags.filter(t => !currentTagNames.includes(t))
        // tags to remove
        const tagsToRemove = currentHashtags.filter(h => 
            !newTags.includes((h.name ?? h.hashtagName ?? '').toLowerCase())
        )

        // add new tags
        for (const tag of tagsToAdd) {
            const hRes = await fetch('/api/hashtags/find-or-create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...authHeaders(),
            },
            body: JSON.stringify({ tag }),
            })
            const hashtag = await hRes.json().catch(() => ({}))
            if (!hRes.ok) continue

            const hashtagId = hashtag.hashtagId ?? hashtag.id ?? hashtag.hashtag?.id
            if (!hashtagId) continue

            await fetch(`/api/wikis/${wikiId}/add/hashtags`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...authHeaders(),
            },
            body: JSON.stringify({ hashtagId, fandomId: Number(fandomId) }),
            })
        }

        // remove old tags
        for (const hashtag of tagsToRemove) {
            await fetch(`/api/wikis/${wikiId}/delete/hashtags/${hashtag.id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...authHeaders(),
            },
            body: JSON.stringify({ fandomId: Number(fandomId) }),
            })
        }

        closeEditWikiModal()
        alert('Wiki updated!')
        await loadWiki()
      } catch (err) {
        editWikiError.textContent = err.message || 'Something went wrong.'
        editWikiError.style.display = 'block'
      } finally {
        editWikiSaveBtn.disabled = false
        editWikiSaveBtn.textContent = 'Save'
      }
    })
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
  setupModals() 
  setupReviewModal()
})