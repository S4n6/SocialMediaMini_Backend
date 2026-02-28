export const VALID_REACTION_TYPES = [
  'LIKE',
  'LOVE',
  'HAHA',
  'WOW',
  'SAD',
  'ANGRY',
] as const;

export type ReactionTypeValue = (typeof VALID_REACTION_TYPES)[number];

/**
 * Value Object for reaction type
 * Self-validating, immutable - pure TypeScript
 */
export class ReactionType {
  private constructor(private readonly value: ReactionTypeValue) {}

  static create(value: string): ReactionType {
    const upperValue = value.toUpperCase() as ReactionTypeValue;

    if (!VALID_REACTION_TYPES.includes(upperValue)) {
      throw new Error(
        `Invalid reaction type: '${value}'. Allowed: ${VALID_REACTION_TYPES.join(', ')}`,
      );
    }

    return new ReactionType(upperValue);
  }

  static like(): ReactionType {
    return new ReactionType('LIKE');
  }

  static love(): ReactionType {
    return new ReactionType('LOVE');
  }

  static haha(): ReactionType {
    return new ReactionType('HAHA');
  }

  static wow(): ReactionType {
    return new ReactionType('WOW');
  }

  static sad(): ReactionType {
    return new ReactionType('SAD');
  }

  static angry(): ReactionType {
    return new ReactionType('ANGRY');
  }

  getValue(): ReactionTypeValue {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: ReactionType): boolean {
    return this.value === other.value;
  }

  isPositive(): boolean {
    return ['LIKE', 'LOVE', 'HAHA', 'WOW'].includes(this.value);
  }

  isNegative(): boolean {
    return ['SAD', 'ANGRY'].includes(this.value);
  }
}
