import AuthMiddleware from '#middleware/auth_middleware'

export const middleware = {
  auth: () => new AuthMiddleware().handle,
}
