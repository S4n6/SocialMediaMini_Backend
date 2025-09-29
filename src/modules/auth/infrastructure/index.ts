// Re-export existing repositories that now implement domain interfaces
export { UserManagementService as UserRepositoryImpl } from '../repositories/user-management.repository';
export * from './session.repository';
export * from './token.repository';
