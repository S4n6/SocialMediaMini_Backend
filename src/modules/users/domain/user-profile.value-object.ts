import { ValueObject } from '../../../shared/domain/value-object.base';
import { ValidationException } from '../../../shared/exceptions/domain.exception';

interface UserProfileProps {
  fullName: string;
  bio?: string;
  avatar?: string;
  location?: string;
  websiteUrl?: string;
  dateOfBirth?: Date;
  phoneNumber?: string;
  gender?: string;
}

/**
 * User Profile Value Object
 * Encapsulates user profile information and validation rules
 */
export class UserProfile extends ValueObject<UserProfileProps> {
  constructor(props: UserProfileProps) {
    super(props);
  }

  get fullName(): string {
    return this.value.fullName;
  }

  get bio(): string | undefined {
    return this.value.bio;
  }

  get avatar(): string | undefined {
    return this.value.avatar;
  }

  get location(): string | undefined {
    return this.value.location;
  }

  get websiteUrl(): string | undefined {
    return this.value.websiteUrl;
  }

  get dateOfBirth(): Date | undefined {
    return this.value.dateOfBirth;
  }

  get phoneNumber(): string | undefined {
    return this.value.phoneNumber;
  }

  get gender(): string | undefined {
    return this.value.gender;
  }

  /**
   * Create updated profile with new data
   */
  public update(updates: Partial<UserProfileProps>): UserProfile {
    return new UserProfile({
      ...this.value,
      ...updates,
    });
  }

  /**
   * Check if profile is complete (has required fields)
   */
  public isComplete(): boolean {
    return !!(this.value.fullName && this.value.bio && this.value.avatar);
  }

  protected validateInvariants(props: UserProfileProps): void {
    const errors: Record<string, string[]> = {};

    // Validate full name
    if (!props.fullName || props.fullName.trim().length === 0) {
      errors.fullName = ['Full name is required'];
    } else if (props.fullName.length < 2) {
      errors.fullName = ['Full name must be at least 2 characters'];
    } else if (props.fullName.length > 100) {
      errors.fullName = ['Full name cannot exceed 100 characters'];
    }

    // Validate bio
    if (props.bio && props.bio.length > 500) {
      errors.bio = ['Bio cannot exceed 500 characters'];
    }

    // Validate website URL
    if (props.websiteUrl && !this.isValidUrl(props.websiteUrl)) {
      errors.websiteUrl = ['Invalid website URL format'];
    }

    // Validate phone number
    if (props.phoneNumber && !this.isValidPhoneNumber(props.phoneNumber)) {
      errors.phoneNumber = ['Invalid phone number format'];
    }

    // Validate date of birth
    if (props.dateOfBirth && props.dateOfBirth >= new Date()) {
      errors.dateOfBirth = ['Date of birth must be in the past'];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationException('Invalid user profile data', errors);
    }
  }

  protected isEqual(vo: ValueObject<UserProfileProps>): boolean {
    const other = vo as UserProfile;
    return (
      this.value.fullName === other.value.fullName &&
      this.value.bio === other.value.bio &&
      this.value.avatar === other.value.avatar &&
      this.value.location === other.value.location &&
      this.value.websiteUrl === other.value.websiteUrl &&
      this.value.phoneNumber === other.value.phoneNumber &&
      this.value.gender === other.value.gender &&
      this.value.dateOfBirth?.getTime() === other.value.dateOfBirth?.getTime()
    );
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidPhoneNumber(phone: string): boolean {
    // Basic phone number validation (can be enhanced)
    const phoneRegex = /^\+?[\d\s-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }
}
