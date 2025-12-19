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

function applyBranchAndReload() {
  // ✅ THIS is what your loadFeed() reads
  document.body.dataset.activeBranch = selectedBranch || ''
  setBranchActiveUI()
  return loadFeed()
}

document.addEventListener(
  'click',
  async (e) => {
    // 1) Click on Lore/World collapse headers (which ALSO act as branch toggles)
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

      // Clicking the same open branch => close + clear filter
      if (isSameBranch && isOpen) {
        selectedBranch = null
        closeAllCollapses(null)
        await applyBranchAndReload()
        return
      }

      // Otherwise: select this branch + open its list + close others
      selectedBranch = b
      closeAllCollapses(targetId)
      body.classList.add('is-open')
      collapseBtn.classList.add('is-open')

      await applyBranchAndReload()
      return
    }

    // 2) Click on any normal branch link (Announcement, etc.)
    const branchBtn = e.target.closest('.js-branch[data-branch]')
    if (branchBtn) {
      e.preventDefault()
      e.stopImmediatePropagation()

      const b = branchBtn.dataset.branch
      selectedBranch = selectedBranch === b ? null : b

      // normal branches should close dropdowns
      closeAllCollapses(null)

      await applyBranchAndReload()
      return
    }
  },
  true
)



async function loadBranchTagList(branch, ulId) {
  const ul = document.getElementById(ulId)
  if (!ul) return

  ul.innerHTML = `<li class="muted">Loading...</li>`

  const fandomId = Number(document.body.dataset.fandomId) // add this to your layout
  const url = `/api/hashtags/used?fandomId=${fandomId}&branch=${encodeURIComponent(branch)}`
  console.log('[tags] fandomId raw:', document.body.dataset.fandomId, 'parsed:', fandomId)

  console.log('[tags] start', branch, ulId)
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
  })
  console.log('[tags] fetched', branch, res.status)

  const data = await res.json().catch(() => [])
  console.log('[tags] data', branch, data)
  if (!res.ok) {
    ul.innerHTML = `<li class="muted">Failed to load</li>`
    console.warn('used tags failed:', data)
    return
  }

  if (!Array.isArray(data) || data.length === 0) {
    ul.innerHTML = `<li class="muted">No tags yet</li>`
    return
  }

  ul.innerHTML = data
    .map(t => {
      const name = t.hashtagName || t.hashtag_name
      return `<li><a href="#" class="js-hashtag" data-tag="${escapeHtml(name)}">#${escapeHtml(name)}</a></li>`
    })
    .join('')
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadBranchTagList('Lore', 'lore-list')
  await loadBranchTagList('Worldbuilding', 'world-list')
})

