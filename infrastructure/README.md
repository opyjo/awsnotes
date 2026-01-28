# AWS Study Notes - Infrastructure (CDK)

This directory contains the AWS CDK infrastructure code to provision all AWS services for the AWS Study Notes application.

## What Gets Created

Running `cdk deploy` will create:

| Service | Resource | Name |
|---------|----------|------|
| Cognito | User Pool | aws-study-notes-pool |
| Cognito | App Client | aws-study-notes-client |
| DynamoDB | Notes Table | aws-study-notes-notes |
| DynamoDB | Flashcards Table | aws-study-notes-flashcards |
| S3 | Images Bucket | aws-study-notes-images-{account}-{region} |
| CloudFront | Distribution | (auto-generated) |
| Lambda | SM-2 Function | review-flashcard |
| AppSync | GraphQL API | aws-study-notes-api |

## Prerequisites

1. **AWS CLI** configured with credentials:
   ```bash
   aws configure
   ```

2. **AWS CDK CLI** installed:
   ```bash
   npm install -g aws-cdk
   ```

3. **CDK Bootstrap** (one-time per account/region):
   ```bash
   cdk bootstrap
   ```

## Deployment

### Quick Deploy

From the `infrastructure` directory:

```bash
# Install dependencies
npm install

# Deploy all resources
npx cdk deploy
```

### Step-by-Step

1. **Install dependencies:**
   ```bash
   cd infrastructure
   npm install
   ```

2. **Review what will be created:**
   ```bash
   npx cdk diff
   ```

3. **Deploy:**
   ```bash
   npx cdk deploy
   ```

4. **Copy outputs to .env.local:**
   After deployment, CDK outputs the values you need. Copy them to your `.env.local` file:
   ```
   NEXT_PUBLIC_AWS_REGION=<Region output>
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=<UserPoolId output>
   NEXT_PUBLIC_COGNITO_CLIENT_ID=<UserPoolClientId output>
   NEXT_PUBLIC_APPSYNC_ENDPOINT=<GraphQLApiUrl output>
   NEXT_PUBLIC_S3_BUCKET=<S3BucketName output>
   NEXT_PUBLIC_CLOUDFRONT_URL=<CloudFrontUrl output>
   ```

## Useful Commands

```bash
# Compile TypeScript
npm run build

# Watch for changes
npm run watch

# Synthesize CloudFormation template
npx cdk synth

# Compare deployed stack with current state
npx cdk diff

# Deploy the stack
npx cdk deploy

# Destroy all resources (CAUTION!)
npx cdk destroy
```

## Customization

### Change Region

Edit `bin/infrastructure.ts`:
```typescript
env: { 
  account: process.env.CDK_DEFAULT_ACCOUNT, 
  region: 'eu-west-1'  // Change this
}
```

### Production Settings

In `lib/infrastructure-stack.ts`, change:
```typescript
// Change DESTROY to RETAIN for production
removalPolicy: cdk.RemovalPolicy.RETAIN,

// Remove autoDeleteObjects for S3
autoDeleteObjects: false,
```

### Custom Domain

Add your domain to the allowed URLs in:
- Cognito App Client callback/logout URLs
- S3 CORS allowed origins

## Troubleshooting

### Bootstrap Error
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/REGION
```

### Permission Errors
Ensure your AWS credentials have sufficient permissions (AdministratorAccess recommended for CDK).

### Stack Already Exists
```bash
# Delete and recreate
npx cdk destroy
npx cdk deploy
```

## Cost

Resources created use AWS Free Tier where possible:
- DynamoDB: Pay-per-request (free tier: 25 RCU/WCU)
- Lambda: Free tier includes 1M requests/month
- S3: Free tier includes 5GB storage
- CloudFront: Free tier includes 1TB data transfer
- Cognito: Free tier includes 50,000 MAUs
- AppSync: $4 per million requests

**Estimated cost for development:** $0-5/month within free tier limits.
