# AWS Setup Guide for AWS Study Notes Application

This guide walks you through setting up all AWS services required for the application.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured (optional, but helpful)
- Basic familiarity with AWS Console

## Step 1: Create Cognito User Pool

### 1.1 Create User Pool

1. Go to **Amazon Cognito** in AWS Console
2. Click **Create user pool**
3. **Sign-in options**: Choose "Email"
4. **Password policy**: Use default or customize
5. **MFA**: Optional (recommended: No MFA for simplicity)
6. **User pool name**: `aws-study-notes-pool`
7. Click **Create user pool**

### 1.2 Configure App Client

1. After creating the pool, go to **App integration** tab
2. Scroll to **App clients and analytics**
3. Click **Create app client**
4. **App client name**: `aws-study-notes-client`
5. **Client secret**: Uncheck "Generate client secret" (required for Amplify)
6. Click **Create app client**

### 1.3 Get Credentials

1. Note down:
   - **User Pool ID** (e.g., `us-east-1_XXXXXXXXX`)
   - **App Client ID** (found in App clients section)

### 1.4 Configure Hosted UI (Optional)

1. In **App integration** tab, scroll to **Domain**
2. Create a Cognito domain (e.g., `aws-study-notes`)
3. In **App client settings**, add:
   - **Allowed callback URLs**: `http://localhost:3000`, `https://yourdomain.com`
   - **Allowed sign-out URLs**: `http://localhost:3000`, `https://yourdomain.com`
   - **Allowed OAuth flows**: Authorization code grant
   - **Allowed OAuth scopes**: `email`, `openid`, `profile`

---

## Step 2: Create DynamoDB Tables

### 2.1 Create Notes Table

1. Go to **DynamoDB** in AWS Console
2. Click **Create table**
3. **Table name**: `aws-study-notes-notes`
4. **Partition key**: `PK` (String)
5. **Sort key**: `SK` (String)
6. **Table settings**: Use default settings
7. Click **Create table**

**Note**: Since PK is already the partition key, no additional GSI is needed for the Notes table. The table's primary key (PK + SK) already allows querying by user.

### 2.2 Create Flashcards Table

1. Click **Create table**
2. **Table name**: `aws-study-notes-flashcards`
3. **Partition key**: `PK` (String)
4. **Sort key**: `SK` (String)
5. Click **Create table**

**Add Global Secondary Index for due flashcards:**

**Index: nextReviewDate-index**
1. Click **Create index**
2. **Index name**: `nextReviewDate-index`
3. **Partition key**: `PK` (String)
4. **Sort key**: `nextReviewDate` (String)
5. Click **Create index**

---

## Step 3: Create S3 Bucket

### 3.1 Create Bucket

1. Go to **S3** in AWS Console
2. Click **Create bucket**
3. **Bucket name**: `aws-study-notes-images-<your-unique-id>` (must be globally unique)
4. **AWS Region**: Choose your region (e.g., `us-east-1`)
5. **Block Public Access**: Uncheck "Block all public access" (or configure bucket policy)
6. Click **Create bucket**

### 3.2 Configure CORS

1. Select your bucket
2. Go to **Permissions** tab
3. Scroll to **Cross-origin resource sharing (CORS)**
4. Click **Edit** and add:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 3.3 Configure Bucket Policy

1. In **Permissions** tab, scroll to **Bucket policy**
2. Click **Edit** and add (replace `YOUR-BUCKET-NAME` and `YOUR-ACCOUNT-ID`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    },
    {
      "Sid": "AllowCognitoUsers",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR-ACCOUNT-ID:root"
      },
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

---

## Step 4: Create Lambda Function for SM-2 Calculation

### 4.1 Create Lambda Function

1. Go to **Lambda** in AWS Console
2. Click **Create function**
3. **Function name**: `review-flashcard`
4. **Runtime**: Node.js 18.x or later
5. **Architecture**: x86_64
6. Click **Create function**

### 4.2 Add Code

1. In the function, go to **Code** tab
2. Replace the default code with the code from `lambda/review-flashcard/index.js` in this repository
3. Click **Deploy**

### 4.3 Configure Permissions

1. Go to **Configuration** → **Permissions**
2. Click on the execution role
3. Add inline policy with DynamoDB permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/aws-study-notes-flashcards"
    }
  ]
}
```

---

## Step 5: Create AppSync GraphQL API

### 5.1 Create API

1. Go to **AWS AppSync** in AWS Console
2. Click **Create API**
3. Choose **Build from scratch**
4. **API name**: `aws-study-notes-api`
5. Click **Create**

### 5.2 Configure Authentication

1. Go to **Settings** in the left sidebar
2. Under **Default authorization mode**, click **Edit**
3. Choose **Amazon Cognito User Pool**
4. Select your Cognito User Pool (created in Step 1)
5. Click **Save**

### 5.3 Add GraphQL Schema

1. Go to **Schema** in the left sidebar
2. Click **Edit schema**
3. Replace the default schema with:

```graphql
type Note {
  noteId: ID!
  title: String!
  content: String!
  category: String
  tags: [String]
  images: [String]
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type Flashcard {
  cardId: ID!
  deckId: ID!
  front: String!
  back: String!
  noteId: ID
  easeFactor: Float!
  interval: Int!
  repetitions: Int!
  nextReviewDate: AWSDateTime!
  createdAt: AWSDateTime!
}

input CreateNoteInput {
  title: String!
  content: String!
  category: String
  tags: [String]
  images: [String]
}

input UpdateNoteInput {
  title: String
  content: String
  category: String
  tags: [String]
  images: [String]
}

input CreateFlashcardInput {
  deckId: ID!
  front: String!
  back: String!
  noteId: ID
}

type Query {
  getNotes: [Note]
  getNote(noteId: ID!): Note
  getFlashcards(deckId: ID!): [Flashcard]
  getDueFlashcards: [Flashcard]
}

type Mutation {
  createNote(input: CreateNoteInput!): Note
  updateNote(noteId: ID!, input: UpdateNoteInput!): Note
  deleteNote(noteId: ID!): Boolean
  createFlashcard(input: CreateFlashcardInput!): Flashcard
  reviewFlashcard(cardId: ID!, quality: Int!): Flashcard
}
```

4. Click **Save schema**

### 5.4 Create Data Sources

Create the following data sources:

1. **NotesTable**
   - Type: DynamoDB table
   - Region: Your region
   - Table name: `aws-study-notes-notes`

2. **FlashcardsTable**
   - Type: DynamoDB table
   - Region: Your region
   - Table name: `aws-study-notes-flashcards`

3. **ReviewFlashcardLambda**
   - Type: Lambda function
   - Region: Your region
   - Function ARN: Your Lambda function ARN

### 5.5 Create Resolvers

#### Resolver 1: getNotes Query

1. In **Schema**, find `getNotes: [Note]` query
2. Click **Attach** next to it
3. **Data source**: `NotesTable`
4. **Request mapping template**:

```vtl
{
  "version": "2017-02-28",
  "operation": "Query",
  "query": {
    "expression": "PK = :userId AND begins_with(SK, :notePrefix)",
    "expressionValues": {
      ":userId": {
        "S": "$ctx.identity.sub"
      },
      ":notePrefix": {
        "S": "NOTE#"
      }
    }
  }
}
```

5. **Response mapping template**:

```vtl
$util.toJson($ctx.result.items)
```

#### Resolver 2: getNote Query

1. Attach resolver to `getNote(noteId: ID!): Note`
2. **Data source**: `NotesTable`
3. **Request mapping template**:

```vtl
{
  "version": "2017-02-28",
  "operation": "GetItem",
  "key": {
    "PK": {
      "S": "$ctx.identity.sub"
    },
    "SK": {
      "S": "NOTE#$ctx.arguments.noteId"
    }
  }
}
```

4. **Response mapping template**:

```vtl
$util.toJson($ctx.result)
```

#### Resolver 3: createNote Mutation

1. Attach resolver to `createNote(input: CreateNoteInput!): Note`
2. **Data source**: `NotesTable`
3. **Request mapping template**:

```vtl
#set($noteId = $util.autoId())
#set($now = $util.time.nowISO8601())
{
  "version": "2017-02-28",
  "operation": "PutItem",
  "key": {
    "PK": {
      "S": "$ctx.identity.sub"
    },
    "SK": {
      "S": "NOTE#$noteId"
    }
  },
  "attributeValues": {
    "noteId": {
      "S": "$noteId"
    },
    "title": {
      "S": "$ctx.arguments.input.title"
    },
    "content": {
      "S": "$ctx.arguments.input.content"
    },
    "createdAt": {
      "S": "$now"
    },
    "updatedAt": {
      "S": "$now"
    }
    #if($ctx.arguments.input.category)
    ,"category": {
      "S": "$ctx.arguments.input.category"
    }
    #end
    #if($ctx.arguments.input.tags)
    ,"tags": {
      "L": [
        #foreach($tag in $ctx.arguments.input.tags)
        {
          "S": "$tag"
        }#if($foreach.hasNext),#end
        #end
      ]
    }
    #end
    #if($ctx.arguments.input.images)
    ,"images": {
      "L": [
        #foreach($image in $ctx.arguments.input.images)
        {
          "S": "$image"
        }#if($foreach.hasNext),#end
        #end
      ]
    }
    #end
  }
}
```

4. **Response mapping template**:

```vtl
$util.toJson($ctx.result)
```

#### Resolver 4: updateNote Mutation

1. Attach resolver to `updateNote(noteId: ID!, input: UpdateNoteInput!): Note`
2. **Data source**: `NotesTable`
3. **Request mapping template**:

```vtl
#set($now = $util.time.nowISO8601())
#set($updateExpressions = [])
#set($expressionValues = {})

#set($updateExpressions = $util.list.copyAndAdd($updateExpressions, "updatedAt = :now"))
$util.qr($expressionValues.put(":now", $util.dynamodb.toDynamoDB($now)))

#if($ctx.arguments.input.title)
  $util.qr($updateExpressions.add("title = :title"))
  $util.qr($expressionValues.put(":title", $util.dynamodb.toDynamoDB($ctx.arguments.input.title)))
#end

#if($ctx.arguments.input.content)
  $util.qr($updateExpressions.add("content = :content"))
  $util.qr($expressionValues.put(":content", $util.dynamodb.toDynamoDB($ctx.arguments.input.content)))
#end

#if($ctx.arguments.input.category)
  $util.qr($updateExpressions.add("category = :category"))
  $util.qr($expressionValues.put(":category", $util.dynamodb.toDynamoDB($ctx.arguments.input.category)))
#end

#if($ctx.arguments.input.tags)
  $util.qr($updateExpressions.add("tags = :tags"))
  $util.qr($expressionValues.put(":tags", $util.dynamodb.toDynamoDB($ctx.arguments.input.tags)))
#end

#if($ctx.arguments.input.images)
  $util.qr($updateExpressions.add("images = :images"))
  $util.qr($expressionValues.put(":images", $util.dynamodb.toDynamoDB($ctx.arguments.input.images)))
#end

{
  "version": "2017-02-28",
  "operation": "UpdateItem",
  "key": {
    "PK": {
      "S": "$ctx.identity.sub"
    },
    "SK": {
      "S": "NOTE#$ctx.arguments.noteId"
    }
  },
  "update": {
    "expression": "SET $util.join($updateExpressions, ', ')",
    "expressionValues": $util.toJson($expressionValues)
  }
}
```

4. **Response mapping template**:

```vtl
$util.toJson($ctx.result)
```

#### Resolver 5: deleteNote Mutation

1. Attach resolver to `deleteNote(noteId: ID!): Boolean`
2. **Data source**: `NotesTable`
3. **Request mapping template**:

```vtl
{
  "version": "2017-02-28",
  "operation": "DeleteItem",
  "key": {
    "PK": {
      "S": "$ctx.identity.sub"
    },
    "SK": {
      "S": "NOTE#$ctx.arguments.noteId"
    }
  }
}
```

4. **Response mapping template**:

```vtl
true
```

#### Resolver 6: getFlashcards Query

1. Attach resolver to `getFlashcards(deckId: ID!): [Flashcard]`
2. **Data source**: `FlashcardsTable`
3. **Request mapping template**:

```vtl
{
  "version": "2017-02-28",
  "operation": "Query",
  "query": {
    "expression": "PK = :userId AND begins_with(SK, :cardPrefix)",
    "expressionValues": {
      ":userId": {
        "S": "$ctx.identity.sub"
      },
      ":cardPrefix": {
        "S": "CARD#"
      }
    }
  },
  "filter": {
    "expression": "deckId = :deckId",
    "expressionValues": {
      ":deckId": {
        "S": "$ctx.arguments.deckId"
      }
    }
  }
}
```

4. **Response mapping template**:

```vtl
$util.toJson($ctx.result.items)
```

#### Resolver 7: getDueFlashcards Query

1. Attach resolver to `getDueFlashcards: [Flashcard]`
2. **Data source**: `FlashcardsTable`
3. **Request mapping template**:

```vtl
{
  "version": "2017-02-28",
  "operation": "Query",
  "index": "nextReviewDate-index",
  "query": {
    "expression": "PK = :userId AND nextReviewDate <= :now",
    "expressionValues": {
      ":userId": {
        "S": "$ctx.identity.sub"
      },
      ":now": {
        "S": "$util.time.nowISO8601()"
      }
    }
  }
}
```

4. **Response mapping template**:

```vtl
$util.toJson($ctx.result.items)
```

#### Resolver 8: createFlashcard Mutation

1. Attach resolver to `createFlashcard(input: CreateFlashcardInput!): Flashcard`
2. **Data source**: `FlashcardsTable`
3. **Request mapping template**:

```vtl
#set($cardId = $util.autoId())
#set($now = $util.time.nowISO8601())
#set($defaultDate = $util.time.nowISO8601())
{
  "version": "2017-02-28",
  "operation": "PutItem",
  "key": {
    "PK": {
      "S": "$ctx.identity.sub"
    },
    "SK": {
      "S": "CARD#$cardId"
    }
  },
  "attributeValues": {
    "cardId": {
      "S": "$cardId"
    },
    "deckId": {
      "S": "$ctx.arguments.input.deckId"
    },
    "front": {
      "S": "$ctx.arguments.input.front"
    },
    "back": {
      "S": "$ctx.arguments.input.back"
    },
    "easeFactor": {
      "N": "2.5"
    },
    "interval": {
      "N": "0"
    },
    "repetitions": {
      "N": "0"
    },
    "nextReviewDate": {
      "S": "$defaultDate"
    },
    "createdAt": {
      "S": "$now"
    }
    #if($ctx.arguments.input.noteId)
    ,"noteId": {
      "S": "$ctx.arguments.input.noteId"
    }
    #end
  }
}
```

4. **Response mapping template**:

```vtl
$util.toJson($ctx.result)
```

#### Resolver 9: reviewFlashcard Mutation (Lambda)

1. Attach resolver to `reviewFlashcard(cardId: ID!, quality: Int!): Flashcard`
2. **Data source**: `ReviewFlashcardLambda`
3. **Request mapping template**:

```vtl
{
  "version": "2017-02-28",
  "operation": "Invoke",
  "payload": {
    "arguments": {
      "cardId": "$ctx.arguments.cardId",
      "quality": $ctx.arguments.quality,
      "userId": "$ctx.identity.sub"
    }
  }
}
```

4. **Response mapping template**:

```vtl
#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end
$util.toJson($ctx.result)
```

### 5.6 Get API Endpoint

1. Go to **Settings** in AppSync
2. Copy the **GraphQL API endpoint** URL

---

## Step 6: Configure IAM Roles

### 6.1 Create IAM Policy for AppSync

1. Go to **IAM** → **Policies**
2. Click **Create policy**
3. Go to **JSON** tab and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "appsync:GraphQL"
      ],
      "Resource": "arn:aws:appsync:*:*:apis/*/types/*/fields/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Query",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/aws-study-notes-notes",
        "arn:aws:dynamodb:*:*:table/aws-study-notes-notes/index/*",
        "arn:aws:dynamodb:*:*:table/aws-study-notes-flashcards",
        "arn:aws:dynamodb:*:*:table/aws-study-notes-flashcards/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

4. Replace `YOUR-BUCKET-NAME` with your S3 bucket name
5. Name: `AWSStudyNotesPolicy`
6. Click **Create policy**

### 6.2 Attach Policy to Cognito Identity Pool (if using)

If you're using Cognito Identity Pools (not required for this setup), attach the policy to the authenticated role.

---

## Step 7: (Optional) Create CloudFront Distribution

### 7.1 Create Distribution

1. Go to **CloudFront** in AWS Console
2. Click **Create distribution**
3. **Origin domain**: Select your S3 bucket
4. **Origin access**: Choose "Origin access control settings (recommended)"
5. **Viewer protocol policy**: Redirect HTTP to HTTPS
6. Click **Create distribution**

### 7.2 Update S3 Bucket Policy

After creating CloudFront, update your S3 bucket policy to allow CloudFront access.

---

## Step 8: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

2. Update `.env.local` with your values:

```env
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APPSYNC_ENDPOINT=https://xxxxxxxxxxxx.appsync-api.us-east-1.amazonaws.com/graphql
NEXT_PUBLIC_S3_BUCKET=aws-study-notes-images-your-unique-id
NEXT_PUBLIC_CLOUDFRONT_URL=https://xxxxxxxxxxxxx.cloudfront.net
```

---

## Step 9: Test the Setup

1. Start your Next.js app:
```bash
npm run dev
```

2. Try registering a new user
3. Create a note
4. Upload an image
5. Create a flashcard
6. Review flashcards

---

## Troubleshooting

### Common Issues

1. **CORS errors**: Make sure S3 CORS is configured correctly
2. **Unauthorized errors**: Check IAM policies and Cognito configuration
3. **GraphQL errors**: Verify resolver mapping templates
4. **Image upload fails**: Check S3 bucket policy and CORS settings
5. **Lambda timeout**: Increase Lambda timeout if needed (default is 3 seconds)

### Useful Commands

```bash
# Check AWS credentials
aws sts get-caller-identity

# Test Cognito
aws cognito-idp list-user-pools --max-results 10

# Test DynamoDB
aws dynamodb list-tables

# Test Lambda
aws lambda invoke --function-name review-flashcard --payload '{"arguments":{"cardId":"test","quality":3},"identity":{"sub":"test-user"}}' response.json
```

---

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. Use **least privilege** IAM policies
3. Enable **MFA** on your AWS account
4. Use **CloudFront** for S3 to avoid exposing bucket URLs
5. Regularly **rotate** access keys
6. Enable **CloudTrail** for audit logging
7. Use **VPC** endpoints for private resources (optional)

---

## Cost Estimation

Approximate monthly costs (varies by usage):
- **Cognito**: Free tier includes 50,000 MAUs
- **DynamoDB**: Free tier includes 25 GB storage, 25 RCU, 25 WCU
- **AppSync**: $4 per million queries
- **S3**: $0.023 per GB storage, $0.005 per 1,000 requests
- **CloudFront**: $0.085 per GB data transfer
- **Lambda**: Free tier includes 1M requests, 400,000 GB-seconds

---

## Next Steps

1. Deploy your Next.js app to Vercel
2. Update environment variables in Vercel dashboard
3. Test the production deployment
4. Set up monitoring and alerts in CloudWatch
5. Configure CloudWatch alarms for errors and high usage
