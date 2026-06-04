# API.md — HealthBook API Reference

> All Express backend endpoints.
> Base URL (dev): `http://localhost:5000`
>
> All protected routes require: `Authorization: Bearer <access_token>`
> All responses follow: `{ success: boolean, data?: any, message?: string }`

---

## 🔐 Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create new account |
| POST | `/api/auth/login` | No | Login, returns access_token |
| POST | `/api/auth/logout` | Yes | Logout, clears cookie |
| POST | `/api/auth/refresh` | Yes | Refresh access token |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/auth/forgot-password` | No | Send reset email |

---

## 👤 Users — `/api/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users/:username` | Yes | Get public profile |
| PUT | `/api/users/me` | Yes | Update own profile |
| POST | `/api/users/me/avatar` | Yes | Upload avatar |
| POST | `/api/users/me/cover` | Yes | Upload cover photo |
| GET | `/api/users/:userId/followers` | No | List followers |
| GET | `/api/users/:userId/following` | No | List following |
| POST | `/api/users/:userId/follow` | Yes | Follow user |
| DELETE | `/api/users/:userId/follow` | Yes | Unfollow user |
| GET | `/api/users/suggested` | Yes | Suggested users to follow |

---

## 📝 Posts — `/api/posts`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/posts` | Yes | Create post |
| GET | `/api/posts/feed` | Yes | Get home feed (cursor paginated) |
| GET | `/api/posts/explore` | No | Explore public posts |
| GET | `/api/posts/saved` | Yes | Get saved posts |
| GET | `/api/posts/group/:id` | Yes | Get group feed (cursor paginated) |
| GET | `/api/posts/user/:userId` | No | Get posts by user |
| GET | `/api/posts/:id` | No* | Get single post |
| PUT | `/api/posts/:id` | Yes | Edit own post |
| DELETE | `/api/posts/:id` | Yes | Delete own post |
| POST | `/api/posts/:id/reactions` | Yes | Add/toggle reaction |
| DELETE | `/api/posts/:id/reactions` | Yes | Remove reaction |
| POST | `/api/posts/:id/save` | Yes | Save/unsave post |
| POST | `/api/posts/media` | Yes | Upload post image (multipart) |

---

## 💬 Comments — `/api/comments`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/comments/:postId` | No | Get post comments |
| POST | `/api/comments/:postId` | Yes | Add comment |
| PUT | `/api/comments/:commentId` | Yes | Edit own comment |
| DELETE | `/api/comments/:commentId` | Yes | Delete own comment |
| POST | `/api/comments/:commentId/pin` | Yes | Pin comment (post owner) |

---

## 🏃 Health Logs — `/api/health-logs`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/health-logs` | Yes | Create health log |
| GET | `/api/health-logs` | Yes | Get own logs (paginated) |
| GET | `/api/health-logs/stats` | Yes | Health stats (streak, score, by-type breakdown) |
| GET | `/api/health-logs/trends` | Yes | 90-day trends (calories, mood, goals) |
| GET | `/api/health-logs/calendar` | Yes | Monthly calendar data |
| GET | `/api/health-logs/:id` | Yes | Get single log |
| PUT | `/api/health-logs/:id` | Yes | Update log (same day only) |
| DELETE | `/api/health-logs/:id` | Yes | Delete log |
| POST | `/api/health-logs/:id/copy` | Yes | Copy public log to own My Book |
| POST | `/api/health-logs/:id/share` | Yes | Share log as post |

---

## 🔔 Notifications — `/api/notifications`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | Yes | Get notifications (paginated) |
| GET | `/api/notifications/unread-count` | Yes | Get unread count |
| POST | `/api/notifications/read-all` | Yes | Mark all as read |
| POST | `/api/notifications/:id/read` | Yes | Mark one as read |
| DELETE | `/api/notifications/:id` | Yes | Delete notification |

---

## 🔍 Search — `/api/search`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/search/users?q=` | Yes | Search users |
| GET | `/api/search/posts?q=` | Yes | Search posts |
| GET | `/api/search/hashtags?q=` | Yes | Search hashtags |

---

## 💬 Messages — `/api/messages`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/messages/conversations` | Yes | List all conversations |
| POST | `/api/messages/conversations` | Yes | Start new conversation |
| GET | `/api/messages/conversations/:id` | Yes | Get conversation messages |
| POST | `/api/messages/conversations/:id/messages` | Yes | Send message |
| POST | `/api/messages/conversations/:id/read` | Yes | Mark conversation as read |
| POST | `/api/messages/conversations/:id/mute` | Yes | Mute/unmute conversation |
| DELETE | `/api/messages/conversations/:id` | Yes | Delete conversation |
| DELETE | `/api/messages/conversations/:id/messages` | Yes | Clear all messages in conversation |
| DELETE | `/api/messages/messages/:messageId` | Yes | Delete single message |

---

## 👥 Groups — `/api/groups`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/groups` | Yes | Create group |
| GET | `/api/groups` | No | Browse public groups (paginated) |
| GET | `/api/groups/search?q=` | Yes | Search groups by name/description |
| GET | `/api/groups/my` | Yes | Get groups the current user belongs to |
| GET | `/api/groups/my/invites` | Yes | Get pending invites for current user |
| PUT | `/api/groups/invites/:inviteId/accept` | Yes | Accept group invite |
| PUT | `/api/groups/invites/:inviteId/decline` | Yes | Decline group invite |
| POST | `/api/groups/media` | Yes | Upload group cover image (multipart) |
| GET | `/api/groups/:id` | No* | Get group details (private groups need membership) |
| PUT | `/api/groups/:id` | Yes | Update group (admin only) |
| DELETE | `/api/groups/:id` | Yes | Delete group (admin only) |
| POST | `/api/groups/:id/join` | Yes | Join public group |
| POST | `/api/groups/:id/leave` | Yes | Leave group |
| POST | `/api/groups/:id/join-requests` | Yes | Request to join private group |
| GET | `/api/groups/:id/join-requests` | Yes | List join requests (admin only) |
| PUT | `/api/groups/:id/join-requests/:userId/approve` | Yes | Approve join request (admin) |
| PUT | `/api/groups/:id/join-requests/:userId/reject` | Yes | Reject join request (admin) |
| POST | `/api/groups/:id/invite` | Yes | Invite user to group (admin) |
| GET | `/api/groups/:id/invites` | Yes | List invites for group (admin) |
| GET | `/api/groups/:id/members` | Yes | Get members (paginated) |
| PUT | `/api/groups/:id/members/:userId` | Yes | Update member role (admin) |
| DELETE | `/api/groups/:id/members/:userId` | Yes | Remove member (admin) |

---

## 🏆 Challenges — `/api/challenges`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/challenges` | No | Browse challenges |
| POST | `/api/challenges` | Yes | Create challenge |
| GET | `/api/challenges/mine` | Yes | Get my challenges |
| GET | `/api/challenges/:id` | No | Get challenge details |
| PUT | `/api/challenges/:id` | Yes | Update challenge (creator only) |
| POST | `/api/challenges/:id/join` | Yes | Join challenge |
| POST | `/api/challenges/:id/progress` | Yes | Log daily progress |
| GET | `/api/challenges/:id/leaderboard` | No | Get leaderboard |
| DELETE | `/api/challenges/:id/leave` | Yes | Leave challenge |
| DELETE | `/api/challenges/:id` | Yes | Delete challenge (creator only) |

---

## 📖 Stories — `/api/stories`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/stories` | Yes | Create story |
| GET | `/api/stories/friends` | Yes | Get friends' stories |
| POST | `/api/stories/:id/view` | Yes | Add story view |
| POST | `/api/stories/:id/like` | Yes | Toggle story like |
| GET | `/api/stories/:id/views` | Yes | Get story viewers |
| DELETE | `/api/stories/:id` | Yes | Delete own story |

---

## 🏷️ Highlights — `/api/highlights`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/highlights` | Yes | Get user's highlights |
| POST | `/api/highlights` | Yes | Create highlight |
| PUT | `/api/highlights/:id` | Yes | Update highlight |
| DELETE | `/api/highlights/:id` | Yes | Delete highlight |
| POST | `/api/highlights/:id/items` | Yes | Add story to highlight |
| DELETE | `/api/highlights/:id/items/:itemId` | Yes | Remove story from highlight |
| PUT | `/api/highlights/:id/items/reorder` | Yes | Reorder highlight items |

---

## 🎬 Reels — `/api/reels`

| Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| GET | `/api/reels` | No | Browse reels (paginated, cursor-based) |
| GET | `/api/reels/:id` | No | Get single reel with comments |
| POST | `/api/reels` | Yes | Create reel (JSON body) |
| POST | `/api/reels/upload` | Yes | Upload reel video (multipart) |
| PATCH | `/api/reels/:id` | Yes | Update reel caption |
| POST | `/api/reels/:id/like` | Yes | Toggle like |
| POST | `/api/reels/:id/comments` | Yes | Add comment |
| DELETE | `/api/reels/:id` | Yes | Delete reel (owner only) |
| DELETE | `/api/reels/:id/comments/:commentId` | Yes | Delete comment |

---

## 🩸 Period Logs — `/api/period-logs`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/period-logs` | Yes (female) | List period logs |
| POST | `/api/period-logs` | Yes (female) | Create period log |
| GET | `/api/period-logs/:id` | Yes (female) | Get single log |
| PUT | `/api/period-logs/:id` | Yes (female) | Update log |
| DELETE | `/api/period-logs/:id` | Yes (female) | Delete log |

---

## ⚖️ Weight Logs — `/api/weight-logs`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/weight-logs` | Yes | List weight logs |
| POST | `/api/weight-logs` | Yes | Create weight log |
| GET | `/api/weight-logs/history` | Yes | Get weight history with summary |
| GET | `/api/weight-logs/:id` | Yes | Get single log |
| PUT | `/api/weight-logs/:id` | Yes | Update log |
| DELETE | `/api/weight-logs/:id` | Yes | Delete log |

---

## ⚠️ Error Response Format

```json
// 400 Validation error
{ "success": false, "message": "Validation failed", "errors": { "email": ["Invalid email"] } }

// 401 Unauthorized
{ "success": false, "message": "No token provided" }

// 403 Forbidden
{ "success": false, "message": "You don't have permission to do this" }

// 404 Not Found
{ "success": false, "message": "Post not found" }

// 409 Conflict
{ "success": false, "message": "Username already taken" }

// 429 Rate Limited
{ "success": false, "message": "Too many requests. Try again in 15 minutes." }

// 500 Server Error
{ "success": false, "message": "Something went wrong. Please try again." }
```

---

## 📄 Pagination Pattern

All list endpoints use **cursor-based pagination**:

```
Request:  GET /api/posts/feed?cursor=post-uuid&limit=10
Response: { data: { items: [...], nextCursor: "last-item-uuid", hasMore: true } }

// When hasMore = false → no more pages
// Pass nextCursor as cursor in next request
```
