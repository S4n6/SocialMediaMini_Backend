import {
  REACTION_BUSINESS_RULES,
  TargetType as TargetTypeEnum,
} from '../../constants';

export class TargetType {
  private constructor(private readonly value: TargetTypeEnum) {}

  static create(value: string): TargetType {
    const lowerValue = value.toLowerCase() as TargetTypeEnum;

    if (!REACTION_BUSINESS_RULES.ALLOWED_TARGET_TYPES.includes(lowerValue)) {
      throw new Error(
        `Invalid target type: '${value}'. Allowed types are: ${REACTION_BUSINESS_RULES.ALLOWED_TARGET_TYPES.join(', ')}`,
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

  getValue(): TargetTypeEnum {
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
