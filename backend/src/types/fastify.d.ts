declare module 'fastify' {
  interface FastifyRequest {
    user: {
      userId:         string
      organizationId: string
      role:           'admin' | 'manager' | 'sales_rep'
    }
  }
}
