# AWS Study Notes - Architecture Documentation

## System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend - Next.js App"
        UI[User Interface]
        subgraph "Pages"
            NotesPage[Notes Page]
            ChatPage[AI Tutor Chat]
            FlashcardsPage[Flashcards Page]
            DashboardPage[Dashboard]
        end
        subgraph "Context Providers"
            AuthCtx[AuthContext]
            NotesCtx[NotesContext]
            GroupsCtx[GroupsContext]
            ThemeCtx[ThemeContext]
        end
        subgraph "Components"
            NoteEditor[TipTap Editor]
            ChatMessage[Chat Messages]
            FlashcardCard[Flashcard Cards]
            GroupsSidebar[Groups Sidebar]
        end
        subgraph "API Clients"
            AmplifyClient[AWS Amplify Client]
            AppSyncAPI[AppSync API Functions]
        end
    end

    subgraph "Backend - AWS Services"
        subgraph "Authentication"
            Cognito[Amazon Cognito<br/>User Pool]
        end
        subgraph "GraphQL API"
            AppSync[AWS AppSync<br/>GraphQL API]
            VTLResolvers[VTL Resolvers]
        end
        subgraph "Business Logic"
            Lambda[Lambda Functions<br/>SM-2 Algorithm]
        end
        subgraph "Data Storage"
            DynamoDB[(DynamoDB Tables)]
            S3[S3 Bucket<br/>Images]
        end
        subgraph "Content Delivery"
            CloudFront[CloudFront CDN]
        end
    end

    subgraph "AI Services"
        OpenAI[OpenAI API<br/>GPT Models]
        Anthropic[Anthropic API<br/>Claude Models]
        Moonshot[Moonshot API]
    end

    UI --> NotesPage
    UI --> ChatPage
    UI --> FlashcardsPage
    UI --> DashboardPage

    NotesPage --> NotesCtx
    ChatPage --> NotesCtx
    FlashcardsPage --> NotesCtx

    NotesCtx --> AppSyncAPI
    GroupsCtx --> AppSyncAPI
    AuthCtx --> AmplifyClient

    AppSyncAPI --> AmplifyClient
    AmplifyClient --> Cognito
    AmplifyClient --> AppSync

    AppSync --> VTLResolvers
    VTLResolvers --> DynamoDB
    VTLResolvers --> Lambda

    NoteEditor --> S3
    S3 --> CloudFront
    CloudFront --> NoteEditor

    ChatPage --> OpenAI
    ChatPage --> Anthropic
    ChatPage --> Moonshot

    style UI fill:#4A90E2
    style Cognito fill:#FF9900
    style AppSync fill:#FF9900
    style DynamoDB fill:#FF9900
    style S3 fill:#FF9900
    style CloudFront fill:#FF9900
    style Lambda fill:#FF9900
```

---

## Data Flow Diagrams

### 1. User Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant AuthContext
    participant Amplify
    participant Cognito

    User->>UI: Enter email/password
    UI->>AuthContext: signIn(email, password)
    AuthContext->>Amplify: signIn()
    Amplify->>Cognito: Authenticate
    Cognito-->>Amplify: ID Token + Access Token
    Amplify-->>AuthContext: User session
    AuthContext-->>UI: Update auth state
    UI-->>User: Redirect to dashboard

    Note over Amplify,Cognito: Tokens stored in localStorage
    Note over AuthContext: JWT tokens used for all API calls
```

---

### 2. Notes CRUD Operations Flow

```mermaid
sequenceDiagram
    participant User
    participant NotesPage
    participant NotesContext
    participant AppSyncAPI
    participant Amplify
    participant AppSync
    participant VTL Resolver
    participant DynamoDB

    rect rgb(200, 220, 240)
        Note over User,DynamoDB: CREATE NOTE
        User->>NotesPage: Create new note
        NotesPage->>NotesContext: createNote(input)
        NotesContext->>AppSyncAPI: createNote(input)
        AppSyncAPI->>Amplify: graphql(CREATE_NOTE)
        Amplify->>AppSync: Mutation + ID Token
        AppSync->>VTL Resolver: Request template
        VTL Resolver->>VTL Resolver: Generate noteId (UUID)
        VTL Resolver->>DynamoDB: PutItem(PK, SK, attributes)
        DynamoDB-->>VTL Resolver: Success
        VTL Resolver-->>AppSync: Response template
        AppSync-->>Amplify: Note object
        Amplify-->>AppSyncAPI: GraphQL response
        AppSyncAPI->>AppSyncAPI: Sort notes alphabetically
        AppSyncAPI-->>NotesContext: New note
        NotesContext->>NotesContext: Update local state
        NotesContext-->>NotesPage: Updated notes array
        NotesPage-->>User: Show success toast
    end

    rect rgb(220, 240, 200)
        Note over User,DynamoDB: READ NOTES (with Pagination)
        User->>NotesPage: View notes
        NotesPage->>NotesContext: fetchNotes()
        NotesContext->>AppSyncAPI: getNotes()
        loop Pagination Loop
            AppSyncAPI->>Amplify: graphql(GET_NOTES, nextToken)
            Amplify->>AppSync: Query + ID Token
            AppSync->>VTL Resolver: Request template
            VTL Resolver->>DynamoDB: Query(PK, SK begins_with NOTE#, limit=1000)
            DynamoDB-->>VTL Resolver: Items + nextToken
            VTL Resolver-->>AppSync: Response template
            AppSync-->>Amplify: {items, nextToken}
            Amplify-->>AppSyncAPI: Page of notes
            AppSyncAPI->>AppSyncAPI: Concat to allNotes array
        end
        AppSyncAPI->>AppSyncAPI: Sort alphabetically by title
        AppSyncAPI-->>NotesContext: All notes (144 items)
        NotesContext-->>NotesPage: Render notes grid
    end

    rect rgb(240, 220, 200)
        Note over User,DynamoDB: UPDATE NOTE
        User->>NotesPage: Edit note
        NotesPage->>NotesContext: updateNote(noteId, input)
        NotesContext->>AppSyncAPI: updateNote(noteId, input)
        AppSyncAPI->>Amplify: graphql(UPDATE_NOTE)
        Amplify->>AppSync: Mutation + ID Token
        AppSync->>VTL Resolver: Request template
        VTL Resolver->>DynamoDB: UpdateItem(SET title, content, category, updatedAt)
        DynamoDB-->>VTL Resolver: Updated item
        VTL Resolver-->>AppSync: Response template
        AppSync-->>Amplify: Updated note
        Amplify-->>AppSyncAPI: GraphQL response
        AppSyncAPI-->>NotesContext: Updated note
        NotesContext->>NotesContext: Update local state
        NotesContext-->>NotesPage: Re-render note
    end

    rect rgb(240, 200, 200)
        Note over User,DynamoDB: DELETE NOTE
        User->>NotesPage: Delete note
        NotesPage->>NotesContext: deleteNote(noteId)
        NotesContext->>AppSyncAPI: deleteNote(noteId)
        AppSyncAPI->>Amplify: graphql(DELETE_NOTE)
        Amplify->>AppSync: Mutation + ID Token
        AppSync->>VTL Resolver: Request template
        VTL Resolver->>DynamoDB: DeleteItem(PK, SK)
        DynamoDB-->>VTL Resolver: Success
        VTL Resolver-->>AppSync: true
        AppSync-->>Amplify: Success
        Amplify-->>AppSyncAPI: true
        AppSyncAPI-->>NotesContext: Success
        NotesContext->>NotesContext: Filter out deleted note
        NotesContext-->>NotesPage: Re-render list
    end
```

---

### 3. AI Tutor Chat Flow

```mermaid
sequenceDiagram
    participant User
    participant ChatInterface
    participant ChatMessage
    participant AIRoute
    participant OpenAI
    participant NotesContext
    participant AppSync
    participant DynamoDB

    User->>ChatInterface: Type question
    ChatInterface->>AIRoute: POST /api/ai/chat
    Note over AIRoute: Model selection:<br/>GPT-4, Claude, Moonshot

    alt Using OpenAI
        AIRoute->>OpenAI: Chat completion request
        OpenAI-->>AIRoute: Stream response
    else Using Anthropic
        AIRoute->>OpenAI: Claude API request
        OpenAI-->>AIRoute: Stream response
    else Using Moonshot
        AIRoute->>OpenAI: Moonshot API request
        OpenAI-->>AIRoute: Stream response
    end

    AIRoute-->>ChatInterface: Stream chunks
    ChatInterface->>ChatInterface: Append to messages
    ChatInterface->>ChatMessage: Render AI response

    User->>ChatMessage: Click "Save to Notes"
    ChatMessage->>ChatMessage: Open dialog
    ChatMessage->>ChatMessage: Auto-generate title
    User->>ChatMessage: Confirm save

    ChatMessage->>ChatMessage: markdownToHtml(content)
    ChatMessage->>ChatMessage: Check size < 350KB
    ChatMessage->>NotesContext: createNote(input)
    NotesContext->>AppSync: CREATE_NOTE mutation
    AppSync->>DynamoDB: PutItem
    DynamoDB-->>AppSync: Success
    AppSync-->>NotesContext: New note
    NotesContext-->>ChatMessage: Success
    ChatMessage-->>User: "Note saved successfully!" toast
```

---

### 4. Flashcards Spaced Repetition Flow (SM-2 Algorithm)

```mermaid
sequenceDiagram
    participant User
    participant FlashcardsPage
    participant AppSyncAPI
    participant AppSync
    participant Lambda
    participant DynamoDB

    User->>FlashcardsPage: View due flashcards
    FlashcardsPage->>AppSyncAPI: getDueFlashcards()
    AppSyncAPI->>AppSync: Query getDueFlashcards
    AppSync->>DynamoDB: Query GSI (nextReviewDate <= now)
    DynamoDB-->>AppSync: Due cards
    AppSync-->>AppSyncAPI: Flashcards array
    AppSyncAPI-->>FlashcardsPage: Display cards

    User->>FlashcardsPage: Review card (quality: 0-5)
    FlashcardsPage->>AppSyncAPI: reviewFlashcard(cardId, quality)
    AppSyncAPI->>AppSync: Mutation reviewFlashcard
    AppSync->>Lambda: Invoke SM-2 function

    Lambda->>Lambda: Calculate new values:<br/>- easeFactor<br/>- interval<br/>- repetitions<br/>- nextReviewDate
    Lambda->>DynamoDB: UpdateItem with new values
    DynamoDB-->>Lambda: Updated card
    Lambda-->>AppSync: Updated flashcard
    AppSync-->>AppSyncAPI: Updated flashcard
    AppSyncAPI-->>FlashcardsPage: Update UI

    Note over Lambda: SM-2 Algorithm:<br/>quality 0-2: reset interval<br/>quality 3-5: increase interval<br/>easeFactor adjusted by quality
```

---

### 5. Image Upload Flow

```mermaid
sequenceDiagram
    participant User
    participant NoteEditor
    participant UploadAPI
    participant S3
    participant CloudFront

    User->>NoteEditor: Insert image
    NoteEditor->>UploadAPI: POST /api/upload/presigned-url
    UploadAPI->>UploadAPI: Generate unique key
    UploadAPI->>S3: getSignedUrl(PutObject)
    S3-->>UploadAPI: Presigned URL
    UploadAPI-->>NoteEditor: {uploadUrl, imageUrl}

    NoteEditor->>S3: PUT image (presigned URL)
    S3-->>NoteEditor: 200 OK

    NoteEditor->>NoteEditor: Insert image tag with CloudFront URL

    Note over User,CloudFront: Later viewing
    User->>NoteEditor: View note with image
    NoteEditor->>CloudFront: GET image
    CloudFront->>S3: Fetch (if not cached)
    S3-->>CloudFront: Image data
    CloudFront-->>NoteEditor: Cached image
    NoteEditor-->>User: Display image
```

---

## DynamoDB Data Model

```mermaid
erDiagram
    NOTES_TABLE {
        string PK "Cognito user sub (partition key)"
        string SK "NOTE#uuid or GROUP#uuid or SETTINGS#exam (sort key)"
        string noteId "UUID"
        string title "Note title"
        string content "HTML content (from TipTap)"
        string category "Group name"
        stringArray images "S3 image URLs"
        datetime createdAt "ISO 8601"
        datetime updatedAt "ISO 8601"
    }

    FLASHCARDS_TABLE {
        string PK "Cognito user sub (partition key)"
        string SK "CARD#uuid (sort key)"
        string cardId "UUID"
        string deckId "Deck identifier"
        string front "Question"
        string back "Answer"
        string noteId "Optional linked note"
        float easeFactor "SM-2 ease factor (default 2.5)"
        int interval "Days until next review"
        int repetitions "Successful reviews count"
        datetime nextReviewDate "ISO 8601 (indexed)"
        datetime createdAt "ISO 8601"
    }

    NOTES_TABLE ||--o{ FLASHCARDS_TABLE : "noteId reference"
```

### Access Patterns

```mermaid
graph LR
    subgraph "Notes Table Queries"
        Q1[Get all user notes:<br/>PK = userId AND<br/>SK begins_with NOTE#]
        Q2[Get specific note:<br/>PK = userId AND<br/>SK = NOTE#uuid]
        Q3[Get all user groups:<br/>PK = userId AND<br/>SK begins_with GROUP#]
        Q4[Get user settings:<br/>PK = userId AND<br/>SK = SETTINGS#exam]
    end

    subgraph "Flashcards Table Queries"
        Q5[Get deck cards:<br/>PK = userId AND<br/>SK begins_with CARD#<br/>FILTER deckId = deckId]
        Q6[Get due cards:<br/>GSI: nextReviewDate-index<br/>PK = userId AND<br/>nextReviewDate <= now]
    end

    style Q1 fill:#E8F5E9
    style Q2 fill:#E8F5E9
    style Q3 fill:#E8F5E9
    style Q4 fill:#E8F5E9
    style Q5 fill:#FFF3E0
    style Q6 fill:#FFF3E0
```

---

## Component Hierarchy

```mermaid
graph TD
    App[RootLayout]
    App --> Providers[Provider Stack]

    Providers --> Amplify[AmplifyProvider]
    Providers --> Theme[ThemeProvider]
    Providers --> Toast[ToastProvider]
    Providers --> Confirm[ConfirmProvider]
    Providers --> Auth[AuthProvider]

    App --> Dashboard[Dashboard Layout]

    Dashboard --> NotesRoute[/notes]
    Dashboard --> ChatRoute[/chat]
    Dashboard --> FlashcardsRoute[/flashcards]
    Dashboard --> DashboardRoute[/dashboard]

    NotesRoute --> NotesProvider1[NotesProvider]
    NotesRoute --> GroupsProvider1[GroupsProvider]
    NotesRoute --> NotesList[NotesList]
    NotesList --> NoteCard[NoteCard]
    NotesList --> GroupsSidebar

    ChatRoute --> NotesProvider2[NotesProvider - Isolated]
    ChatRoute --> GroupsProvider2[GroupsProvider]
    ChatRoute --> ChatInterface
    ChatInterface --> ChatMessage
    ChatInterface --> ChatInput
    ChatInterface --> ModelSelector

    FlashcardsRoute --> FlashcardsList
    FlashcardsList --> FlashcardCard
    FlashcardsList --> AIFlashcardGenerator

    DashboardRoute --> ExamCountdown
    DashboardRoute --> DailyGoals
    DashboardRoute --> StatsCards

    NotesRoute --> NewNotePage[/notes/new]
    NotesRoute --> EditNotePage[/notes/[id]]
    NotesRoute --> ViewNotePage[/notes/[id]/view]

    NewNotePage --> NoteEditor
    EditNotePage --> NoteEditor
    ViewNotePage --> AIExplainPanel

    style NotesProvider1 fill:#FFE0B2
    style NotesProvider2 fill:#FFE0B2
    style GroupsProvider1 fill:#C8E6C9
    style GroupsProvider2 fill:#C8E6C9

    Note1[Note: Chat page has its own<br/>isolated NotesProvider instance]
    style Note1 fill:#FFCDD2
```

---

## GraphQL API Schema

```mermaid
classDiagram
    class Query {
        +getNotes(limit: Int, nextToken: String) NotesConnection
        +getNote(noteId: ID!) Note
        +getFlashcards(deckId: ID!) Flashcard[]
        +getDueFlashcards() Flashcard[]
        +getGroups() Group[]
        +getGroup(groupId: ID!) Group
        +getUserSettings() UserSettings
    }

    class Mutation {
        +createNote(input: CreateNoteInput!) Note
        +updateNote(noteId: ID!, input: UpdateNoteInput!) Note
        +deleteNote(noteId: ID!) Boolean
        +createFlashcard(input: CreateFlashcardInput!) Flashcard
        +reviewFlashcard(cardId: ID!, quality: Int!) Flashcard
        +createGroup(input: CreateGroupInput!) Group
        +updateGroup(groupId: ID!, input: UpdateGroupInput!) Group
        +deleteGroup(groupId: ID!) Boolean
        +saveUserSettings(input: SaveUserSettingsInput!) UserSettings
    }

    class Note {
        +ID noteId
        +String! title
        +String! content
        +String category
        +String[] images
        +AWSDateTime! createdAt
        +AWSDateTime! updatedAt
    }

    class NotesConnection {
        +Note[] items
        +String nextToken
    }

    class Flashcard {
        +ID cardId
        +ID deckId
        +String! front
        +String! back
        +ID noteId
        +Float! easeFactor
        +Int! interval
        +Int! repetitions
        +AWSDateTime! nextReviewDate
        +AWSDateTime! createdAt
    }

    class Group {
        +ID groupId
        +String! name
        +String color
        +AWSDateTime! createdAt
        +AWSDateTime! updatedAt
    }

    class UserSettings {
        +String examDate
        +TodoItem[] todos
        +AWSDateTime! updatedAt
    }

    Query --> NotesConnection
    Query --> Note
    Query --> Flashcard
    Query --> Group
    Query --> UserSettings
    Mutation --> Note
    Mutation --> Flashcard
    Mutation --> Group
    Mutation --> UserSettings
    NotesConnection --> Note
```

---

## State Management Flow

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated

    Unauthenticated --> Authenticated: User signs in
    Authenticated --> Unauthenticated: User signs out

    state Authenticated {
        [*] --> LoadingNotes
        LoadingNotes --> NotesLoaded: fetchNotes() success
        LoadingNotes --> NotesError: fetchNotes() error
        NotesError --> LoadingNotes: Retry

        NotesLoaded --> CreatingNote: createNote()
        CreatingNote --> NotesLoaded: Success (prepend + sort)
        CreatingNote --> NotesError: Error

        NotesLoaded --> UpdatingNote: updateNote()
        UpdatingNote --> NotesLoaded: Success (update in array)
        UpdatingNote --> NotesError: Error

        NotesLoaded --> DeletingNote: deleteNote()
        DeletingNote --> NotesLoaded: Success (filter out)
        DeletingNote --> NotesError: Error

        state NotesLoaded {
            [*] --> AllNotes
            AllNotes --> FilteredByGroup: Select group
            FilteredByGroup --> AllNotes: Clear filter
            AllNotes --> SearchFiltered: Type search
            SearchFiltered --> AllNotes: Clear search
            FilteredByGroup --> SearchFiltered: Type search
        }
    }

    note right of Authenticated
        Notes state is managed by
        NotesContext with local
        React state synchronized
        with DynamoDB via AppSync
    end note
```

---

## Environment Configuration

```mermaid
graph TB
    subgraph "Environment Variables"
        ENV[.env.local]
        ENV --> AWS[AWS Configuration]
        ENV --> AI[AI Services]

        AWS --> Region[NEXT_PUBLIC_AWS_REGION]
        AWS --> Cognito[NEXT_PUBLIC_COGNITO_*]
        AWS --> AppSyncURL[NEXT_PUBLIC_APPSYNC_ENDPOINT]
        AWS --> S3Bucket[NEXT_PUBLIC_S3_BUCKET]
        AWS --> CloudFrontURL[NEXT_PUBLIC_CLOUDFRONT_URL]

        AI --> OpenAIKey[OPENAI_API_KEY]
        AI --> AnthropicKey[ANTHROPIC_API_KEY]
        AI --> MoonshotKey[MOONSHOT_API_KEY]
        AI --> AWSAccess[AWS_ACCESS_KEY_ID]
        AI --> AWSSecret[AWS_SECRET_ACCESS_KEY]
    end

    subgraph "Runtime Configuration"
        AmplifyConfig[AmplifyProvider]
        AmplifyConfig --> AuthConfig[Cognito User Pool]
        AmplifyConfig --> APIConfig[GraphQL Endpoint]
        AmplifyConfig --> StorageConfig[S3 Bucket]
    end

    ENV --> AmplifyConfig

    style ENV fill:#FFF9C4
    style AmplifyConfig fill:#C5E1A5
```

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Source Control"
        GitHub[GitHub Repository]
    end

    subgraph "Frontend Deployment"
        GitHub -->|Push to main| Vercel
        Vercel[Vercel]
        Vercel --> VercelBuild[Build Next.js App]
        VercelBuild --> VercelDeploy[Deploy to Edge Network]
    end

    subgraph "Infrastructure Deployment"
        GitHub -->|Manual: npx cdk deploy| CDK[AWS CDK]
        CDK --> CFN[CloudFormation]
        CFN --> DeployStack[Deploy Stack]

        DeployStack --> DeployCognito[Cognito User Pool]
        DeployStack --> DeployAppSync[AppSync API]
        DeployStack --> DeployDynamoDB[DynamoDB Tables]
        DeployStack --> DeployLambda[Lambda Functions]
        DeployStack --> DeployS3[S3 Bucket]
        DeployStack --> DeployCF[CloudFront Distribution]
    end

    VercelDeploy --> Users[End Users]
    Users --> DeployAppSync

    style GitHub fill:#24292e,color:#fff
    style Vercel fill:#000,color:#fff
    style CDK fill:#FF9900
    style CFN fill:#FF9900
```

---

## Key Features & Flows

### Notes Feature
- ✅ Create, read, update, delete notes
- ✅ Rich text editing with TipTap (bold, italic, headings, lists, code blocks, images)
- ✅ Group/category organization
- ✅ Search across title and content
- ✅ Filter by group or ungrouped
- ✅ Image upload to S3 with CloudFront delivery
- ✅ AI-powered summarization and explanation
- ✅ Alphabetical sorting by title
- ✅ Pagination support for 1000+ notes

### AI Tutor Feature
- ✅ Multiple AI models (GPT-4, Claude, Moonshot)
- ✅ Streaming responses
- ✅ Save chat responses as notes
- ✅ Markdown to HTML conversion
- ✅ Auto-title generation from content
- ✅ Content size validation (350KB limit)

### Flashcards Feature
- ✅ Spaced repetition using SM-2 algorithm
- ✅ Link flashcards to notes
- ✅ AI-generated flashcards from notes
- ✅ Due date tracking with GSI
- ✅ Quality ratings (0-5) adjust review intervals

### Groups Feature
- ✅ Color-coded categories
- ✅ Sidebar navigation
- ✅ Alphabetical sorting
- ✅ Note count per group
- ✅ Ungrouped notes support

### Dashboard Feature
- ✅ Exam countdown timer
- ✅ Daily goals checklist
- ✅ Study statistics

---

## Security Model

```mermaid
graph TB
    User[User]
    User --> Cognito[Cognito Authentication]
    Cognito --> IDToken[ID Token JWT]

    IDToken --> AppSync[AppSync API]
    AppSync --> AuthCheck{Verify Token}

    AuthCheck -->|Valid| GetUserID[Extract user sub]
    AuthCheck -->|Invalid| Reject[401 Unauthorized]

    GetUserID --> VTL[VTL Resolver]
    VTL --> CheckOwnership{Check Data Ownership}

    CheckOwnership -->|PK = $ctx.identity.sub| AllowAccess[Allow Operation]
    CheckOwnership -->|PK != $ctx.identity.sub| DenyAccess[Deny Operation]

    AllowAccess --> DynamoDB[(DynamoDB)]

    style Cognito fill:#FF9900
    style Reject fill:#FFCDD2
    style DenyAccess fill:#FFCDD2
    style AllowAccess fill:#C8E6C9

    note1[All data is scoped to user<br/>via PK = Cognito sub.<br/>Users can only access<br/>their own data.]

    style note1 fill:#FFF9C4
```

---

## Performance Optimizations

1. **Pagination**: Notes and flashcards support pagination to handle large datasets
2. **Consistent Reads**: DynamoDB queries use `consistentRead: true` for data accuracy
3. **Alphabetical Sorting**: Client-side sorting for predictable ordering
4. **CloudFront CDN**: Images cached at edge locations
5. **Pay-per-request Billing**: DynamoDB scales automatically without capacity planning
6. **Streaming AI Responses**: Real-time display of AI-generated content
7. **Local State Management**: React Context reduces unnecessary API calls
8. **Presigned URLs**: Direct S3 uploads bypass backend processing

---

## Known Issues & Solutions

### Issue 1: Notes Not Displaying (RESOLVED)
**Problem**: Only 50 out of 144 notes were visible
**Root Cause**: Missing pagination support in `getNotes` resolver
**Solution**: Added `limit` and `nextToken` parameters with automatic pagination loop

### Issue 2: Save-to-Notes Silent Failure (RESOLVED)
**Problem**: AI tutor save appeared successful but note wasn't in database
**Root Cause**: Missing error handling in AppSync resolver response template
**Solution**: Added `$ctx.error` check in VTL response templates

### Issue 3: Isolated Context Instances
**Problem**: Chat page has separate NotesProvider instance from main notes page
**Status**: By design - each page manages its own state
**Impact**: Saving note in chat doesn't update notes page until refresh

### Issue 4: Race Condition Risk
**Problem**: `fetchNotes()` can overwrite `createNote()` state updates
**Status**: Low impact - rare occurrence
**Mitigation**: State updates use functional setters

---

## Future Enhancements

- [ ] Real-time collaboration with WebSockets
- [ ] Note version history
- [ ] Export notes to PDF/Markdown
- [ ] Advanced search with filters (date, tags, AI-powered semantic search)
- [ ] Mobile app with offline support
- [ ] Note sharing with other users
- [ ] Integration with AWS certification practice exams
- [ ] Analytics dashboard for study progress
- [ ] Voice notes with transcription
- [ ] Browser extension for quick note capture
