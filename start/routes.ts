import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
const AuthController = () => import('#controllers/auth_controller')
const LikesController = () => import('#controllers/likes_controller')
const ModController = () => import('#controllers/Admin/mod_controller')
const ChatController = () => import('#controllers/Chat & Messages/chats_controller')
const MessageController = () => import('#controllers/Chat & Messages/messages_controller')
const PollController = () => import('#controllers/polls_controller')
const FandomController = () => import('#controllers/fandoms_controller')
const RelationshipController = () => import('#controllers/relationships_controller')
const HashtagController = () => import('#controllers/hashtags_controller')
const WikisController = () => import('#controllers/wikis_controller')
const UserController = () => import('#controllers/User/users_controller')
const PostsController = () => import('#controllers/User/posts_controller')

/**
 * AUTH ROUTES
 */

router.post('/auth/register', [AuthController, 'register'])
router.post('/auth/login', [AuthController, 'login'])
router.post('/auth/logout', [AuthController, 'logout']).use(middleware.auth())
router.get('/auth/profile', [AuthController, 'getProfile']).use(middleware.auth())

/**
 * HOME AND MAIN ROUTES
 */
router.get('/', async ({ view, auth }) => {
  const user = auth.user // null if not logged in

  // later: real queries from DB
  const recentFandoms = user
    ? [] // fill with last visited fandoms when ready
    : []

  const forYouFandoms = user
    ? [] // personalised recommendations
    : []

  const popularFandoms = [
    { name: 'Honkai Star Rail', slug: 'honkai-star-rail' },
    { name: 'Reverse 1999', slug: 'reverse-1999' },
    { name: 'Wuthering Wave', slug: 'wuthering-wave' },
    { name: 'Zenless Zone Zero', slug: 'zenless-zone-zero' },
  ]
  return view.render('pages/intro', {
    user,
    recentFandoms,
    forYouFandoms,
    popularFandoms,
    title: 'Introduction',
  })
})

function makeFandomName(slug: string) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

// FANWORKS
router.get('/fanworks/:slug?', async ({ params, view, auth }) => {
  const slug = params.slug || 'default-fandom'
  const fandomName = makeFandomName(slug)

  return view.render('pages/homepage/fanworks', {
    title: fandomName,
    fandomName,
    activeTab: 'fanworks',
    slug,
    hasJoined: false,
    user: auth.user,
    isSearch: false,
    query: '',
  })
})

// WIKI
router.get('/wiki/:slug?', async ({ params, view, auth }) => {
  const slug = params.slug || 'default-fandom'
  const fandomName = makeFandomName(slug)

  return view.render('pages/homepage/wiki', {
    title: fandomName,
    fandomName,
    activeTab: 'wiki',
    slug,
    hasJoined: false,
    user: auth.user,
    isSearch: false,
    query: '',
  })
})

// FORUM
router.get('/forum/:slug?', async ({ params, view, auth }) => {
  const slug = params.slug || 'default-fandom'
  const fandomName = makeFandomName(slug)

  return view.render('pages/homepage/forum', {
    title: fandomName,
    fandomName,
    activeTab: 'forum',
    slug,
    hasJoined: false,
    user: auth.user,
    isSearch: false,
    query: '',
  })
})

router.on('/chats').render('pages/chats')
router.on('/profile').render('pages/profile')

router.get('/search', async ({ request, view, auth }) => {
  const slug = request.input('slug') || 'default-fandom'
  const fandomName = makeFandomName(slug)
  const query = request.input('q')
  const activeTab = request.input('tab') || 'fanworks'

  return view.render('pages/search', {
    title: 'Search',
    query,
    activeTab,
    fandomName,
    slug,
    hasJoined: false,
    user: auth.user,
    isSearch: true,
  })
})

// LIKE ROUTES
router
  .group(() => {
    router.post('/toggle', [LikesController, 'toggle']).use(middleware.auth())
    router.post('/add', [LikesController, 'store']).use(middleware.auth())
    router.get('/count', [LikesController, 'count'])
    router.delete('/delete', [LikesController, 'destroy']).use(middleware.auth())
  })
  .prefix('/api/likes')

// MODERATOR ROUTES
router
  .group(() => {
    router.post('/', [ModController, 'add'])
    router.get('/check/:userId', [ModController, 'check'])
    router.get('/user/:userId', [ModController, 'query'])
    router.get('/fandom/:fandomId', [ModController, 'byFandom'])
    router.delete('/:id', [ModController, 'delete'])
  })
  .prefix('/api/mods')
  .use(middleware.auth())

// CHAT & MESSAGES ROUTES
router
  .group(() => {
    router.post('/', [ChatController, 'create'])
    router.get('/:chatId/messages', [ChatController, 'messages'])
    router.post('/:chatId/add', [ChatController, 'addParticipant'])
    router.post('/:chatId/remove', [ChatController, 'removeParticipant'])
    router.get('/:chatId', [ChatController, 'find'])
  })
  .prefix('/api/chats')
  .use(middleware.auth())

router
  .group(() => {
    router.post('/send', [MessageController, 'send'])
    router.put('/:messageId/edit', [MessageController, 'edit'])
    router.delete('/:messageId', [MessageController, 'delete'])
    router.get('/:messageId/status', [MessageController, 'status'])
    router.post('/status/update', [MessageController, 'updateStatus'])
  })
  .prefix('/api/messages')
  .use(middleware.auth())

// POLL ROUTES
router
  .group(() => {
    router.post('/create', [PollController, 'create'])
    router.post('/options/add', [PollController, 'addOptions'])
    router.delete('/options/remove', [PollController, 'removeOption'])
    router.post('/vote', [PollController, 'vote'])
    router.delete('/delete', [PollController, 'delete'])
  })
  .prefix('/api/poll')
  .use(middleware.auth())

// FANDOM ROUTES
router
  .group(() => {
    router.post('/create', [FandomController, 'create']).use(middleware.auth())
    router.post('/join', [FandomController, 'join']).use(middleware.auth())
    router.get('/category', [FandomController, 'getByCategory'])
    router.get('/name', [FandomController, 'getByName'])
    router.put('/edit/name', [FandomController, 'editName']).use(middleware.auth())
    router.put('/edit/category', [FandomController, 'editCategory']).use(middleware.auth())
    router.delete('/delete', [FandomController, 'delete']).use(middleware.auth())
  })
  .prefix('/api/fandom')

// RELATIONSHIP ROUTES
router
  .group(() => {
    router.post('/follow', [RelationshipController, 'follow']).use(middleware.auth())
    router.post('/unfollow', [RelationshipController, 'unfollow']).use(middleware.auth())
    router.post('/toggle', [RelationshipController, 'toggle']).use(middleware.auth())
    router.get('/followers', [RelationshipController, 'followers'])
    router.get('/following', [RelationshipController, 'following'])
  })
  .prefix('/api/relationship')

// HASHTAG ROUTES
router
  .group(() => {
    router.post('/find-or-create', [HashtagController, 'findOrCreate'])
    router.get('/by-name', [HashtagController, 'getByName'])
    router.get('/all', [HashtagController, 'getAll'])
  })
  .prefix('/api/hashtags')

// USER ROUTES
router
  .group(() => {
    router.put('/profile', [UserController, 'editProfile'])
    router.put('/email', [UserController, 'updateEmail'])
    router.put('/password', [UserController, 'changePassword'])
    router.delete('/delete', [UserController, 'deleteUser'])
  })
  .prefix('/api/user')
  .use(middleware.auth())

// POST ROUTES

router
  .group(() => {
    router.post('/', [PostsController, 'create']).use(middleware.auth())
    router.get('/', [PostsController, 'getAll'])
    router.get('/:postId', [PostsController, 'get'])
    router.delete('/:postId', [PostsController, 'delete'])
    router.patch('/:postId', [PostsController, 'update'])

    /**
     * HASHTAGS
     */
    router.post('/:postId/hashtags', [PostsController, 'addHashtag'])
    router.delete('/:postId/hashtags/:hashtagId', [PostsController, 'removeHashtag'])

    /**
     * COMMENTS
     */
    router.get('/:postId/comments', [PostsController, 'comments'])

    /**
     * MEDIA
     */
    router.post('/:postId/media', [PostsController, 'addMedia'])
    router.get('/:postId/media', [PostsController, 'media'])
    router.delete('/:postId/media/:mediaId', [PostsController, 'removeMedia'])

    /**
     * FILTERS
     */
    router.get('/type/:postType', [PostsController, 'getByType'])
    router.get('/fandom/:fandomId', [PostsController, 'getByFandom'])
    router.get('/hashtag/:hashtagId', [PostsController, 'getByHashtag'])
  })
  .prefix('/api/posts')

/**
 * USER-BASED CONTENT
 */
router.get('/api/posts/user/:userId', [PostsController, 'getByUser'])

/**
 * COMMENT-RELATED
 */
router.get('/api/comments/user/:userId', [PostsController, 'commentsByUser'])
router.get('/api/comments', [PostsController, 'allComments'])

// WIKI ROUTES
router
  .group(() => {
    /**
     * CREATE + DELETE
     */
    router.post('/', [WikisController, 'createWiki'])
    router.delete('/:wikiId', [WikisController, 'deleteWiki'])

    /**
     * PAGE + REVISIONS
     */
    router.get('/:wikiId', [WikisController, 'getWikiPage'])
    router.post('/:wikiId/edits', [WikisController, 'addWikiPage'])
    router.get('/:wikiId/edits', [WikisController, 'getWikiEditsForPage'])
    router.post('/:wikiId/edit', [WikisController, 'editWikiPage'])

    /**
     * EDIT APPROVAL WORKFLOW
     */
    router.post('/edits/:editId/approve', [WikisController, 'approveWikiEdit'])
    router.post('/edits/:editId/reject', [WikisController, 'rejectWikiEdit'])
  })
  .prefix('/api/wikis')
