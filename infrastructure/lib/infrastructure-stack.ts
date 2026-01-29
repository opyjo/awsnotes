import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import * as path from 'path';

export class AwsStudyNotesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ==========================================
    // 1. Cognito User Pool
    // ==========================================
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'aws-study-notes-pool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
    });

    const userPoolClient = userPool.addClient('UserPoolClient', {
      userPoolClientName: 'aws-study-notes-client',
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: ['http://localhost:3000', 'https://yourdomain.com'],
        logoutUrls: ['http://localhost:3000', 'https://yourdomain.com'],
      },
    });

    // ==========================================
    // 2. DynamoDB Tables
    // ==========================================
    const notesTable = new dynamodb.Table(this, 'NotesTable', {
      tableName: 'aws-study-notes-notes',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
    });

    const flashcardsTable = new dynamodb.Table(this, 'FlashcardsTable', {
      tableName: 'aws-study-notes-flashcards',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
    });

    // Add GSI for due flashcards
    flashcardsTable.addGlobalSecondaryIndex({
      indexName: 'nextReviewDate-index',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'nextReviewDate', type: dynamodb.AttributeType.STRING },
    });

    // ==========================================
    // 3. S3 Bucket for Images
    // ==========================================
    const imagesBucket = new s3.Bucket(this, 'ImagesBucket', {
      bucketName: `aws-study-notes-images-${this.account}-${this.region}`,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['http://localhost:3000', 'https://yourdomain.com'],
          exposedHeaders: ['ETag'],
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
      autoDeleteObjects: true, // Remove for production
    });

    // ==========================================
    // 4. CloudFront Distribution
    // ==========================================
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(imagesBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
    });

    // ==========================================
    // 5. Lambda Function for SM-2 Review
    // ==========================================
    const reviewFlashcardLambda = new lambda.Function(this, 'ReviewFlashcardLambda', {
      functionName: 'review-flashcard',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/review-flashcard')),
      timeout: cdk.Duration.seconds(10),
      environment: {
        TABLE_NAME: flashcardsTable.tableName,
      },
    });

    flashcardsTable.grantReadWriteData(reviewFlashcardLambda);

    // ==========================================
    // 6. AppSync GraphQL API
    // ==========================================
    const api = new appsync.GraphqlApi(this, 'Api', {
      name: 'aws-study-notes-api',
      definition: appsync.Definition.fromFile(path.join(__dirname, 'schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool,
          },
        },
      },
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ERROR,
      },
      xrayEnabled: true,
    });

    // Data Sources
    const notesDs = api.addDynamoDbDataSource('NotesDataSource', notesTable);
    const flashcardsDs = api.addDynamoDbDataSource('FlashcardsDataSource', flashcardsTable);
    const lambdaDs = api.addLambdaDataSource('ReviewLambdaDataSource', reviewFlashcardLambda);

    // ==========================================
    // Resolvers for Notes
    // ==========================================
    
    // getNotes
    notesDs.createResolver('GetNotesResolver', {
      typeName: 'Query',
      fieldName: 'getNotes',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "Query",
          "query": {
            "expression": "PK = :userId AND begins_with(SK, :notePrefix)",
            "expressionValues": {
              ":userId": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
              ":notePrefix": { "S": "NOTE#" }
            }
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString('$util.toJson($ctx.result.items)'),
    });

    // getNote
    notesDs.createResolver('GetNoteResolver', {
      typeName: 'Query',
      fieldName: 'getNote',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($noteId = $ctx.arguments.noteId)
        {
          "version": "2017-02-28",
          "operation": "GetItem",
          "key": {
            "PK": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
            "SK": $util.dynamodb.toDynamoDBJson("NOTE#$noteId")
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString('$util.toJson($ctx.result)'),
    });

    // createNote
    notesDs.createResolver('CreateNoteResolver', {
      typeName: 'Mutation',
      fieldName: 'createNote',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
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
            #if($input.tags)
            ,"tags": $util.dynamodb.toDynamoDBJson($input.tags)
            #end
            #if($input.images)
            ,"images": $util.dynamodb.toDynamoDBJson($input.images)
            #end
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString('$util.toJson($ctx.result)'),
    });

    // updateNote - simplified version that always updates title and content
    notesDs.createResolver('UpdateNoteResolver', {
      typeName: 'Mutation',
      fieldName: 'updateNote',
      requestMappingTemplate: appsync.MappingTemplate.fromString(
`{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "PK": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
    "SK": $util.dynamodb.toDynamoDBJson("NOTE#$ctx.arguments.noteId")
  },
  "update": {
    "expression": "SET updatedAt = :now, title = :title, content = :content, category = :category, tags = :tags",
    "expressionValues": {
      ":now": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
      ":title": $util.dynamodb.toDynamoDBJson($ctx.arguments.input.title),
      ":content": $util.dynamodb.toDynamoDBJson($ctx.arguments.input.content),
      ":category": $util.dynamodb.toDynamoDBJson($util.defaultIfNullOrEmpty($ctx.arguments.input.category, "")),
      ":tags": $util.dynamodb.toDynamoDBJson($util.defaultIfNull($ctx.arguments.input.tags, []))
    }
  }
}`
      ),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
`#set($result = $ctx.result)
#set($result.noteId = $ctx.arguments.noteId)
$util.toJson($result)`
      ),
    });

    // deleteNote
    notesDs.createResolver('DeleteNoteResolver', {
      typeName: 'Mutation',
      fieldName: 'deleteNote',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($noteId = $ctx.arguments.noteId)
        {
          "version": "2017-02-28",
          "operation": "DeleteItem",
          "key": {
            "PK": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
            "SK": $util.dynamodb.toDynamoDBJson("NOTE#$noteId")
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString('true'),
    });

    // ==========================================
    // Resolvers for Flashcards
    // ==========================================

    // getFlashcards
    flashcardsDs.createResolver('GetFlashcardsResolver', {
      typeName: 'Query',
      fieldName: 'getFlashcards',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($deckId = $ctx.arguments.deckId)
        {
          "version": "2017-02-28",
          "operation": "Query",
          "query": {
            "expression": "PK = :userId AND begins_with(SK, :cardPrefix)",
            "expressionValues": {
              ":userId": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
              ":cardPrefix": { "S": "CARD#" }
            }
          },
          "filter": {
            "expression": "deckId = :deckId",
            "expressionValues": {
              ":deckId": $util.dynamodb.toDynamoDBJson($deckId)
            }
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString('$util.toJson($ctx.result.items)'),
    });

    // getDueFlashcards
    flashcardsDs.createResolver('GetDueFlashcardsResolver', {
      typeName: 'Query',
      fieldName: 'getDueFlashcards',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($now = $util.time.nowISO8601())
        {
          "version": "2017-02-28",
          "operation": "Query",
          "index": "nextReviewDate-index",
          "query": {
            "expression": "PK = :userId AND nextReviewDate <= :now",
            "expressionValues": {
              ":userId": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
              ":now": $util.dynamodb.toDynamoDBJson($now)
            }
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString('$util.toJson($ctx.result.items)'),
    });

    // createFlashcard
    flashcardsDs.createResolver('CreateFlashcardResolver', {
      typeName: 'Mutation',
      fieldName: 'createFlashcard',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($cardId = $util.autoId())
        #set($now = $util.time.nowISO8601())
        #set($input = $ctx.arguments.input)
        {
          "version": "2017-02-28",
          "operation": "PutItem",
          "key": {
            "PK": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
            "SK": $util.dynamodb.toDynamoDBJson("CARD#$cardId")
          },
          "attributeValues": {
            "cardId": $util.dynamodb.toDynamoDBJson($cardId),
            "deckId": $util.dynamodb.toDynamoDBJson($input.deckId),
            "front": $util.dynamodb.toDynamoDBJson($input.front),
            "back": $util.dynamodb.toDynamoDBJson($input.back),
            "easeFactor": { "N": "2.5" },
            "interval": { "N": "0" },
            "repetitions": { "N": "0" },
            "nextReviewDate": $util.dynamodb.toDynamoDBJson($now),
            "createdAt": $util.dynamodb.toDynamoDBJson($now)
            #if($input.noteId)
            ,"noteId": $util.dynamodb.toDynamoDBJson($input.noteId)
            #end
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString('$util.toJson($ctx.result)'),
    });

    // reviewFlashcard (Lambda)
    lambdaDs.createResolver('ReviewFlashcardResolver', {
      typeName: 'Mutation',
      fieldName: 'reviewFlashcard',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "Invoke",
          "payload": {
            "cardId": "$ctx.arguments.cardId",
            "quality": $ctx.arguments.quality,
            "userId": "$ctx.identity.sub"
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        #if($ctx.error)
          $util.error($ctx.error.message, $ctx.error.type)
        #end
        $util.toJson($ctx.result)
      `),
    });

    // ==========================================
    // Outputs
    // ==========================================
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'UserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: 'UserPoolClientId',
    });

    new cdk.CfnOutput(this, 'GraphQLApiUrl', {
      value: api.graphqlUrl,
      description: 'AppSync GraphQL API URL',
      exportName: 'GraphQLApiUrl',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: imagesBucket.bucketName,
      description: 'S3 Bucket for Images',
      exportName: 'S3BucketName',
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
      exportName: 'CloudFrontUrl',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
      exportName: 'AwsRegion',
    });
  }
}
