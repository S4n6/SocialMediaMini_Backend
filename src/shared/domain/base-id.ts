import { randomUUID } from 'crypto';

export abstract class BaseId {
  protected readonly _value: string;
  protected readonly _type: string;

  protected constructor(value: string, type: string) {
    if (!value || value.trim().length === 0) {
      throw new Error(`${type} cannot be empty`);
    }
    this._value = value.trim();
    this._type = type;
  }

  protected static generate(): string {
    return randomUUID();
  }

  public get value(): string {
    return this._value;
  }

  public get type(): string {
    return this._type;
  }

  public equals(other: BaseId): boolean {
    if (!other || other.constructor !== this.constructor) {
      return false;
    }
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }

  public toJSON(): string {
    return this._value;
  }
}
