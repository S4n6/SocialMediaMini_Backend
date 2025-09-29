import { User, UserRole, UserStatus } from '../user.entity';
import {
  UserId,
  UserEmail,
  Username,
  Password,
  UserProfile,
} from '../value-objects';

export interface CreateUserRequest {
  username: string;
  email: string;
  password?: string;
  googleId?: string;
  profile: {
    fullName: string;
    bio?: string;
    dateOfBirth?: Date;
    avatar?: string;
    websiteUrl?: string;
    location?: string;
    phoneNumber?: string;
    gender?: string;
  };
  role?: UserRole;
}

export interface CreateUserFromGoogleRequest {
  googleId: string;
  email: string;
  profile: {
    fullName: string;
    avatar?: string;
  };
}

/**
 * User Factory
 * Handles complex user creation logic and ensures domain invariants
 */
export class UserFactory {
  /**
   * Create a new user with email/password
   */
  static async createUser(request: CreateUserRequest): Promise<User> {
    // Create value objects
    const userId = UserId.generate();
    const email = UserEmail.create(request.email);
    const username = Username.create(request.username);
    const userProfile = new UserProfile(request.profile);

    let password: Password | undefined;
    if (request.password) {
      password = await Password.createFromPlainText(request.password);
    }

    // Create user with proper encapsulation
    const user = new User(
      userId.getValue(),
      username.getValue(),
      email.getValue(),
      userProfile,
      {
        passwordHash: password?.getValue(),
        role: request.role || UserRole.USER,
        status: UserStatus.ACTIVE,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    );

    return user;
  }

  /**
   * Create user from Google OAuth
   */
  static createUserFromGoogle(request: CreateUserFromGoogleRequest): User {
    // Create value objects
    const userId = UserId.generate();
    const email = UserEmail.create(request.email);

    // Generate username from email local part
    const emailLocal = email.getLocalPart();
    const baseUsername = emailLocal.replace(/[^a-z0-9]/g, '');
    const username = Username.create(baseUsername);

    const userProfile = new UserProfile({
      fullName: request.profile.fullName,
      avatar: request.profile.avatar,
    });

    const user = new User(
      userId.getValue(),
      username.getValue(),
      email.getValue(),
      userProfile,
      {
        googleId: request.googleId,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true, // Google accounts are pre-verified
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    );

    return user;
  }

  /**
   * Reconstruct user from database data
   */
  static reconstructUser(data: {
    id: string;
    username: string;
    email: string;
    passwordHash?: string;
    googleId?: string;
    role: UserRole;
    status: UserStatus;
    isEmailVerified: boolean;
    emailVerifiedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    lastProfileUpdate?: Date;
    profile: any; // Raw profile data from DB
    followingIds?: string[];
    followerIds?: string[];
  }): User {
    // Validate and create value objects
    const userId = UserId.create(data.id);
    const email = UserEmail.create(data.email);
    const username = Username.create(data.username);
    const userProfile = new UserProfile(data.profile);

    const user = new User(
      userId.getValue(),
      username.getValue(),
      email.getValue(),
      userProfile,
      {
        passwordHash: data.passwordHash,
        googleId: data.googleId,
        role: data.role,
        status: data.status,
        isEmailVerified: data.isEmailVerified,
        emailVerifiedAt: data.emailVerifiedAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        lastProfileUpdate: data.lastProfileUpdate,
      },
    );

    // Set follow relationships
    if (data.followingIds || data.followerIds) {
      user.setFollowingAndFollowers(
        data.followingIds || [],
        data.followerIds || [],
      );
    }

    return user;
  }

  /**
   * Create admin user
   */
  static async createAdminUser(request: CreateUserRequest): Promise<User> {
    const adminRequest = {
      ...request,
      role: UserRole.ADMIN,
    };

    const user = await UserFactory.createUser(adminRequest);

    // Admin users are automatically verified
    user.verifyEmail();

    return user;
  }
}
