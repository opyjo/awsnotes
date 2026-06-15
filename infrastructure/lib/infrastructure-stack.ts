import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { Construct } from "constructs";
import * as path from "path";

export class AwsStudyNotesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ==========================================
    // 1. Cognito User Pool
    // ==========================================
    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "aws-study-notes-pool",
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

    const userPoolClient = userPool.addClient("UserPoolClient", {
      userPoolClientName: "aws-study-notes-client",
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
        callbackUrls: ["http://localhost:3000", "https://yourdomain.com"],
        logoutUrls: ["http://localhost:3000", "https://yourdomain.com"],
      },
    });

    // ==========================================
    // 2. DynamoDB Tables
    // ==========================================
    const notesTable = new dynamodb.Table(this, "NotesTable", {
      tableName: "aws-study-notes-notes",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
    });

    const videosTable = new dynamodb.Table(this, "VideosTable", {
      tableName: "aws-study-notes-videos",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    videosTable.addGlobalSecondaryIndex({
      indexName: "category-videoId-index",
      partitionKey: { name: "category", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "videoId", type: dynamodb.AttributeType.STRING },
    });

    // ==========================================
    // 3. S3 Bucket for Images
    // ==========================================
    const imagesBucket = new s3.Bucket(this, "ImagesBucket", {
      bucketName: `aws-study-notes-images-${this.account}-${this.region}`,
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ["http://localhost:3000", "https://yourdomain.com"],
          exposedHeaders: ["ETag"],
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
      autoDeleteObjects: true, // Remove for production
    });

    // ==========================================
    // 4. CloudFront Distribution
    // ==========================================
    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(imagesBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
    });

    // ==========================================
    // 5. AppSync GraphQL API
    // ==========================================
    const api = new appsync.GraphqlApi(this, "Api", {
      name: "aws-study-notes-api",
      definition: appsync.Definition.fromFile(
        path.join(__dirname, "schema.graphql"),
      ),
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
    const notesDs = api.addDynamoDbDataSource("NotesDataSource", notesTable);
    const videosDs = api.addDynamoDbDataSource("VideosDataSource", videosTable);

    // ==========================================
    // Resolvers for Notes
    // ==========================================

    // getNotes (with pagination support)
    notesDs.createResolver("GetNotesResolver", {
      typeName: "Query",
      fieldName: "getNotes",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($limit = $util.defaultIfNull($ctx.arguments.limit, 1000))
        {
          "version": "2017-02-28",
          "operation": "Query",
          "query": {
            "expression": "PK = :userId AND begins_with(SK, :notePrefix)",
            "expressionValues": {
              ":userId": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
              ":notePrefix": { "S": "NOTE#" }
            }
          },
          "limit": $limit,
          #if($ctx.arguments.nextToken)
          "nextToken": "$ctx.arguments.nextToken",
          #end
          "consistentRead": true
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        `#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end
{
  "items": $util.toJson($ctx.result.items),
  "nextToken": $util.toJson($ctx.result.nextToken)
}`,
      ),
    });

    // getNote
    notesDs.createResolver("GetNoteResolver", {
      typeName: "Query",
      fieldName: "getNote",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($noteId = $ctx.arguments.noteId)
        {
          "version": "2017-02-28",
          "operation": "GetItem",
          "key": {
            "PK": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
            "SK": $util.dynamodb.toDynamoDBJson("NOTE#$noteId")
          },
          "consistentRead": true
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        `#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end
$util.toJson($ctx.result)`,
      ),
    });

    // createNote
    notesDs.createResolver("CreateNoteResolver", {
      typeName: "Mutation",
      fieldName: "createNote",
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
            #if($input.images)
            ,"images": $util.dynamodb.toDynamoDBJson($input.images)
            #end
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        `#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type, $ctx.result)
#end
$util.toJson($ctx.result)`,
      ),
    });

    // updateNote - simplified version that always updates title and content
    notesDs.createResolver("UpdateNoteResolver", {
      typeName: "Mutation",
      fieldName: "updateNote",
      requestMappingTemplate: appsync.MappingTemplate.fromString(
        `{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "PK": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
    "SK": $util.dynamodb.toDynamoDBJson("NOTE#$ctx.arguments.noteId")
  },
  "update": {
    "expression": "SET updatedAt = :now, title = :title, content = :content, category = :category",
    "expressionValues": {
      ":now": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
      ":title": $util.dynamodb.toDynamoDBJson($ctx.arguments.input.title),
      ":content": $util.dynamodb.toDynamoDBJson($ctx.arguments.input.content),
      ":category": $util.dynamodb.toDynamoDBJson($util.defaultIfNullOrEmpty($ctx.arguments.input.category, ""))
    }
  }
}`,
      ),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        `#set($result = $ctx.result)
#set($result.noteId = $ctx.arguments.noteId)
$util.toJson($result)`,
      ),
    });

    // deleteNote
    notesDs.createResolver("DeleteNoteResolver", {
      typeName: "Mutation",
      fieldName: "deleteNote",
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
      responseMappingTemplate: appsync.MappingTemplate.fromString("true"),
    });

    // ==========================================
    // Resolvers for Groups (stored in NotesTable with GROUP# prefix)
    // ==========================================

    // getGroups
    notesDs.createResolver("GetGroupsResolver", {
      typeName: "Query",
      fieldName: "getGroups",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "Query",
          "query": {
            "expression": "PK = :userId AND begins_with(SK, :groupPrefix)",
            "expressionValues": {
              ":userId": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
              ":groupPrefix": { "S": "GROUP#" }
            }
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        "$util.toJson($ctx.result.items)",
      ),
    });

    // getGroup
    notesDs.createResolver("GetGroupResolver", {
      typeName: "Query",
      fieldName: "getGroup",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($groupId = $ctx.arguments.groupId)
        {
          "version": "2017-02-28",
          "operation": "GetItem",
          "key": {
            "PK": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
            "SK": $util.dynamodb.toDynamoDBJson("GROUP#$groupId")
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        "$util.toJson($ctx.result)",
      ),
    });

    // createGroup
    notesDs.createResolver("CreateGroupResolver", {
      typeName: "Mutation",
      fieldName: "createGroup",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($groupId = $util.autoId())
        #set($now = $util.time.nowISO8601())
        #set($input = $ctx.arguments.input)
        {
          "version": "2017-02-28",
          "operation": "PutItem",
          "key": {
            "PK": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
            "SK": $util.dynamodb.toDynamoDBJson("GROUP#$groupId")
          },
          "attributeValues": {
            "groupId": $util.dynamodb.toDynamoDBJson($groupId),
            "name": $util.dynamodb.toDynamoDBJson($input.name),
            "createdAt": $util.dynamodb.toDynamoDBJson($now),
            "updatedAt": $util.dynamodb.toDynamoDBJson($now)
            #if($input.color)
            ,"color": $util.dynamodb.toDynamoDBJson($input.color)
            #end
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        "$util.toJson($ctx.result)",
      ),
    });

    // updateGroup
    notesDs.createResolver("UpdateGroupResolver", {
      typeName: "Mutation",
      fieldName: "updateGroup",
      requestMappingTemplate: appsync.MappingTemplate.fromString(
        `{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "PK": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
    "SK": $util.dynamodb.toDynamoDBJson("GROUP#$ctx.arguments.groupId")
  },
  "update": {
    "expression": "SET updatedAt = :now, #name = :name, color = :color",
    "expressionNames": {
      "#name": "name"
    },
    "expressionValues": {
      ":now": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
      ":name": $util.dynamodb.toDynamoDBJson($ctx.arguments.input.name),
      ":color": $util.dynamodb.toDynamoDBJson($util.defaultIfNullOrEmpty($ctx.arguments.input.color, ""))
    }
  }
}`,
      ),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        `#set($result = $ctx.result)
#set($result.groupId = $ctx.arguments.groupId)
$util.toJson($result)`,
      ),
    });

    // ==========================================
    // Resolvers for User Settings (stored in NotesTable with SETTINGS# prefix)
    // ==========================================

    // getUserSettings
    notesDs.createResolver("GetUserSettingsResolver", {
      typeName: "Query",
      fieldName: "getUserSettings",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "GetItem",
          "key": {
            "PK": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
            "SK": { "S": "SETTINGS#exam" }
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        `#if($ctx.result)
$util.toJson($ctx.result)
#else
null
#end`,
      ),
    });

    // saveUserSettings
    notesDs.createResolver("SaveUserSettingsResolver", {
      typeName: "Mutation",
      fieldName: "saveUserSettings",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($now = $util.time.nowISO8601())
        #set($input = $ctx.arguments.input)
        {
          "version": "2017-02-28",
          "operation": "PutItem",
          "key": {
            "PK": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
            "SK": { "S": "SETTINGS#exam" }
          },
          "attributeValues": {
            "updatedAt": $util.dynamodb.toDynamoDBJson($now)
            #if($input.examDate)
            ,"examDate": $util.dynamodb.toDynamoDBJson($input.examDate)
            #end
            #if($input.todos)
            ,"todos": $util.dynamodb.toDynamoDBJson($input.todos)
            #end
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        "$util.toJson($ctx.result)",
      ),
    });

    // deleteGroup
    notesDs.createResolver("DeleteGroupResolver", {
      typeName: "Mutation",
      fieldName: "deleteGroup",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($groupId = $ctx.arguments.groupId)
        {
          "version": "2017-02-28",
          "operation": "DeleteItem",
          "key": {
            "PK": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
            "SK": $util.dynamodb.toDynamoDBJson("GROUP#$groupId")
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString("true"),
    });

    // ==========================================
    // Resolvers for Lesson Videos (global catalog)
    // ==========================================

    videosDs.createResolver("GetVideosResolver", {
      typeName: "Query",
      fieldName: "getVideos",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "Query",
          "query": {
            "expression": "PK = :pk AND begins_with(SK, :prefix)",
            "expressionValues": {
              ":pk": { "S": "GLOBAL" },
              ":prefix": { "S": "VIDEO#" }
            }
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        `#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end
$util.toJson($ctx.result.items)`,
      ),
    });

    videosDs.createResolver("GetVideoResolver", {
      typeName: "Query",
      fieldName: "getVideo",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($videoId = $ctx.arguments.videoId)
        {
          "version": "2017-02-28",
          "operation": "GetItem",
          "key": {
            "PK": { "S": "GLOBAL" },
            "SK": { "S": "VIDEO#$videoId" }
          },
          "consistentRead": true
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        `#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end
$util.toJson($ctx.result)`,
      ),
    });

    videosDs.createResolver("GetVideosByCategoryResolver", {
      typeName: "Query",
      fieldName: "getVideosByCategory",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($category = $ctx.arguments.category)
        {
          "version": "2017-02-28",
          "operation": "Query",
          "index": "category-videoId-index",
          "query": {
            "expression": "category = :cat",
            "expressionValues": {
              ":cat": $util.dynamodb.toDynamoDBJson($category)
            }
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        `#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end
$util.toJson($ctx.result.items)`,
      ),
    });

    videosDs.createResolver("CreateVideoResolver", {
      typeName: "Mutation",
      fieldName: "createVideo",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($videoId = $util.autoId())
        #set($now = $util.time.nowISO8601())
        #set($input = $ctx.arguments.input)
        {
          "version": "2017-02-28",
          "operation": "PutItem",
          "key": {
            "PK": { "S": "GLOBAL" },
            "SK": $util.dynamodb.toDynamoDBJson("VIDEO#$videoId")
          },
          "attributeValues": {
            "videoId": $util.dynamodb.toDynamoDBJson($videoId),
            "title": $util.dynamodb.toDynamoDBJson($input.title),
            "category": $util.dynamodb.toDynamoDBJson($input.category),
            "s3Key": $util.dynamodb.toDynamoDBJson($input.s3Key),
            "createdAt": $util.dynamodb.toDynamoDBJson($now),
            "updatedAt": $util.dynamodb.toDynamoDBJson($now)
            #if($input.description)
            ,"description": $util.dynamodb.toDynamoDBJson($input.description)
            #end
            #if($input.thumbnailKey)
            ,"thumbnailKey": $util.dynamodb.toDynamoDBJson($input.thumbnailKey)
            #end
            #if(!$util.isNull($input.duration))
            ,"duration": $util.dynamodb.toDynamoDBJson($input.duration)
            #end
            #if(!$util.isNull($input.order))
            ,"order": $util.dynamodb.toDynamoDBJson($input.order)
            #end
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        `#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type, $ctx.result)
#end
$util.toJson($ctx.result)`,
      ),
    });

    videosDs.createResolver("UpdateVideoResolver", {
      typeName: "Mutation",
      fieldName: "updateVideo",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($videoId = $ctx.arguments.videoId)
        #set($input = $ctx.arguments.input)
        #set($expParts = [])
        #set($expValues = {":updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())})
        $util.qr($expParts.add("updatedAt = :updatedAt"))
        #if($input.title)
          $util.qr($expParts.add("title = :title"))
          $util.qr($expValues.put(":title", $util.dynamodb.toDynamoDBJson($input.title)))
        #end
        #if($input.description)
          $util.qr($expParts.add("description = :description"))
          $util.qr($expValues.put(":description", $util.dynamodb.toDynamoDBJson($input.description)))
        #end
        #if($input.category)
          $util.qr($expParts.add("category = :category"))
          $util.qr($expValues.put(":category", $util.dynamodb.toDynamoDBJson($input.category)))
        #end
        #if($input.s3Key)
          $util.qr($expParts.add("s3Key = :s3Key"))
          $util.qr($expValues.put(":s3Key", $util.dynamodb.toDynamoDBJson($input.s3Key)))
        #end
        #if($input.thumbnailKey)
          $util.qr($expParts.add("thumbnailKey = :thumbnailKey"))
          $util.qr($expValues.put(":thumbnailKey", $util.dynamodb.toDynamoDBJson($input.thumbnailKey)))
        #end
        #if(!$util.isNull($input.duration))
          $util.qr($expParts.add("duration = :duration"))
          $util.qr($expValues.put(":duration", $util.dynamodb.toDynamoDBJson($input.duration)))
        #end
        #if(!$util.isNull($input.order))
          $util.qr($expParts.add("#ord = :order"))
          $util.qr($expValues.put(":order", $util.dynamodb.toDynamoDBJson($input.order)))
        #end
        {
          "version": "2018-05-29",
          "operation": "UpdateItem",
          "key": {
            "PK": { "S": "GLOBAL" },
            "SK": $util.dynamodb.toDynamoDBJson("VIDEO#$videoId")
          },
          "update": {
            "expression": "SET $util.join(', ', $expParts)"
            #if(!$util.isNull($input.order))
            ,
            "expressionNames": {
              "#ord": "order"
            }
            #end
            ,
            "expressionValues": $util.toJson($expValues)
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        #if($ctx.error)
          $util.error($ctx.error.message, $ctx.error.type)
        #end
        #set($result = $ctx.result)
        #set($result.videoId = $ctx.arguments.videoId)
        $util.toJson($result)
      `),
    });

    videosDs.createResolver("DeleteVideoResolver", {
      typeName: "Mutation",
      fieldName: "deleteVideo",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($videoId = $ctx.arguments.videoId)
        {
          "version": "2017-02-28",
          "operation": "DeleteItem",
          "key": {
            "PK": { "S": "GLOBAL" },
            "SK": { "S": "VIDEO#$videoId" }
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString("true"),
    });

    // ==========================================
    // Resolvers for Video Progress (per-user, stored in NotesTable with VIDEOPROGRESS# prefix)
    // ==========================================

    notesDs.createResolver("GetVideoProgressResolver", {
      typeName: "Query",
      fieldName: "getVideoProgress",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($videoId = $ctx.arguments.videoId)
        {
          "version": "2017-02-28",
          "operation": "GetItem",
          "key": {
            "PK": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
            "SK": $util.dynamodb.toDynamoDBJson("VIDEOPROGRESS#$videoId")
          },
          "consistentRead": true
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        `#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end
$util.toJson($ctx.result)`,
      ),
    });

    notesDs.createResolver("GetVideoProgressListResolver", {
      typeName: "Query",
      fieldName: "getVideoProgressList",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "Query",
          "query": {
            "expression": "PK = :userId AND begins_with(SK, :prefix)",
            "expressionValues": {
              ":userId": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
              ":prefix": { "S": "VIDEOPROGRESS#" }
            }
          },
          "consistentRead": true
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        `#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end
$util.toJson($ctx.result.items)`,
      ),
    });

    notesDs.createResolver("SaveVideoProgressResolver", {
      typeName: "Mutation",
      fieldName: "saveVideoProgress",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($input = $ctx.arguments.input)
        #set($videoId = $input.videoId)
        #set($now = $util.time.nowISO8601())
        #set($completed = $util.defaultIfNull($input.completed, false))
        {
          "version": "2017-02-28",
          "operation": "PutItem",
          "key": {
            "PK": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
            "SK": $util.dynamodb.toDynamoDBJson("VIDEOPROGRESS#$videoId")
          },
          "attributeValues": {
            "videoId": $util.dynamodb.toDynamoDBJson($videoId),
            "progressSeconds": $util.dynamodb.toDynamoDBJson($input.progressSeconds),
            "completed": $util.dynamodb.toDynamoDBJson($completed),
            "lastWatchedAt": $util.dynamodb.toDynamoDBJson($now),
            "updatedAt": $util.dynamodb.toDynamoDBJson($now)
            #if(!$util.isNull($input.duration))
            ,"duration": $util.dynamodb.toDynamoDBJson($input.duration)
            #end
            #if(!$util.isNull($input.notes))
            ,"notes": $util.dynamodb.toDynamoDBJson($input.notes)
            #end
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        `#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type, $ctx.result)
#end
$util.toJson($ctx.result)`,
      ),
    });

    // ==========================================
    // Resolvers for Key Concepts (stored in NotesTable with KEYCONCEPT# prefix)
    // ==========================================

    // getKeyConcepts
    notesDs.createResolver("GetKeyConceptsResolver", {
      typeName: "Query",
      fieldName: "getKeyConcepts",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "Query",
          "query": {
            "expression": "PK = :userId AND begins_with(SK, :prefix)",
            "expressionValues": {
              ":userId": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
              ":prefix": { "S": "KEYCONCEPT#" }
            }
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        `#set($items = $ctx.result.items)
#foreach($item in $items)
  #if(!$item.rule && $item.theRule)
    $util.qr($item.put("rule", $item.theRule))
  #end
#end
$util.toJson($items)`,
      ),
    });

    // getKeyConcept
    notesDs.createResolver("GetKeyConceptResolver", {
      typeName: "Query",
      fieldName: "getKeyConcept",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($conceptId = $ctx.arguments.conceptId)
        {
          "version": "2017-02-28",
          "operation": "GetItem",
          "key": {
            "PK": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
            "SK": $util.dynamodb.toDynamoDBJson("KEYCONCEPT#$conceptId")
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        `#if($ctx.result)
#if(!$ctx.result.rule && $ctx.result.theRule)
  $util.qr($ctx.result.put("rule", $ctx.result.theRule))
#end
#end
$util.toJson($ctx.result)`,
      ),
    });

    // createKeyConcept
    notesDs.createResolver("CreateKeyConceptResolver", {
      typeName: "Mutation",
      fieldName: "createKeyConcept",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($conceptId = $util.autoId())
        #set($now = $util.time.nowISO8601())
        #set($input = $ctx.arguments.input)
        {
          "version": "2017-02-28",
          "operation": "PutItem",
          "key": {
            "PK": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
            "SK": $util.dynamodb.toDynamoDBJson("KEYCONCEPT#$conceptId")
          },
          "attributeValues": {
            "conceptId": $util.dynamodb.toDynamoDBJson($conceptId),
            "topic": $util.dynamodb.toDynamoDBJson($input.topic),
            "rule": $util.dynamodb.toDynamoDBJson($input.rule),
            "createdAt": $util.dynamodb.toDynamoDBJson($now),
            "updatedAt": $util.dynamodb.toDynamoDBJson($now)
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        "$util.toJson($ctx.result)",
      ),
    });

    // updateKeyConcept
    notesDs.createResolver("UpdateKeyConceptResolver", {
      typeName: "Mutation",
      fieldName: "updateKeyConcept",
      requestMappingTemplate: appsync.MappingTemplate.fromString(
        `{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "PK": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
    "SK": $util.dynamodb.toDynamoDBJson("KEYCONCEPT#$ctx.arguments.conceptId")
  },
  "update": {
    "expression": "SET updatedAt = :now, notes = :notes",
    "expressionValues": {
      ":now": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601()),
      ":notes": $util.dynamodb.toDynamoDBJson($ctx.arguments.input.notes)
    }
  }
}`,
      ),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        `#set($result = $ctx.result)
#set($result.conceptId = $ctx.arguments.conceptId)
$util.toJson($result)`,
      ),
    });

    // deleteKeyConcept
    notesDs.createResolver("DeleteKeyConceptResolver", {
      typeName: "Mutation",
      fieldName: "deleteKeyConcept",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($conceptId = $ctx.arguments.conceptId)
        {
          "version": "2017-02-28",
          "operation": "DeleteItem",
          "key": {
            "PK": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
            "SK": $util.dynamodb.toDynamoDBJson("KEYCONCEPT#$conceptId")
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString("true"),
    });

    // ==========================================
    // Outputs
    // ==========================================
    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
      description: "Cognito User Pool ID",
      exportName: "UserPoolId",
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
      description: "Cognito User Pool Client ID",
      exportName: "UserPoolClientId",
    });

    new cdk.CfnOutput(this, "GraphQLApiUrl", {
      value: api.graphqlUrl,
      description: "AppSync GraphQL API URL",
      exportName: "GraphQLApiUrl",
    });

    new cdk.CfnOutput(this, "S3BucketName", {
      value: imagesBucket.bucketName,
      description: "S3 Bucket for Images",
      exportName: "S3BucketName",
    });

    new cdk.CfnOutput(this, "CloudFrontUrl", {
      value: `https://${distribution.distributionDomainName}`,
      description: "CloudFront Distribution URL",
      exportName: "CloudFrontUrl",
    });

    new cdk.CfnOutput(this, "Region", {
      value: this.region,
      description: "AWS Region",
      exportName: "AwsRegion",
    });
  }
}
