# Notes Save Investigation — AI Tutor Save-to-Notes Bug

## Problem

When saving an AI tutor response as a note, the operation appears to succeed (console logs `Note saved successfully: <noteId>`, success toast shown), but the note is **never persisted to DynamoDB**. The table count remains at 50 notes.

---

## How Notes Work

### Architecture Overview

```
Frontend (Next.js)  →  AWS Amplify Client  →  AppSync GraphQL API  →  DynamoDB
                        (userPool auth)         (VTL resolvers)        (aws-study-notes-notes)
```

### Data Model

**DynamoDB Table:** `aws-study-notes-notes`

| Field       | Type     | Description                          |
|-------------|----------|--------------------------------------|
| PK          | String   | Cognito user sub (partition key)     |
| SK          | String   | `NOTE#<uuid>` (sort key)            |
| noteId      | String   | UUID (same as SK without prefix)     |
| title       | String   | Note title                           |
| content     | String   | HTML content                         |
| category    | String   | Group name (optional)                |
| images      | List     | Image URLs (optional)                |
| createdAt   | String   | ISO 8601 timestamp                   |
| updatedAt   | String   | ISO 8601 timestamp                   |

**GraphQL Schema** (`infrastructure/lib/schema.graphql`):

```graphql
type Note {
  noteId: ID!
  title: String!
  content: String!
  category: String
  images: [String]
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

input CreateNoteInput {
  title: String!
  content: String!
  category: String
  images: [String]
}

mutation {
  createNote(input: CreateNoteInput!): Note
}
```

---

## Two Note Creation Paths

### Path 1: Regular Note Creation (works)

```
/notes/new page
  → User types in TipTap rich text editor (content is HTML)
  → Calls createNote() from NotesContext
  → notesApi.createNote(input) → AppSync mutation → DynamoDB PutItem
```

**Key files:**
- `src/app/(dashboard)/notes/new/page.tsx` — New note page
- `src/components/notes/NoteEditor.tsx` — TipTap editor component

### Path 2: AI Tutor Save-to-Notes (fails silently)

```
ChatMessage component
  → User clicks save icon on AI response
  → Dialog opens with auto-generated title + optional group
  → markdownToHtml(message.content) converts markdown → HTML
  → Size check (< 350KB)
  → Calls createNote() from NotesContext (same function as Path 1)
  → notesApi.createNote(input) → AppSync mutation → DynamoDB PutItem
  → Console shows "Note saved successfully: <uuid>"
  → BUT note is NOT in DynamoDB
```

**Key files:**
- `src/app/(dashboard)/chat/page.tsx` — Chat page (wraps with own NotesProvider)
- `src/components/chat/ChatInterface.tsx` — Chat UI
- `src/components/chat/ChatMessage.tsx` — Message display + save-to-notes logic
- `src/lib/markdown-to-html.ts` — Markdown to HTML converter

### Differences Between the Two Paths

| Aspect              | Regular (works)                  | AI Tutor (fails)                          |
|---------------------|----------------------------------|-------------------------------------------|
| Content source      | TipTap editor (native HTML)      | Markdown converted via `markdownToHtml()` |
| Title               | User typed                       | Auto-generated from content               |
| Size check          | None                             | 350KB client-side limit                   |
| Provider instance   | Dashboard-level NotesProvider    | Chat page creates own NotesProvider       |
| Content size        | Typically small (user typed)     | Can be large (AI responses)               |

---

## Save Flow — Detailed Code Path

### 1. ChatMessage.tsx — `handleSaveToNotes()`

```
1. Convert markdown to HTML:  markdownToHtml(message.content)
2. Check size:                new Blob([htmlContent]).size < 350,000
3. Build input:               { title, content: htmlContent, category }
4. Call context:              createNote(noteInput)   ← from useNotes()
5. Validate response:         savedNote?.noteId must exist
6. Show toast:                "Note saved successfully!"
```

### 2. NotesContext.tsx — `createNote()`

```
1. Call API:                  notesApi.createNote(input)
2. Update local state:        setNotes(prev => [newNote, ...prev])
3. Return note
```

### 3. appsync.ts — `notesApi.createNote()`

```
1. Check auth:                checkAuthSession() → fetchAuthSession()
2. Send mutation:             getClient().graphql({ query: CREATE_NOTE, variables: { input } })
3. Handle response:           handleGraphQLResponse(response, "createNote")
4. Validate noteId:           data.createNote?.noteId must exist
5. Verify write (NEW):        GET_NOTE query to read back the note
6. Return note
```

### 4. AppSync VTL Resolver — CreateNoteResolver

**Request mapping template:**
```vtl
#set($noteId = $util.autoId())
#set($now = $util.time.nowISO8601())
#set($input = $ctx.arguments.input)
{
  "version": "2017-02-28",
  "operation": "PutItem",
  "key": {
    "PK": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
    "SK": $util.dynamodb.toDynamoDBJson("NOTE#$noteId")
  },
  "attributeValues": {
    "noteId": $util.dynamodb.toDynamoDBJson($noteId),
    "title": $util.dynamodb.toDynamoDBJson($input.title),
    "content": $util.dynamodb.toDynamoDBJson($input.content),
    "createdAt": $util.dynamodb.toDynamoDBJson($now),
    "updatedAt": $util.dynamodb.toDynamoDBJson($now)
    #if($input.category)
    ,"category": $util.dynamodb.toDynamoDBJson($input.category)
    #end
    #if($input.images)
    ,"images": $util.dynamodb.toDynamoDBJson($input.images)
    #end
  }
}
```

**Response mapping template:**
```vtl
#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type, $ctx.result)
#end
$util.toJson($ctx.result)
```

**Note:** For PutItem, `$ctx.result` is constructed from the request (key + attributeValues), NOT from a DynamoDB read-after-write. This means even if DynamoDB fails in an unusual way, the response might still contain valid-looking data.

---

## Notes Display Flow

### Fetching Notes

**NotesContext.tsx:**
```typescript
const fetchNotes = async () => {
  const fetchedNotes = await notesApi.getNotes();
  setNotes(fetchedNotes);
};

// Auto-fetch when user is authenticated
useEffect(() => {
  if (user) fetchNotes();
}, [user]);
```

**getNotes resolver** queries DynamoDB:
```
PK = $ctx.identity.sub AND begins_with(SK, "NOTE#")
```
With `consistentRead: true` (recently added).

### Filtering on Notes Page

**NotesList component** filters by:
- **Search:** case-insensitive match on title and content
- **Group:** matches `note.category` against group name, or shows ungrouped notes

---

## Fixes Applied So Far

### 1. Infrastructure — AppSync Resolver Error Handling

Added `$ctx.error` checks and `consistentRead: true` to getNotes, getNote, and createNote resolvers.

### 2. Client — Response Validation (appsync.ts)

Added check that `createNote` returns a valid `noteId`. Throws if missing.

### 3. Client — Content Size Check (ChatMessage.tsx)

Added 350KB size validation before save attempt.

### 4. Client — Write Verification (appsync.ts) — LATEST

Added a read-back verification after createNote mutation: immediately calls `getNote(noteId)` to confirm the note exists in DynamoDB. If the read-back fails, throws an error.

**Status: Problem persists after fixes 1-3. Fix 4 (verification) pending test.**

---

## Remaining Hypotheses

### Most Likely

1. **AppSync resolver returns fabricated success** — PutItem's `$ctx.result` is built from the request template, not a DynamoDB read. If the DynamoDB operation silently fails (e.g., evaluated template exceeds AppSync internal limits), the response could still look valid.

2. **Content-specific issue** — The `markdownToHtml()` output may contain characters or patterns that cause the VTL template evaluation or DynamoDB PutItem to fail in a way that isn't captured by `$ctx.error`.

3. **AppSync evaluated template size limit** — Large AI responses converted to HTML could cause the evaluated VTL request mapping template to exceed AppSync's internal limits (~1MB), causing a silent resolver failure.

### Less Likely

4. **Amplify client returns cached/stale response** — The Amplify v6 client might under certain conditions return a response without actually sending the request to AppSync.

5. **Auth token timing** — Token expires between `checkAuthSession()` and the actual `graphql()` call, causing a silent auth failure.

6. **Wrong AppSync endpoint** — Frontend points to a different AppSync API than the one backed by the DynamoDB table being checked (multiple deployments).

---

## NEW FINDING: State Management Issue

### Observation
After successfully saving a note to DynamoDB, **one note from another group disappears** when viewing the notes list.

### Root Cause Analysis

**Multiple NotesProvider Instances:**
- The `/chat` page creates its **own isolated NotesProvider** instance (line 9 of `src/app/(dashboard)/chat/page.tsx`)
- This is separate from any provider on the main `/notes` page
- When you save from chat, only the chat page's context gets updated with the new note
- The `/notes` page doesn't see this update because it's a different React context instance

**State Inconsistency:**
```
Chat Page Context:          Notes Page Context:
  notes: [newNote, ...50]     notes: [50 old notes]
        ↑ isolated                   ↑ isolated
```

### Why Notes "Disappear"

**Hypothesis 1: Frontend Filtering/Display Bug (Most Likely)**

The notes table actually contains 51 items after save, but:
- A group filtering bug causes one note to be hidden
- React state inconsistency between provider instances
- The NotesList component filters by `note.category` matching group name (case-insensitive)
- If a note's category changed or doesn't match exactly, it won't show in its expected group

**Hypothesis 2: Race Condition (Confirmed Risk)**

From state management analysis:
- `createNote()` updates state: `setNotes((prev) => [newNote, ...prev])`
- `fetchNotes()` overwrites state: `setNotes(fetchedNotes)`
- If `fetchNotes()` is called while `createNote()` is in progress (e.g., AIFlashcardGenerator opens), the new note gets overwritten in state
- Evidence: `AIFlashcardGenerator` calls `fetchNotes()` on mount (line 51-55)

**Hypothesis 3: UUID Collision (Extremely Unlikely)**

If `$util.autoId()` generates a duplicate `SK` key, the PutItem would overwrite. Probability: ~negligible with UUIDs.

### Verification Steps

1. **Check actual DynamoDB count:**
   ```bash
   aws dynamodb scan --table-name aws-study-notes-notes \
     --select COUNT --filter-expression "begins_with(SK, :prefix)" \
     --expression-attribute-values '{":prefix":{"S":"NOTE#"}}'
   ```
   Does it show 51 items after save?

2. **Check console logs** from verification logging:
   - `[createNote] VERIFIED` confirms the note persists
   - Check if the "disappeared" note's ID shows up in DynamoDB but not in the frontend filtered list

3. **Disable all group filters** on the notes page and check if all 51 notes appear

4. **Check browser console** for the full notes array:
   ```js
   // In browser console on /notes page
   window.__notesContext = useNotes(); // if exposed
   console.log(window.__notesContext.notes.length);
   ```

5. **Compare categories** — Check if the "disappeared" note's category field changed somehow

## Next Debugging Steps

1. **Verify DynamoDB has 51 items** after a successful save (not 50)

2. **Check console logs** from the new verification logging:
   - `[createNote] Raw response:` — see exactly what AppSync returns
   - `[createNote] VERIFIED` vs `VERIFICATION FAILED` — confirms if DynamoDB persisted

3. **Check AppSync CloudWatch Logs** — The API has `fieldLogLevel: ERROR` enabled. Check for resolver errors during createNote mutations.

4. **Inspect filtered notes** — On the notes page, check which note is missing and verify its category field

5. **Network tab** — Check browser DevTools Network tab for the actual HTTP POST to the AppSync endpoint during save. Verify the request is sent and the response status.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `infrastructure/lib/infrastructure-stack.ts` | CDK stack with all resolvers |
| `infrastructure/lib/schema.graphql` | GraphQL schema |
| `src/lib/aws/appsync.ts` | AppSync client API functions |
| `src/lib/markdown-to-html.ts` | Markdown → HTML converter |
| `src/context/NotesContext.tsx` | Notes state management |
| `src/components/chat/ChatMessage.tsx` | AI tutor save-to-notes UI |
| `src/components/chat/ChatInterface.tsx` | Chat interface |
| `src/app/(dashboard)/chat/page.tsx` | Chat page (own NotesProvider) |
| `src/app/(dashboard)/notes/page.tsx` | Notes list page |
| `src/components/notes/NoteEditor.tsx` | TipTap rich text editor |
| `src/components/providers/AmplifyProvider.tsx` | Amplify configuration |
| `src/types/note.ts` | Note TypeScript types |
