export class AuthTokenError extends Error {
  constructor() {
    // Não aparece para o usuário
    super('Error with authentication token.')
  }
}