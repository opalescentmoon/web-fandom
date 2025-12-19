import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import Fandom from '#models/DBModel/fandom'
import db from '@adonisjs/lucid/services/db'
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
const SearchController = () => import('#controllers/search_controller')

/**
 * AUTH ROUTES
 */

router.post('/auth/register', [AuthController, 'register'])
router.post('/auth/login', [AuthController, 'login'])
router.post('/auth/logout', [AuthController, 'logout']).use(middleware.auth())
router.get('/auth/profile', [AuthController, 'getProfile']).use(middleware.auth())

/**
 * MAIN PAGES
 */
//INTRO PAGE
router.get('/', async ({ view, auth }) => {
  const user = auth.user // null if not logged in

  const fandoms = await Fandom
    .query()
    .preload('thumbnailMedia')
  
  return view.render('pages/intro', {
    title: 'Introduction',
    user,
    fandoms,
  })
})


// FANWORKS
router.get('/fanworks', async ({ request, view, auth }) => {
  const fandomName = request.input('fandom_name') || 'Fandom Name'
  const fandom = await Fandom.query().where('fandom_name', fandomName).first()
  const fandomId = fandom?.fandomId ?? null

  let hasJoined = false
  if (auth.user && fandomId !== null) {
    const row = await db
      .from('user_fandom')
      .where('user_id', auth.user.userId)
      .where('fandom_id', fandomId)
      .first()
    hasJoined = !!row
  }

  return view.render('pages/homepage/fanworks', {
    title: fandomName,
    fandomName,
    activeTab: 'fanworks',
    fandomId,
    hasJoined,
    user: auth.user,
    isSearch: false,
    query: '',
  })
})

// WIKI
router.get('/wiki', async ({ request, view, auth }) => {
  const fandomName = request.input('fandom_name') || 'Fandom Name'
  const fandom = await Fandom.query().where('fandom_name', fandomName).first()
  const fandomId = fandom?.fandomId ?? null

  let hasJoined = false
  if (auth.user && fandomId !== null) {
    const row = await db
      .from('user_fandom')
      .where('user_id', auth.user.userId)
      .where('fandom_id', fandomId)
      .first()
    hasJoined = !!row
  }

  return view.render('pages/homepage/wiki', {
    title: fandomName,
    fandomName,
    activeTab: 'wiki',
    fandomId,
    hasJoined,
    user: auth.user,
    isSearch: false,
    query: '',
  })
})

// FORUM
router.get('/forum', async ({ request, view, auth }) => {
  const fandomName = request.input('fandom_name') || 'Fandom Name'
  const fandom = await Fandom.query().where('fandom_name', fandomName).first()
  const fandomId = fandom?.fandomId ?? null

  let hasJoined = false
  if (auth.user && fandomId !== null) {
    const row = await db
      .from('user_fandom')
      .where('user_id', auth.user.userId)
      .where('fandom_id', fandomId)
      .first()
    hasJoined = !!row
  }

  return view.render('pages/homepage/forum', {
    title: fandomName,
    fandomName,
    activeTab: 'forum',
    fandomId,
    hasJoined,
    user: auth.user,
    isSearch: false,
    query: '',
  })
})

//PROFILE PAGE
router.get('/profile', async ({ view }) => {
  return view.render('pages/profile')
})


router.on('/chats').render('pages/chats')


// SEARCH ROUTES
router.get('/search', async ({ request, view, auth }) => {
  const fandomId = Number(request.input('fandomId')) || 0
  const fandomName = request.input('fandom_name') || 'Fandom Name'
  const query = request.input('q')
  const activeTab = request.input('tab') || 'fanworks'
  const branch = request.input('branch') || '' 

  return view.render('pages/search', {
    title: 'Search',
    query,
    activeTab,
    branch,
    fandomId,
    fandomName,
    hasJoined: false,
    user: auth.user,
    isSearch: true,
  })
})

router.get('/api/search', [SearchController, 'index'])

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
    router.get('/join-status', async ({ request, auth }) => {
      const fandomId = Number(request.input('fandomId'))
      if (!Number.isFinite(fandomId)) return { hasJoined: false }

      const user = auth.user! 

      const row = await db
        .from('user_fandom')
        .where('user_id', user.userId)
        .where('fandom_id', fandomId)
        .first()

      return { hasJoined: !!row }
    }).use(middleware.auth())
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
    router.get('/trending', [HashtagController, 'trending'])  
    router.post('/find-or-create', [HashtagController, 'findOrCreate'])
    router.get('/by-name', [HashtagController, 'getByName'])
    router.get('/used', [HashtagController, 'usedInBranch'])
    router.get('/all', [HashtagController, 'getAll'])
  })
  .prefix('/api/hashtags')

// USER ROUTES
router
  .group(() => {
    router.get('/me', [UserController, 'me'])
    router.get('/me/joined-fandoms', [UserController, 'joinedFandoms'])
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
    router.post('/:postId/hashtags', [PostsController, 'addHashtag']).use(middleware.auth())
    router.delete('/:postId/hashtags/:hashtagId', [PostsController, 'removeHashtag']).use(middleware.auth())

    /**
     * COMMENTS
     */
    router.get('/:postId/comments', [PostsController, 'comments'])

    /**
     * MEDIA
     */
    router.post('/:postId/media', [PostsController, 'addMedia']).use(middleware.auth())
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
