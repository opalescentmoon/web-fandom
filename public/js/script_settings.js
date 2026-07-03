// ===== Back button =====
const backBtn = document.getElementById('settingsBackButton')
if (backBtn) {
  backBtn.addEventListener('click', () => {
    if (window.history.length > 1) window.history.back()
    else window.location.href = '/'
  })
}

// ===== Sidebar panel switching =====
const sidebarItems = document.querySelectorAll('.settings-list-item')
sidebarItems.forEach((item) => {
  item.addEventListener('click', () => {
    sidebarItems.forEach((i) => i.classList.remove('is-active'))
    item.classList.add('is-active')

    const targetPanel = item.dataset.panel
    document.querySelectorAll('.settings-panel').forEach((panel) => {
      panel.style.display = panel.id === `panel-${targetPanel}` ? 'block' : 'none'
    })
  })
})

// ===== Helper: get auth token =====
function getAuthToken() {
  return localStorage.getItem('accessToken')
}

// ===== Helper: mask email (keep first 2 chars of local part + domain) =====
function maskEmail(email) {
  if (!email || !email.includes('@')) return email
  const [local, domain] = email.split('@')
  const visible = local.slice(0, 2)
  const masked = visible + '*'.repeat(Math.max(local.length - 2, 1))
  return `${masked}@${domain}`
}

// ===== Load current user data and populate row values =====
let currentUserData = null

async function loadCurrentUserData() {
  try {
    const res = await fetch('/api/user/me', {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })
    if (!res.ok) throw new Error('Failed to load user data')

    currentUserData = await res.json()

    document.getElementById('currentEmailDisplay').textContent = maskEmail(currentUserData.email)
    document.getElementById('currentUsernameDisplay').textContent = currentUserData.username
  } catch (err) {
    document.getElementById('currentEmailDisplay').textContent = 'Unable to load'
    document.getElementById('currentUsernameDisplay').textContent = 'Unable to load'
  }
}

loadCurrentUserData()

// ===== Helper: generic modal open/close =====
function openModal(overlayId) {
  document.getElementById(overlayId).style.display = 'flex'
}
function closeModal(overlayId) {
  document.getElementById(overlayId).style.display = 'none'
}
function showError(errorId, message) {
  const el = document.getElementById(errorId)
  el.textContent = message
  el.style.display = 'block'
}
function hideError(errorId) {
  const el = document.getElementById(errorId)
  el.style.display = 'none'
}

// ============================================================
// CHANGE EMAIL
// ============================================================
document.getElementById('openChangeEmail').addEventListener('click', () => {
  hideError('changeEmailError')
  document.getElementById('newEmailInput').value = ''
  document.getElementById('emailCurrentPasswordInput').value = ''
  openModal('changeEmailOverlay')
})
document.getElementById('closeChangeEmail').addEventListener('click', () => closeModal('changeEmailOverlay'))
document.getElementById('closeChangeEmail2').addEventListener('click', () => closeModal('changeEmailOverlay'))

document.getElementById('submitChangeEmail').addEventListener('click', async () => {
  hideError('changeEmailError')

  const email = document.getElementById('newEmailInput').value.trim()
  const currentPassword = document.getElementById('emailCurrentPasswordInput').value

  if (!email) return showError('changeEmailError', 'Please enter a new email.')
  if (!currentPassword) return showError('changeEmailError', 'Please enter your current password.')

  try {
    const res = await fetch('/api/user/email', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ email, currentPassword }),
    })

    const data = await res.json()
    if (!res.ok) return showError('changeEmailError', data.error || 'Failed to update email.')

    document.getElementById('currentEmailDisplay').textContent = maskEmail(email)

    alert('Email updated successfully!')
    closeModal('changeEmailOverlay')
  } catch (err) {
    showError('changeEmailError', 'Something went wrong. Please try again.')
  }
})

// ============================================================
// CHANGE USERNAME
// ============================================================
document.getElementById('openChangeUsername').addEventListener('click', () => {
  hideError('changeUsernameError')
  document.getElementById('newUsernameInput').value = ''
  openModal('changeUsernameOverlay')
})
document.getElementById('closeChangeUsername').addEventListener('click', () => closeModal('changeUsernameOverlay'))
document.getElementById('closeChangeUsername2').addEventListener('click', () => closeModal('changeUsernameOverlay'))

document.getElementById('submitChangeUsername').addEventListener('click', async () => {
  hideError('changeUsernameError')

  const username = document.getElementById('newUsernameInput').value.trim()
  if (!username) return showError('changeUsernameError', 'Please enter a new username.')

  try {
    const res = await fetch('/api/user/username', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ username }),
    })

    const data = await res.json()
    if (!res.ok) return showError('changeUsernameError', data.error || 'Failed to update username.')

    // keep localStorage currentUser in sync
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    currentUser.username = username
    localStorage.setItem('currentUser', JSON.stringify(currentUser))

    document.getElementById('currentUsernameDisplay').textContent = username

    alert('Username updated successfully!')
    closeModal('changeUsernameOverlay')
  } catch (err) {
    showError('changeUsernameError', 'Something went wrong. Please try again.')
  }
})

// ============================================================
// CHANGE PASSWORD
// ============================================================
document.getElementById('openChangePassword').addEventListener('click', () => {
  hideError('changePasswordError')
  document.getElementById('currentPasswordInput').value = ''
  document.getElementById('newPasswordInput').value = ''
  document.getElementById('confirmNewPasswordInput').value = ''
  openModal('changePasswordOverlay')
})
document.getElementById('closeChangePassword').addEventListener('click', () => closeModal('changePasswordOverlay'))
document.getElementById('closeChangePassword2').addEventListener('click', () => closeModal('changePasswordOverlay'))

document.getElementById('submitChangePassword').addEventListener('click', async () => {
  hideError('changePasswordError')

  const currentPassword = document.getElementById('currentPasswordInput').value
  const newPassword = document.getElementById('newPasswordInput').value
  const confirmNewPassword = document.getElementById('confirmNewPasswordInput').value

  if (!currentPassword) return showError('changePasswordError', 'Please enter your current password.')
  if (!newPassword) return showError('changePasswordError', 'Please enter a new password.')
  if (newPassword !== confirmNewPassword) return showError('changePasswordError', 'New passwords do not match.')

  try {
    const res = await fetch('/api/user/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    })

    const data = await res.json()
    if (!res.ok) return showError('changePasswordError', data.error || 'Failed to update password.')

    alert('Password updated successfully!')
    closeModal('changePasswordOverlay')
  } catch (err) {
    showError('changePasswordError', 'Something went wrong. Please try again.')
  }
})

// ============================================================
// DELETE ACCOUNT (simple confirm, no modal needed per your earlier call)
// ============================================================
document.getElementById('openDeleteAccount').addEventListener('click', async () => {
  const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.')
  if (!confirmed) return

  try {
    const res = await fetch('/api/user/delete', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    const data = await res.json()
    if (!res.ok) {
      alert(data.error || 'Failed to delete account.')
      return
    }

    localStorage.removeItem('accessToken')
    localStorage.removeItem('currentUser')
    alert('Your account has been deleted.')
    window.location.href = '/'
  } catch (err) {
    alert('Something went wrong. Please try again.')
  }
})

// ============================================================
// FANDOMS MODAL
// ============================================================
document.getElementById('openFandomsModal').addEventListener('click', async () => {
  openModal('fandomsOverlay')

  const listEl = document.getElementById('fandomsModalList')
  listEl.textContent = 'Loading...'

  try {
    const res = await fetch('/api/user/me/joined-fandoms', {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    })
    const fandoms = await res.json()

    if (!fandoms.length) {
      listEl.innerHTML = '<p style="font-size:0.85rem;color:#999;">You haven\'t joined any fandoms yet.</p>'
      return
    }

    listEl.innerHTML = fandoms.map(f => `
      <div class="settings-fandom-row" id="fandom-row-${f.fandomId}">
        <span class="settings-fandom-name">${f.fandomName}</span>
        <button class="modal-cancel-btn" style="font-size:0.78rem;padding:0.3rem 0.75rem;" data-id="${f.fandomId}">Leave</button>
      </div>
    `).join('')

    listEl.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const fandomId = Number(btn.dataset.id)
        const confirmed = confirm('Leave this fandom?')
        if (!confirmed) return

        const res = await fetch('/api/fandom/leave', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({ fandomId }),
        })

        if (res.ok) {
          document.getElementById(`fandom-row-${fandomId}`)?.remove()
          if (!listEl.querySelector('.settings-fandom-row')) {
            listEl.innerHTML = '<p style="font-size:0.85rem;color:#999;">You haven\'t joined any fandoms yet.</p>'
          }
        } else {
          alert('Failed to leave fandom. Please try again.')
        }
      })
    })
  } catch (err) {
    listEl.innerHTML = '<p style="font-size:0.85rem;color:#c0392b;">Something went wrong.</p>'
  }
})

document.getElementById('closeFandomsModal').addEventListener('click', () => closeModal('fandomsOverlay'))

// ============================================================
// UNDER DEVELOPMENT MODAL
// ============================================================
document.querySelectorAll('.open-under-dev').forEach(el => {
  el.addEventListener('click', () => openModal('underDevOverlay'))
})

document.getElementById('closeUnderDevModal').addEventListener('click', () => closeModal('underDevOverlay'))
