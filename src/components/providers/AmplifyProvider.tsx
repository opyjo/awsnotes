"use client";

import { useEffect } from "react";
import { Amplify, type ResourcesConfig } from "aws-amplify";

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
const appSyncEndpoint = process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT;
const region = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1";
const s3Bucket = process.env.NEXT_PUBLIC_S3_BUCKET;

let isConfigured = false;

const configureAmplify = () => {
  if (isConfigured) return;
  
  if (userPoolId && userPoolClientId) {
    const amplifyConfig: ResourcesConfig = {
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

    Amplify.configure(amplifyConfig, {
      ssr: true,
    });
    isConfigured = true;
  } else {
    console.warn("AWS Amplify not configured. Missing environment variables:", {
      userPoolId: !!userPoolId,
      userPoolClientId: !!userPoolClientId,
    });
  }
};

// Configure immediately on module load (client-side)
if (typeof globalThis.window !== "undefined") {
  configureAmplify();
}

interface AmplifyProviderProps {
  children: React.ReactNode;
}

export const AmplifyProvider = ({ children }: AmplifyProviderProps) => {
  useEffect(() => {
    configureAmplify();
  }, []);

  // Always render children, but the effect ensures config runs
  return <>{children}</>;
};

export const amplifyConfig = {
  isConfigured: !!(userPoolId && userPoolClientId),
};
