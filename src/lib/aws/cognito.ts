import { signIn, signUp, signOut, getCurrentUser, fetchAuthSession } from "aws-amplify/auth";
import type { User } from "@/types/user";
import amplifyConfig from "./amplify-config";

// Map Cognito error codes to user-friendly messages
const getAuthErrorMessage = (error: any): string => {
  const errorName = error?.name || "";
  const errorMessage = error?.message || "";

  switch (errorName) {
    // Sign Up errors
    case "UsernameExistsException":
      return "An account with this email already exists. Please sign in or use a different email.";
    case "InvalidPasswordException":
      return "Password does not meet requirements. It must be at least 8 characters with uppercase, lowercase, numbers, and special characters.";
    case "InvalidParameterException":
      if (errorMessage.includes("password")) {
        return "Password does not meet requirements. It must be at least 8 characters.";
      }
      return "Invalid information provided. Please check your input.";
    
    // Sign In errors
    case "UserNotFoundException":
      return "No account found with this email. Please check your email or sign up.";
    case "NotAuthorizedException":
      if (errorMessage.includes("Incorrect username or password")) {
        return "Incorrect email or password. Please try again.";
      }
      if (errorMessage.includes("User is disabled")) {
        return "This account has been disabled. Please contact support.";
      }
      return "You are not authorized to perform this action.";
    case "UserNotConfirmedException":
      return "Please verify your email before signing in. Check your inbox for the verification code.";
    
    // Verification errors
    case "CodeMismatchException":
      return "Invalid verification code. Please check and try again.";
    case "ExpiredCodeException":
      return "Verification code has expired. Please request a new one.";
    case "LimitExceededException":
      return "Too many attempts. Please wait a few minutes before trying again.";
    
    // General errors
    case "NetworkError":
      return "Network error. Please check your internet connection.";
    case "UserUnAuthenticatedException":
      return "Please sign in to continue.";
    
    default:
      // Return original message if no mapping found
      return errorMessage || "An unexpected error occurred. Please try again.";
  }
};

const checkConfigured = () => {
  if (!amplifyConfig.isConfigured) {
    throw new Error("Auth UserPool not configured. Please set up your AWS environment variables in .env.local");
  }
};

export class AuthError extends Error {
  code: string;
  
  constructor(error: any) {
    const message = getAuthErrorMessage(error);
    super(message);
    this.name = "AuthError";
    this.code = error?.name || "UnknownError";
  }
}

export const handleSignUp = async (
  email: string,
  password: string,
  username?: string
) => {
  checkConfigured();
  try {
    const { userId } = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          ...(username && { preferred_username: username }),
        },
      },
    });
    return { success: true, userId };
  } catch (error: any) {
    console.error("Error signing up:", error);
    throw new AuthError(error);
  }
};

export const handleSignIn = async (email: string, password: string) => {
  checkConfigured();
  try {
    const { isSignedIn } = await signIn({
      username: email,
      password,
    });
    return { success: isSignedIn };
  } catch (error: any) {
    console.error("Error signing in:", error);
    throw new AuthError(error);
  }
};

export const handleSignOut = async () => {
  try {
    await signOut();
    return { success: true };
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const getCurrentAuthUser = async (): Promise<User | null> => {
  try {
    const user = await getCurrentUser();
    // Ensure user has an active session
    await fetchAuthSession();
    
    return {
      userId: user.userId,
      email: user.signInDetails?.loginId || "",
      username: user.username,
    };
  } catch (error: any) {
    // UserUnAuthenticatedException is expected when no user is signed in
    // Don't log it as an error
    if (error?.name === "UserUnAuthenticatedException") {
      return null;
    }
    console.error("Error getting current user:", error);
    return null;
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};
