/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

/*router.on('/').render('pages/home')*/
router.on('/').render('pages/intro')
router.on('/fanworks').render('pages/homepage/fanworks')
router.on('/wiki').render('pages/homepage/wiki')
router.on('/forum').render('pages/homepage/forum')
router.on('/chats').render('pages/chats')
router.on('/profile').render('pages/profile')

router.get('/search', async ({ request, view }) => {
  const query = request.input('q')
  const activeTab = request.input('tab') || 'fanworks'

  return view.render('pages/search', {
    query,
    activeTab,
  })
})