#!/bin/bash

# AWS Study Notes - Infrastructure Deployment Script
# This script deploys all AWS resources using CDK

set -e

echo "=========================================="
echo "AWS Study Notes - Infrastructure Deployment"
echo "=========================================="

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "Error: AWS CLI is not configured. Run 'aws configure' first."
    exit 1
fi

# Get AWS account info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=${AWS_DEFAULT_REGION:-us-east-1}

echo ""
echo "Deploying to:"
echo "  Account: $ACCOUNT_ID"
echo "  Region:  $REGION"
echo ""

# Navigate to infrastructure directory
cd "$(dirname "$0")/../infrastructure"

# Install dependencies
echo "Installing CDK dependencies..."
npm install

# Bootstrap CDK (if not already done)
echo ""
echo "Bootstrapping CDK (if needed)..."
npx cdk bootstrap aws://$ACCOUNT_ID/$REGION --quiet || true

# Deploy
echo ""
echo "Deploying infrastructure..."
npx cdk deploy --require-approval never --outputs-file cdk-outputs.json

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "Deployment Successful!"
    echo "=========================================="
    echo ""
    echo "Outputs saved to: infrastructure/cdk-outputs.json"
    echo ""
    
    # Parse outputs and display
    if [ -f cdk-outputs.json ]; then
        echo "Add these to your .env.local file:"
        echo ""
        echo "NEXT_PUBLIC_AWS_REGION=$(jq -r '.AwsStudyNotesStack.Region // empty' cdk-outputs.json)"
        echo "NEXT_PUBLIC_COGNITO_USER_POOL_ID=$(jq -r '.AwsStudyNotesStack.UserPoolId // empty' cdk-outputs.json)"
        echo "NEXT_PUBLIC_COGNITO_CLIENT_ID=$(jq -r '.AwsStudyNotesStack.UserPoolClientId // empty' cdk-outputs.json)"
        echo "NEXT_PUBLIC_APPSYNC_ENDPOINT=$(jq -r '.AwsStudyNotesStack.GraphQLApiUrl // empty' cdk-outputs.json)"
        echo "NEXT_PUBLIC_S3_BUCKET=$(jq -r '.AwsStudyNotesStack.S3BucketName // empty' cdk-outputs.json)"
        echo "NEXT_PUBLIC_CLOUDFRONT_URL=$(jq -r '.AwsStudyNotesStack.CloudFrontUrl // empty' cdk-outputs.json)"
    fi
else
    echo ""
    echo "Deployment failed!"
    exit 1
fi
