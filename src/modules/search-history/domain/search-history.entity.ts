import { Entity } from '../../../shared/domain/entity.base';
import { randomUUID } from 'crypto';
import {
  SearchHistoryEntryAddedEvent,
  SearchHistoryEntryRemovedEvent,
  SearchHistoryClearedEvent,
} from './search-history.events';
import {
  InvalidUserIdException,
  SearchHistoryLimitExceededException,
} from './search-history.exceptions';

export interface SearchHistoryEntry {
  id: string;
  searchedUserId: string;
  searchedAt: Date;
  searchedUserProfile?: {
    id: string;
    userName: string;
    fullName: string;
    avatar: string | null;
  };
}

export interface SearchHistoryProps {
  id?: string;
  userId: string;
  entries: SearchHistoryEntry[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class SearchHistory extends Entity<string> {
  private static readonly MAX_ENTRIES = 20;
  private static readonly DUPLICATE_THRESHOLD_MS = 1000 * 60 * 5; // 5 minutes

  private _userId: string;
  private _entries: SearchHistoryEntry[];
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: SearchHistoryProps) {
    const id = props.id || randomUUID();
    super(id);

    this._userId = props.userId;
    this._entries = props.entries || [];
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  static create(userId: string): SearchHistory {
    if (!userId || userId.trim() === '') {
      throw new InvalidUserIdException('User ID cannot be empty');
    }

    return new SearchHistory({
      userId,
      entries: [],
    });
  }

  static fromPersistence(props: SearchHistoryProps): SearchHistory {
    return new SearchHistory(props);
  }

  private validate(): void {
    if (!this._userId || this._userId.trim() === '') {
      throw new InvalidUserIdException('User ID is required');
    }

    if (this._entries.length > SearchHistory.MAX_ENTRIES) {
      throw new SearchHistoryLimitExceededException(
        `Search history cannot exceed ${SearchHistory.MAX_ENTRIES} entries`,
      );
    }
  }

  // Getters
  get userId(): string {
    return this._userId;
  }

  get entries(): SearchHistoryEntry[] {
    return [...this._entries];
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get entriesCount(): number {
    return this._entries.length;
  }

  get isEmpty(): boolean {
    return this._entries.length === 0;
  }

  get isFull(): boolean {
    return this._entries.length >= SearchHistory.MAX_ENTRIES;
  }

  // Business methods
  addEntry(
    searchedUserId: string,
    searchedUserProfile?: SearchHistoryEntry['searchedUserProfile'],
  ): void {
    if (!searchedUserId || searchedUserId.trim() === '') {
      throw new InvalidUserIdException('Searched user ID cannot be empty');
    }

    // Don't add self to search history
    if (searchedUserId === this._userId) {
      return;
    }

    const now = new Date();

    // Check for duplicate within threshold
    const existingEntryIndex = this._entries.findIndex(
      (entry) => entry.searchedUserId === searchedUserId,
    );

    if (existingEntryIndex !== -1) {
      const existingEntry = this._entries[existingEntryIndex];
      const timeDiff = now.getTime() - existingEntry.searchedAt.getTime();

      if (timeDiff < SearchHistory.DUPLICATE_THRESHOLD_MS) {
        // Update existing entry timestamp and move to top
        existingEntry.searchedAt = now;
        existingEntry.searchedUserProfile =
          searchedUserProfile || existingEntry.searchedUserProfile;

        // Move to front
        this._entries.splice(existingEntryIndex, 1);
        this._entries.unshift(existingEntry);
      } else {
        // Remove old entry and add new one
        this._entries.splice(existingEntryIndex, 1);
        this.addNewEntry(searchedUserId, now, searchedUserProfile);
      }
    } else {
      this.addNewEntry(searchedUserId, now, searchedUserProfile);
    }

    this._updatedAt = now;

    // Emit domain event
    this.addDomainEvent(
      new SearchHistoryEntryAddedEvent(
        this.id,
        this._userId,
        searchedUserId,
        now,
      ),
    );
  }

  private addNewEntry(
    searchedUserId: string,
    searchedAt: Date,
    searchedUserProfile?: SearchHistoryEntry['searchedUserProfile'],
  ): void {
    const newEntry: SearchHistoryEntry = {
      id: randomUUID(),
      searchedUserId,
      searchedAt,
      searchedUserProfile,
    };

    // Add to front
    this._entries.unshift(newEntry);

    // Maintain max entries limit
    if (this._entries.length > SearchHistory.MAX_ENTRIES) {
      this._entries = this._entries.slice(0, SearchHistory.MAX_ENTRIES);
    }
  }

  removeEntry(searchedUserId: string): void {
    if (!searchedUserId || searchedUserId.trim() === '') {
      throw new InvalidUserIdException('Searched user ID cannot be empty');
    }

    const initialLength = this._entries.length;
    this._entries = this._entries.filter(
      (entry) => entry.searchedUserId !== searchedUserId,
    );

    if (this._entries.length < initialLength) {
      this._updatedAt = new Date();

      // Emit domain event
      this.addDomainEvent(
        new SearchHistoryEntryRemovedEvent(
          this.id,
          this._userId,
          searchedUserId,
        ),
      );
    }
  }

  clearAllEntries(): void {
    if (this._entries.length === 0) {
      return;
    }

    const removedCount = this._entries.length;
    this._entries = [];
    this._updatedAt = new Date();

    // Emit domain event
    this.addDomainEvent(
      new SearchHistoryClearedEvent(this.id, this._userId, removedCount),
    );
  }

  getRecentEntries(limit: number = 10): SearchHistoryEntry[] {
    return this._entries
      .sort((a, b) => b.searchedAt.getTime() - a.searchedAt.getTime())
      .slice(0, limit);
  }

  hasSearched(searchedUserId: string): boolean {
    return this._entries.some(
      (entry) => entry.searchedUserId === searchedUserId,
    );
  }

  getSearchCount(searchedUserId: string): number {
    return this._entries.filter(
      (entry) => entry.searchedUserId === searchedUserId,
    ).length;
  }

  // Helper methods for persistence
  toSnapshot(): SearchHistoryProps {
    return {
      id: this.id,
      userId: this.userId,
      entries: this.entries,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
