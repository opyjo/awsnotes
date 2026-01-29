import { Amplify } from "aws-amplify";

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
const appSyncEndpoint = process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT;
const region = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1";
const s3Bucket = process.env.NEXT_PUBLIC_S3_BUCKET;

// Only configure if we have the required values
if (userPoolId && userPoolClientId) {
  const amplifyConfig = {
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        signUpVerificationMethod: "code" as const,
      },
    },
    API: {
      GraphQL: {
        endpoint: appSyncEndpoint || "",
        region,
        defaultAuthMode: "userPool" as const,
      },
    },
    Storage: {
      S3: {
        bucket: s3Bucket || "",
        region,
      },
    },
  };

  Amplify.configure(amplifyConfig);
} else {
  console.warn("AWS Amplify not configured. Missing environment variables:", {
    userPoolId: !!userPoolId,
    userPoolClientId: !!userPoolClientId,
  });
}

export default {
  isConfigured: !!(userPoolId && userPoolClientId),
};
