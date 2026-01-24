/**
 * Test data factory for creating test fixtures
 * Used across integration and E2E tests
 */

export interface CreateTestUserData {
  username?: string;
  email?: string;
  password?: string;
  fullName?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  websiteUrl?: string;
  phoneNumber?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  dateOfBirth?: Date;
}

export class TestDataFactory {
  private static counter = 0;

  /**
   * Generate unique test user data
   */
  static createUserData(overrides?: CreateTestUserData): CreateTestUserData {
    const id = ++this.counter;
    // Generate valid phone number with at least 10 digits
    const paddedId = id.toString().padStart(4, '0');
    return {
      username: `testuser${id}`,
      email: `testuser${id}@example.com`,
      password: 'SecurePass123!',
      fullName: `Test User ${id}`,
      bio: `Bio for test user ${id}`,
      avatar: `https://example.com/avatar${id}.jpg`,
      location: 'Test City',
      websiteUrl: `https://testuser${id}.com`,
      phoneNumber: `+1234567${paddedId}`, // Now has 10+ digits: +1234567XXXX
      gender: 'PREFER_NOT_TO_SAY' as const,
      dateOfBirth: new Date('1990-01-01'),
      ...overrides,
    };
  }

  /**
   * Generate multiple unique users
   */
  static createMultipleUserData(count: number): CreateTestUserData[] {
    return Array.from({ length: count }, () => this.createUserData());
  }

  /**
   * Reset counter (useful between test suites)
   */
  static reset(): void {
    this.counter = 0;
  }

  /**
   * Generate update profile data
   */
  static createProfileUpdateData(overrides?: Partial<CreateTestUserData>) {
    return {
      fullName: 'Updated Name',
      bio: 'Updated bio',
      location: 'Updated City',
      websiteUrl: 'https://updated.com',
      ...overrides,
    };
  }
}
