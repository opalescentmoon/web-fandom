import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  /**
   * Configure CSP policies for your app. Refer documentation
   * to learn more
   */
  csp: {
    enabled: false,
    directives: {},
    reportOnly: false,
  },

  /**
   * Configure CSRF protection options. Refer documentation
   * to learn more
   */
  csrf: {
    enabled: true,
    exceptRoutes: [
      // '/auth/login',
      '/auth/register',
      // '/auth/logout',
      '/api/*',

      '/api/poll/create',

      '/api/poll/options/add',

      '/api/poll/options/remove',

      '/api/poll/vote',

      '/api/poll/delete',

      '/api/likes/toggle',

      '/api/hashtags/find-or-create',
      '/api/posts/:postId/hashtags',

      '/api/posts',
      '/api/posts/*',

      '/api/posts/:postId/media',

      '/api/fandom/join',
      '/api/fandom/create',

      '/api/user/profile',
      '/api/user/profile/avatar',
      '/api/relationship/toggle',

      '/api/likes/*',
      '/api/poll/*',
      '/api/hashtags/*',
      '/api/wikis/*',
      '/api/relationship/*',
      '/',

      '/api/chats',
      '/api/chats/:chatId/messages',
      '/api/chats/*',

      '/api/messages/*',
      '/api/messages/send',
      '/api/messages//status/update',
      '/api/messages/chat/:chatId/read',

      '/__transmit',
      '/__transmit/events',
      '/__transmit/subscribe',
      '/__transmit/unsubscribe',
      '/__transmit/*',

      '/api/fandom/create',
      '/api/fandom/edit/name',
      '/api/fandom/edit/category',
      '/api/fandom/add/image',
      '/api/fandom/image/cleanup',
      '/api/fandom/edit/image',
      '/api/fandom/edit/image/remove',
      '/api/fandom/delete',
    ],
    enableXsrfCookie: false,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  },

  /**
   * Control how your website should be embedded inside
   * iFrames
   */
  xFrame: {
    enabled: true,
    action: 'DENY',
  },

  /**
   * Force browser to always use HTTPS
   */
  hsts: {
    enabled: true,
    maxAge: '180 days',
  },

  /**
   * Disable browsers from sniffing the content type of a
   * response and always rely on the "content-type" header.
   */
  contentTypeSniffing: {
    enabled: true,
  },
})

export default shieldConfig
