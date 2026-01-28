import { signIn, signUp, signOut, getCurrentUser, fetchAuthSession } from "aws-amplify/auth";
import type { User } from "@/types/user";

export const handleSignUp = async (
  email: string,
  password: string,
  username?: string
) => {
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
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
};

export const handleSignIn = async (email: string, password: string) => {
  try {
    const { isSignedIn } = await signIn({
      username: email,
      password,
    });
    return { success: isSignedIn };
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
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
    const session = await fetchAuthSession();
    
    return {
      userId: user.userId,
      email: user.signInDetails?.loginId || "",
      username: user.username,
    };
  } catch (error) {
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
