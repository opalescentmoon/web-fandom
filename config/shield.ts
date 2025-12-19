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

      '/api/likes/*',
      '/api/poll/*',
      '/api/hashtags/*',
      '/api/wikis/*',
      '/api/relationship/*',
      '/api/chats/*',
      '/api/messages/*',
      '/',
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
