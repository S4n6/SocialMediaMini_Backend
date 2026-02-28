export const VALID_TARGET_TYPES = ['post', 'comment'] as const;

export type TargetTypeValue = (typeof VALID_TARGET_TYPES)[number];

/**
 * Value Object for target type (post or comment)
 * Self-validating, immutable - pure TypeScript
 */
export class TargetType {
  private constructor(private readonly value: TargetTypeValue) {}

  static create(value: string): TargetType {
    const lowerValue = value.toLowerCase() as TargetTypeValue;

    if (!VALID_TARGET_TYPES.includes(lowerValue)) {
      throw new Error(
        `Invalid target type: '${value}'. Allowed: ${VALID_TARGET_TYPES.join(', ')}`,
      );
    }

    return new TargetType(lowerValue);
  }

  static post(): TargetType {
    return new TargetType('post');
  }

  static comment(): TargetType {
    return new TargetType('comment');
  }

  getValue(): TargetTypeValue {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: TargetType): boolean {
    return this.value === other.value;
  }

  isPost(): boolean {
    return this.value === 'post';
  }

  isComment(): boolean {
    return this.value === 'comment';
  }
}
