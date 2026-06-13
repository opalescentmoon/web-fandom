
const token = localStorage.getItem('accessToken')
const currentUser = JSON.parse(localStorage.getItem('currentUser'))

// ── Load conversation list ──────────────────────────────
async function loadChats() {
    const res = await fetch('/api/chats', {
        headers: { Authorization: `Bearer ${token}` }
    })
    const json = await res.json()
    const chats = json.data

    const listEl = document.querySelector('.chat-list-items')
    listEl.innerHTML = ''

    if (!chats || chats.length === 0) {
        listEl.innerHTML = '<p style="padding:0.5rem;opacity:0.6;font-size:0.85rem;">No chats yet</p>'
        return
    }

    chats.forEach((chat) => {
        console.log('chat:', chat.chatType, 'members:', JSON.stringify(chat.members))
        // For DMs, show the other person's name; for groups use chatName
        const otherMember = chat.members?.find((m) => m.userId !== currentUser.userId)
        const displayName = chat.chatType === 'dm'
            ? (otherMember?.displayName ?? 'Unknown')
            : (chat.chatName ?? 'Group Chat')

        const avatar = otherMember?.profilePicture
            ? `<img src="${otherMember.profilePicture}" style="width:40px;height:40px;border-radius:999px;object-fit:cover;" />`
            : `<div class="chat-avatar-circle"></div>`

        const lastMsg = chat.messages?.[0]?.messageText ?? 'No messages yet'

        const btn = document.createElement('button')
        btn.className = 'chat-list-item'
        btn.dataset.chatId = chat.id
        btn.innerHTML = `
            ${avatar}
            <div class="chat-list-text">
                <div class="chat-list-name">${displayName}</div>
                <div class="chat-list-last">${lastMsg}</div>
            </div>
        `
        btn.addEventListener('click', () => openChat(chat.id, displayName, otherMember?.profilePicture))
        listEl.appendChild(btn)
    })
}

let activeSubscription = null
function subscribeToChat(chatId) {
  // unsubscribe from previous chat if any
  if (activeSubscription) {
    activeSubscription.delete()
    activeSubscription = null
  }

  const transmit = new Transmit({
    baseUrl: window.location.origin,
    eventSourceFactory: (url) => {
        const urlWithToken = new URL(url)
        urlWithToken.searchParams.set('token', token)
        return new EventSource(urlWithToken.toString())
    }
  })

  activeSubscription = transmit.subscription(`chats/${chatId}`)
  activeSubscription.create().then(() => {
    console.log('subscription created successfully')
  }).catch((err) => {
    console.error('subscription error:', err)
  })

  activeSubscription.onMessage((data) => {
    console.log('received message:', data)
    const msg = data.message
    const isOwn = msg.senderId === currentUser.userId

    // avoid duplicating messages we sent ourselves
    if (isOwn) return

    const row = document.createElement('div')
    row.className = `chat-message-row incoming`
    row.innerHTML = `<div class="chat-bubble">${msg.messageText}</div>`

    const emptyMsg = chatArea.querySelector('p')
    if (emptyMsg) emptyMsg.remove()

    chatArea.appendChild(row)
    chatArea.scrollTop = chatArea.scrollHeight
  })
}

function subscribeToUserChannel() {
  const transmit = new Transmit({
    baseUrl: window.location.origin,
    eventSourceFactory: (url) => {
      const urlWithToken = new URL(url)
      urlWithToken.searchParams.set('token', token)
      return new EventSource(urlWithToken.toString())
    }
  })

  const subscription = transmit.subscription(`users/${currentUser.userId}/chats`)
  subscription.create().then(() => {
    console.log('subscribed to user channel')
  })

  subscription.onMessage(async () => {
    await loadChats()
  })
}

function subscribeToReadReceipts() {
  const transmit = new Transmit({
    baseUrl: window.location.origin,
    eventSourceFactory: (url) => {
      const urlWithToken = new URL(url)
      urlWithToken.searchParams.set('token', token)
      return new EventSource(urlWithToken.toString())
    }
  })

  const subscription = transmit.subscription(`users/${currentUser.userId}/read`)
  subscription.create().then(() => {
    console.log('subscribed to read receipts')
  })

  subscription.onMessage((data) => {
    console.log('read receipt received:', data)
    // only update if we're currently viewing that chat
    if (data.chatId === activeChatId) {
      // update all outgoing message checkmarks to blue
      document.querySelectorAll('.chat-message-row.outgoing .message-status').forEach(el => {
        el.classList.add('read')
      })
    }
  })
}

async function markChatAsRead(chatId) {
  await fetch(`/api/messages/chat/${chatId}/read`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
}

let activeChatId = null
function openChat(chatId, displayName, avatarUrl) {
    document.getElementById('chatEmptyState').style.display = 'none'
    const chatView = document.getElementById('chatView')
    chatView.style.display = 'flex'
    activeChatId = chatId

    // mark active in left panel
    document.querySelectorAll('.chat-list-item').forEach(btn => btn.classList.remove('is-active'))
    document.querySelector(`[data-chat-id="${chatId}"]`).classList.add('is-active')

    // update right panel header
    const headerAvatar = document.querySelector('.chat-main-header .chat-main-user .chat-avatar-circle, .chat-main-header .chat-main-user img')
    const headerName = document.querySelector('.chat-main-name')

    headerName.textContent = displayName
    if (avatarUrl) {
        headerAvatar.outerHTML = `<img src="${avatarUrl}" style="width:40px;height:40px;border-radius:999px;object-fit:cover;" />`
    }

    loadMessages(chatId)
    subscribeToChat(chatId)
    markChatAsRead(chatId) 
}

async function loadMessages(chatId) {
  const res = await fetch(`/api/chats/${chatId}/messages`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const json = await res.json()
  const messages = json.data

  const chatArea = document.querySelector('.chat-messages')
  chatArea.innerHTML = ''

  if (!messages || messages.length === 0) {
    chatArea.innerHTML = '<p style="text-align:center;opacity:0.5;font-size:0.85rem;margin-top:1rem;">No messages yet</p>'
    return
  }

  messages.forEach((msg) => {
    const isOwn = msg.senderId === currentUser.userId
    const row = document.createElement('div')
    row.className = `chat-message-row ${isOwn ? 'outgoing' : 'incoming'}`

    let statusHtml = ''
    if (isOwn) {
        const readByOther = msg.statuses?.find(
            s => s.userId !== currentUser.userId && s.readAt !== null
        )
        statusHtml = `<div class="message-status ${readByOther ? 'read' : ''}">✓✓</div>`
    }

    row.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:${isOwn ? 'flex-end' : 'flex-start'};">
        <div class="chat-bubble">${msg.messageText}</div>
        ${statusHtml}
      </div>
    `
    chatArea.appendChild(row)
  })

  chatArea.scrollTop = chatArea.scrollHeight
}

const chatForm = document.querySelector('.chat-input-bar')
const chatInput = chatForm.querySelector('input')
const chatArea = document.querySelector('.chat-messages')

async function sendMessage(text) {
  if (!activeChatId) return

  const res = await fetch('/api/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: activeChatId,
      message_text: text
    })
  })

  const json = await res.json()
  if (!res.ok) {
    console.error('Failed to send message:', json)
    return
  }

  const emptyMsg = chatArea.querySelector('p')
  if (emptyMsg) emptyMsg.remove()

  const row = document.createElement('div')
  row.className = 'chat-message-row outgoing'
  row.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:flex-end;">
      <div class="chat-bubble">${text}</div>
      <div class="message-status">✓✓</div>
    </div>
  `
  chatArea.appendChild(row)
  chatArea.scrollTop = chatArea.scrollHeight
}

chatForm.addEventListener('submit', (e) => {
  e.preventDefault()
  const text = chatInput.value.trim()
  if (!text) return
  sendMessage(text)
  chatInput.value = ''
})

// ── New Chat Modal ──────────────────────────────────────
const newChatBtn = document.getElementById('newChatBtn')
const newChatOverlay = document.getElementById('newChatOverlay')
const newChatClose = document.getElementById('newChatClose')
const userSearchInput = document.getElementById('userSearchInput')
const userSearchResults = document.getElementById('userSearchResults')
const selectedUsersEl = document.getElementById('selectedUsers')
const selectedChips = document.getElementById('selectedChips')
const chatTypeLabel = document.getElementById('chatTypeLabel')
const startChatBtn = document.getElementById('startChatBtn')

let selectedUsers = []

newChatBtn.addEventListener('click', () => {
  newChatOverlay.style.display = 'flex'
})

newChatClose.addEventListener('click', closeModal)
newChatOverlay.addEventListener('click', (e) => {
  if (e.target === newChatOverlay) closeModal()
})

function closeModal() {
  newChatOverlay.style.display = 'none'
  userSearchInput.value = ''
  userSearchResults.innerHTML = ''
  selectedUsers = []
  renderSelectedUsers()
}

// search users as you type
let searchTimeout
userSearchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout)
  const q = userSearchInput.value.trim()
  if (!q) {
    userSearchResults.innerHTML = ''
    return
  }
  searchTimeout = setTimeout(() => searchUsers(q), 300)
})

async function searchUsers(q) {
  const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const json = await res.json()
  const users = json.data

  userSearchResults.innerHTML = ''

  users
    .filter(u => u.userId !== currentUser.userId) // exclude yourself
    .filter(u => !selectedUsers.find(s => s.userId === u.userId)) // exclude already selected
    .forEach(u => {
      const btn = document.createElement('button')
      btn.className = 'modal-user-item'
      const avatar = u.profilePicture
        ? `<img src="${u.profilePicture}" />`
        : `<div class="modal-user-avatar"></div>`
      btn.innerHTML = `${avatar}<span class="modal-user-name">${u.displayName} <span style="opacity:0.5;font-size:0.78rem;">@${u.username}</span></span>`
      btn.addEventListener('click', () => selectUser(u))
      userSearchResults.appendChild(btn)
    })
}

function selectUser(user) {
  selectedUsers.push(user)
  userSearchInput.value = ''
  userSearchResults.innerHTML = ''
  renderSelectedUsers()
}

function removeUser(userId) {
  selectedUsers = selectedUsers.filter(u => u.userId !== userId)
  renderSelectedUsers()
}

function renderSelectedUsers() {
  if (selectedUsers.length === 0) {
    selectedUsersEl.style.display = 'none'
    startChatBtn.style.display = 'none'
    return
  }

  selectedUsersEl.style.display = 'block'
  startChatBtn.style.display = 'block'

  // update label
  if (selectedUsers.length === 1) {
    chatTypeLabel.textContent = '💬 This will be a DM'
  } else {
    chatTypeLabel.textContent = `👥 This will be a group chat (${selectedUsers.length + 1} people)`
  }

  // render chips
  selectedChips.innerHTML = ''
  selectedUsers.forEach(u => {
    const chip = document.createElement('div')
    chip.className = 'modal-chip'
    chip.innerHTML = `${u.displayName} <span class="modal-chip-remove" data-id="${u.userId}">&times;</span>`
    chip.querySelector('.modal-chip-remove').addEventListener('click', () => removeUser(u.userId))
    selectedChips.appendChild(chip)
  })
}

startChatBtn.addEventListener('click', async () => {
  const participantIds = selectedUsers.map(u => u.userId)
  const chatType = participantIds.length === 1 ? 'dm' : 'group'

  const res = await fetch('/api/chats', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      participant_ids: participantIds,
      chat_type: chatType
    })
  })

  const json = await res.json()
  if (!res.ok) {
    console.error('Failed to create chat:', json)
    return
  }

  closeModal()
  await loadChats() // refresh the chat list

  // auto-open the new chat
  const newChat = json.data
  const displayName = chatType === 'dm'
  ? selectedUsers[0].displayName
  : (newChat.chatName ?? 'Group Chat')
  const avatarUrl = chatType === 'dm' ? selectedUsers[0].profilePicture : null

  closeModal()
  await loadChats()
  openChat(newChat.id, displayName, avatarUrl)
})

// Back button
const backBtn = document.getElementById('chatBackButton')
if (backBtn) {
    backBtn.addEventListener('click', () => {
        if (window.history.length > 1) window.history.back()
        else window.location.href = '/'
    })
}

setTimeout(() => {
  loadChats()
  subscribeToUserChannel()
  subscribeToReadReceipts()
}, 100)