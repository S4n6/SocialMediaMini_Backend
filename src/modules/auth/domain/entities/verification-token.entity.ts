/**
 * Verification Token Domain Entity
 *
 * Database-backed short token for email verification and password reset.
 * Replaces stateless JWT approach with a secure, opaque random code.
 */

export enum VerificationTokenType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

export interface VerificationTokenProps {
  id: string;
  token: string;
  type: VerificationTokenType;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  usedAt: Date | null;
}

export class VerificationToken {
  readonly id: string;
  readonly token: string;
  readonly type: VerificationTokenType;
  readonly userId: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly usedAt: Date | null;

  constructor(props: VerificationTokenProps) {
    this.id = props.id;
    this.token = props.token;
    this.type = props.type;
    this.userId = props.userId;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt;
    this.usedAt = props.usedAt;
  }

  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  get isUsed(): boolean {
    return this.usedAt !== null;
  }

  get isValid(): boolean {
    return !this.isExpired && !this.isUsed;
  }
}
