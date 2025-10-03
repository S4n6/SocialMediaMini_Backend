// import { DomainEvent } from "src/shared";

// export class PostCreatedEvent extends DomainEvent<string> {
//   constructor(
//     public readonly postId: string,
//     public readonly authorId: string,
//     public readonly content?: string,
//     public readonly privacy?: string,
//     public readonly hashtags?: string[],
//   ) {
//     super();
//   }

//   get eventType(): string {
//     return 'PostCreated';
//   }
// }

// export class PostUpdatedEvent extends DomainEvent<string> {
//   constructor(
//     public readonly postId: string,
//     public readonly authorId: string,
//     public readonly changes: {
//       content?: string;
//       privacy?: string;
//       hashtags?: string[];
//     },
//   ) {
//     super();
//   }

//   get eventType(): string {
//     return 'PostUpdated';
//   }
// }

// export class PostDeletedEvent extends DomainEvent<string> {
//   constructor(
//     public readonly postId: string,
//     public readonly authorId: string,
//   ) {
//     super();
//   }

//   get eventType(): string {
//     return 'PostDeleted';
//   }
// }

// export class PostReactionAddedEvent extends DomainEvent<string> {
//   constructor(
//     public readonly postId: string,
//     public readonly userId: string,
//     public readonly reactionType: string,
//   ) {
//     super();
//   }

//   get eventType(): string {
//     return 'PostReactionAdded';
//   }
// }

// export class PostReactionRemovedEvent extends DomainEvent<string> {
//   constructor(
//     public readonly postId: string,
//     public readonly userId: string,
//     public readonly reactionType: string,
//   ) {
//     super();
//   }

//   get eventType(): string {
//     return 'PostReactionRemoved';
//   }
// }

// export class PostCommentAddedEvent extends DomainEvent<string> {
//   constructor(
//     public readonly postId: string,
//     public readonly commentId: string,
//     public readonly authorId: string,
//     public readonly content: string,
//     public readonly parentId?: string,
//   ) {
//     super();
//   }

//   get eventType(): string {
//     return 'PostCommentAdded';
//   }
// }

// export class PostCommentDeletedEvent extends DomainEvent<string> {
//   constructor(
//     public readonly postId: string,
//     public readonly commentId: string,
//     public readonly authorId: string,
//   ) {
//     super();
//   }

//   get eventType(): string {
//     return 'PostCommentDeleted';
//   }
// }
