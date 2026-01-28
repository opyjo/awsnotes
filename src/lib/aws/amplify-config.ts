import { Amplify } from "aws-amplify";

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
      signUpVerificationMethod: "code" as const,
    },
  },
  API: {
    GraphQL: {
      endpoint: process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT!,
      region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
      defaultAuthMode: "iam" as const,
    },
  },
  Storage: {
    S3: {
      bucket: process.env.NEXT_PUBLIC_S3_BUCKET!,
      region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
    },
  },
};

Amplify.configure(amplifyConfig);

export default amplifyConfig;
