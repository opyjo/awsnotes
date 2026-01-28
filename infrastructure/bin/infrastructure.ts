#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsStudyNotesStack } from '../lib/infrastructure-stack';

const app = new cdk.App();
new AwsStudyNotesStack(app, 'AwsStudyNotesStack', {
  // Use current CLI configuration for account and region
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
  },
  description: 'AWS Study Notes Application Infrastructure',
});
