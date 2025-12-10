import router from '@adonisjs/core/services/router'
import { middleware } from '#start/middleware'
const AuthController = () => import('#controllers/auth_controller')
const LikesController = () => import('#controllers/likes_controller')

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
router.post('/likes/toggle', [LikesController, 'toggle']).middleware([middleware.auth()])