import {
  ReactionTypeValue,
  VALID_REACTION_TYPES,
} from '../value-objects/reaction-type.value-object';
import {
  TargetTypeValue,
  VALID_TARGET_TYPES,
} from '../value-objects/target-type.value-object';
import {
  ReactionRemovedEvent,
  ReactionTypeChangedEvent,
} from '../events/reaction.events';

export interface ReactionProps {
  type: ReactionTypeValue;
  reactorId: string;
  targetId: string;
  targetType: TargetTypeValue;
  createdAt: Date;
}

/**
 * Reaction domain entity - rich model with business logic
 * Pure TypeScript - no framework dependencies
 */
export class ReactionEntity {
  private _type: ReactionTypeValue;
  private readonly _reactorId: string;
  private readonly _targetId: string;
  private readonly _targetType: TargetTypeValue;
  private readonly _createdAt: Date;
  private _domainEvents: Array<
    ReactionRemovedEvent | ReactionTypeChangedEvent
  > = [];

  private constructor(
    private readonly _id: string,
    props: ReactionProps,
  ) {
    this.validate(props);
    this._type = props.type;
    this._reactorId = props.reactorId;
    this._targetId = props.targetId;
    this._targetType = props.targetType;
    this._createdAt = props.createdAt;
  }

  /**
   * Create a new reaction (factory method for new reactions)
   */
  static create(
    type: ReactionTypeValue,
    reactorId: string,
    targetId: string,
    targetType: TargetTypeValue,
  ): ReactionEntity {
    return new ReactionEntity('', {
      type,
      reactorId,
      targetId,
      targetType,
      createdAt: new Date(),
    });
  }

  /**
   * Reconstitute from persistence (factory method for existing reactions)
   */
  static reconstitute(id: string, props: ReactionProps): ReactionEntity {
    return new ReactionEntity(id, props);
  }

  // --- Getters ---

  get id(): string {
    return this._id;
  }

  get type(): ReactionTypeValue {
    return this._type;
  }

  get reactorId(): string {
    return this._reactorId;
  }

  get targetId(): string {
    return this._targetId;
  }

  get targetType(): TargetTypeValue {
    return this._targetType;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get domainEvents(): Array<ReactionRemovedEvent | ReactionTypeChangedEvent> {
    return [...this._domainEvents];
  }

  get postId(): string | null {
    return this._targetType === 'post' ? this._targetId : null;
  }

  get commentId(): string | null {
    return this._targetType === 'comment' ? this._targetId : null;
  }

  // --- Business Methods ---

  /**
   * Change the reaction type (e.g., LIKE → LOVE)
   * Emits ReactionTypeChangedEvent
   */
  changeType(newType: ReactionTypeValue): void {
    if (this._type === newType) return;
    const previousType = this._type;
    this._type = newType;
    this._domainEvents.push(
      new ReactionTypeChangedEvent(
        this._id,
        this._reactorId,
        this._targetId,
        this._targetType,
        previousType,
        newType,
      ),
    );
  }

  /**
   * Check if same reaction type (used for toggle behavior)
   */
  isSameType(type: ReactionTypeValue): boolean {
    return this._type === type;
  }

  /**
   * Check if reaction is owned by a specific user
   */
  isOwnedBy(userId: string): boolean {
    return this._reactorId === userId;
  }

  /**
   * Mark reaction for removal, emits ReactionRemovedEvent
   */
  markForRemoval(): void {
    this._domainEvents.push(
      new ReactionRemovedEvent(
        this._id,
        this._reactorId,
        this._targetId,
        this._targetType,
        this._type,
      ),
    );
  }

  /**
   * Clear all pending domain events (after publishing)
   */
  clearEvents(): void {
    this._domainEvents = [];
  }

  // --- Validation ---

  private validate(props: ReactionProps): void {
    if (!props.reactorId?.trim()) {
      throw new Error('Reactor ID is required');
    }
    if (!props.targetId?.trim()) {
      throw new Error('Target ID is required');
    }
    if (!VALID_REACTION_TYPES.includes(props.type)) {
      throw new Error(`Invalid reaction type: ${props.type}`);
    }
    if (!VALID_TARGET_TYPES.includes(props.targetType)) {
      throw new Error(`Invalid target type: ${props.targetType}`);
    }
  }
}
