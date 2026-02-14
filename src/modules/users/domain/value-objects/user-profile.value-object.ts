import { ValueObject } from './value-object.base';
import { ValidationException } from '../exceptions/domain.exceptions';

interface UserProfileProps {
  fullName: string;
  bio?: string;
  avatar?: string;
  location?: string;
  websiteUrl?: string;
  dateOfBirth?: Date;
  phoneNumber?: string;
  gender?: string;
  lastProfileUpdate?: Date;
}

/**
 * User Profile Value Object
 * Encapsulates user profile information and validation rules
 */
export class UserProfile extends ValueObject<UserProfileProps> {
  // Validation constants
  private static readonly FULL_NAME_MIN_LENGTH = 2;
  private static readonly FULL_NAME_MAX_LENGTH = 100;
  private static readonly BIO_MAX_LENGTH = 500;
  private static readonly PHONE_MIN_DIGITS = 10;

  constructor(props: UserProfileProps) {
    super(props);
  }

  get fullName(): string {
    return this._value.fullName;
  }

  get bio(): string | undefined {
    return this._value.bio;
  }

  get avatar(): string | undefined {
    return this._value.avatar;
  }

  get location(): string | undefined {
    return this._value.location;
  }

  get websiteUrl(): string | undefined {
    return this._value.websiteUrl;
  }

  get dateOfBirth(): Date | undefined {
    return this._value.dateOfBirth;
  }

  get phoneNumber(): string | undefined {
    return this._value.phoneNumber;
  }

  get gender(): string | undefined {
    return this._value.gender;
  }

  get lastProfileUpdate(): Date | undefined {
    return this._value.lastProfileUpdate;
  }

  /**
   * Create updated profile with new data
   */
  public update(updates: Partial<UserProfileProps>): UserProfile {
    return new UserProfile({
      ...this._value,
      ...updates,
    });
  }

  /**
   * Check if profile is complete (has required fields)
   */
  public isComplete(): boolean {
    return !!(this._value.fullName && this._value.bio && this._value.avatar);
  }

  protected validateInvariants(props: UserProfileProps): void {
    const errors: Record<string, string[]> = {};

    // Validate full name - required and must meet length requirements
    if (!props.fullName || props.fullName.trim().length === 0) {
      errors.fullName = ['Full name is required'];
    } else {
      const trimmedName = props.fullName.trim();
      if (trimmedName.length < UserProfile.FULL_NAME_MIN_LENGTH) {
        errors.fullName = [
          `Full name must be at least ${UserProfile.FULL_NAME_MIN_LENGTH} characters`,
        ];
      } else if (props.fullName.length > UserProfile.FULL_NAME_MAX_LENGTH) {
        errors.fullName = [
          `Full name cannot exceed ${UserProfile.FULL_NAME_MAX_LENGTH} characters`,
        ];
      }
    }

    // Validate bio
    if (props.bio && props.bio.length > UserProfile.BIO_MAX_LENGTH) {
      errors.bio = [
        `Bio cannot exceed ${UserProfile.BIO_MAX_LENGTH} characters`,
      ];
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
      throw new ValidationException('Invalid user profile data');
    }
  }

  protected isEqual(vo: ValueObject<UserProfileProps>): boolean {
    const other = vo as UserProfile;
    return (
      this._value.fullName === other._value.fullName &&
      this._value.bio === other._value.bio &&
      this._value.avatar === other._value.avatar &&
      this._value.location === other._value.location &&
      this._value.websiteUrl === other._value.websiteUrl &&
      this._value.phoneNumber === other._value.phoneNumber &&
      this._value.gender === other._value.gender &&
      this._value.dateOfBirth?.getTime() === other._value.dateOfBirth?.getTime()
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
    return (
      phoneRegex.test(phone) &&
      phone.replace(/\D/g, '').length >= UserProfile.PHONE_MIN_DIGITS
    );
  }
}
