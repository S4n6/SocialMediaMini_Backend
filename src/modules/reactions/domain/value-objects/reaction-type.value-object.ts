import {
  VALID_REACTION_TYPES,
  ReactionType as ReactionTypeEnum,
} from '../../constants';

export class ReactionType {
  private constructor(private readonly value: ReactionTypeEnum) {}

  static create(value: string): ReactionType {
    const upperValue = value.toUpperCase() as ReactionTypeEnum;

    if (!VALID_REACTION_TYPES.includes(upperValue)) {
      throw new Error(
        `Invalid reaction type: '${value}'. Allowed types are: ${VALID_REACTION_TYPES.join(', ')}`,
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

  getValue(): ReactionTypeEnum {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: ReactionType): boolean {
    return this.value === other.value;
  }

  isLike(): boolean {
    return this.value === 'LIKE';
  }

  isPositive(): boolean {
    return ['LIKE', 'LOVE', 'HAHA', 'WOW'].includes(this.value);
  }

  isNegative(): boolean {
    return ['SAD', 'ANGRY'].includes(this.value);
  }
}
