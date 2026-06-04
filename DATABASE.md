# DATABASE.md — HealthBook Database Schema

> PostgreSQL via Supabase, managed with Prisma ORM.
> Prisma schema location: `apps/api/prisma/schema.prisma`

---

## Overview

27 models, 10 enums. All timestamps use `DateTime` with `@default(now())`.

---

## Core Models

### User
| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | Primary key |
| email | String | Unique |
| username | String | Unique |
| name | String | |
| bio | String? | |
| avatar | String? | Cloudinary URL |
| coverPhoto | String? | Cloudinary URL |
| gender | String? | nullable |
| role | Role | USER / ADMIN (default USER) |
| isVerified | Boolean | |
| isPrivate | Boolean | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Relations:** posts, reactions, comments, followers/following, healthLogs, notifications, conversations, messages, groups, challenges, stories, reels

### Follow
| Field | Type |
|---|---|
| followerId | String (FK → User) |
| followingId | String (FK → User) |

**Unique:** [followerId, followingId]

### Post
| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | |
| userId | String (FK → User) | |
| groupId | String? | FK → Group (null = personal post) |
| content | String | |
| mediaUrls | String[] | Cloudinary URLs |
| privacy | Privacy | PUBLIC / FRIENDS / PRIVATE |
| templateType | String? | ROUTINE / GOAL / WORKOUT / MOOD |
| templateData | Json? | Template-specific data |
| healthLogId | String? | FK → HealthLog |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Relations:** user, group, reactions, comments, savedBy, healthLog

**Indexes:** userId + createdAt, privacy + createdAt, groupId + createdAt

### Reaction
| Field | Type | Notes |
|---|---|---|
| postId | String (FK) | |
| userId | String (FK) | |
| type | ReactionType | INSPIRED, CLAP, KEEP_IT_UP, HEALING, LOVE |

**Unique:** [postId, userId]

### Comment
| Field | Type |
|---|---|
| id | String (UUID) |
| postId | String (FK) |
| userId | String (FK) |
| parentId | String? (self FK) |
| content | String |
| isPinned | Boolean |

### SavedPost
**Unique:** [userId, postId]

---

## Health Models

### HealthLog
| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | |
| userId | String (FK) | |
| type | HealthLogType | ROUTINE / GOAL / WORKOUT / MOOD / QUICK |
| date | DateTime | |
| data | Json | Type-specific data |
| score | Int? | Calculated during creation |
| isPublic | Boolean | |

**Indexes:** [userId, date], [userId, type, date]

### PeriodLog
| Field | Type |
|---|---|
| id | String (UUID) |
| userId | String (FK) |
| startDate | DateTime |
| endDate | DateTime? |
| cycleLength | Int? |
| flowIntensity | String? |
| symptoms | String[] |
| notes | String? |

### WeightLog
| Field | Type |
|---|---|
| id | String (UUID) |
| userId | String (FK) |
| weight | Float |
| bodyFat | Float? |
| waist | Float? |
| hips | Float? |
| chest | Float? |
| arms | Float? |
| notes | String? |
| date | DateTime |

---

## Messaging Models

### Conversation
| Field | Type |
|---|---|
| id | String (UUID) |
| isGroup | Boolean |
| groupName | String? |
| groupAvatar | String? |
| createdAt | DateTime |
| updatedAt | DateTime |

### ConversationParticipant
| Field | Type |
|---|---|
| userId | String (FK) |
| conversationId | String (FK) |
| isMuted | Boolean |
| lastReadAt | DateTime? |

### Message
| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | |
| conversationId | String (FK) | |
| senderId | String (FK → User) | |
| content | String? | |
| mediaUrl | String? | |
| sharedPostId | String? | FK → Post |
| isDeleted | Boolean | |
| deletedFor | String[] | User IDs who deleted |

---

## Group Models

### Group
| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | |
| name | String | |
| description | String? | |
| avatar | String? | |
| coverPhoto | String? | |
| type | GroupType | PUBLIC / PRIVATE / SECRET |
| createdById | String | FK → User (creator) |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Relations:** createdBy, members, posts, challenges, joinRequests, invites

### GroupMember
| Field | Type |
|---|---|
| groupId | String (FK) |
| userId | String (FK) |
| role | GroupRole | ADMIN / MODERATOR / MEMBER |
| joinedAt | DateTime |

**Unique:** [groupId, userId]

### GroupJoinRequest
| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | |
| groupId | String (FK → Group) | |
| userId | String (FK → User) | |
| status | String | PENDING / APPROVED / REJECTED |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Unique:** [groupId, userId]

### GroupInvite
| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | |
| groupId | String (FK → Group) | |
| userId | String (FK → User) | Recipient |
| invitedBy | String (FK → User) | Sender |
| status | String | PENDING / ACCEPTED / DECLINED |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Unique:** [groupId, userId]

---

## Challenge Models

### Challenge
| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | |
| creatorId | String (FK) | |
| groupId | String? | FK → Group |
| title | String | |
| description | String | |
| type | ChallengeType | SOLO / GROUP / PLATFORM |
| startDate | DateTime | |
| endDate | DateTime | |
| entryFee | Float? | |
| prize | String? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### ChallengeParticipant
| Field | Type |
|---|---|
| challengeId | String (FK) |
| userId | String (FK) |
| progress | Json |
| score | Int |
| rank | Int? |
| completed | Boolean |

**Unique:** [challengeId, userId]

---

## Story & Highlight Models

### Story
| Field | Type |
|---|---|
| id | String (UUID) |
| userId | String (FK) |
| mediaUrl | String |
| mediaType | String (image/video) |
| duration | Int? |
| textOverlay | String? |
| expiresAt | DateTime (created + 24h) |
| createdAt | DateTime |

### StoryView
**Unique:** [storyId, userId]

### StoryLike
**Unique:** [storyId, userId]

### StoryHighlight
| Field | Type |
|---|---|
| id | String (UUID) |
| userId | String (FK) |
| title | String |
| coverUrl | String? |
| createdAt | DateTime |
| updatedAt | DateTime |

### StoryHighlightItem
| Field | Type |
|---|---|
| id | String (UUID) |
| highlightId | String (FK) |
| storyId | String (FK) |
| order | Int |

---

## Reel Models

### Reel
| Field | Type |
|---|---|
| id | String (UUID) |
| userId | String (FK) |
| videoUrl | String |
| caption | String? |
| thumbnailUrl | String? |
| createdAt | DateTime |
| updatedAt | DateTime |

### ReelLike
**Unique:** [reelId, userId]

### ReelComment
| Field | Type |
|---|---|
| id | String (UUID) |
| reelId | String (FK) |
| userId | String (FK) |
| content | String |
| createdAt | DateTime |

---

## Notification Model

### Notification
| Field | Type |
|---|---|
| id | String (UUID) |
| type | NotificationType |
| userId | String (FK) |
| fromUserId | String? (FK) |
| postId | String? (FK) |
| commentId | String? (FK) |
| message | String? |
| read | Boolean |
| createdAt | DateTime |

**NotificationTypes:** NEW_FOLLOWER, POST_REACTION, POST_COMMENT, COMMENT_REPLY, MENTION, MESSAGE, CHALLENGE_INVITE, CONSULTATION_BOOKED, STREAK_MILESTONE, STREAK_AT_RISK, SYSTEM

---

## Enums

| Enum | Values |
|---|---|
| Role | USER, ADMIN, MODERATOR |
| PostPrivacy | PUBLIC, FRIENDS, PRIVATE |
| ReactionType | INSPIRED, CLAP, KEEP_IT_UP, HEALING, LOVE |
| HealthLogType | ROUTINE, GOAL, WORKOUT, MOOD, QUICK |
| GroupType | PUBLIC, PRIVATE, SECRET |
| GroupRole | ADMIN, MODERATOR, MEMBER |
| ChallengeType | SOLO, GROUP, PLATFORM |
| NotificationType | (11 types listed above) |

---

## Indexes

All foreign keys and commonly queried fields are indexed:
- User: email, username
- Post: userId + createdAt, privacy + createdAt, groupId + createdAt
- Notification: userId + read, userId + createdAt
- Message: conversationId + createdAt
- Story: userId, expiresAt
- Follow: followerId, followingId
- Reel: createdAt
- GroupMember: groupId, userId
- GroupJoinRequest: groupId + userId (unique), status
- GroupInvite: groupId + userId (unique), status
- HealthLog: userId + date, userId + type + date
