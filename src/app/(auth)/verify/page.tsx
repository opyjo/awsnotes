"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

// Separate component that uses useSearchParams
const VerifyForm = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { addToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code,
      });
      addToast({
        type: "success",
        title: "Email verified!",
        message: "Your account is now active. Please sign in.",
      });
      router.push("/login");
    } catch (err: any) {
      let errorMessage = err.message || "Failed to verify code";

      // Map common Cognito errors
      if (err.name === "CodeMismatchException") {
        errorMessage = "Invalid verification code. Please check and try again.";
      } else if (err.name === "ExpiredCodeException") {
        errorMessage =
          "Verification code has expired. Please request a new one.";
      } else if (err.name === "LimitExceededException") {
        errorMessage =
          "Too many attempts. Please wait a few minutes before trying again.";
      } else if (err.name === "UserNotFoundException") {
        errorMessage =
          "No account found with this email. Please sign up first.";
      }

      setError(errorMessage);
      addToast({
        type: "error",
        title: "Verification failed",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setResending(true);
    try {
      await resendSignUpCode({ username: email });
      addToast({
        type: "success",
        message: "A new verification code has been sent to your email.",
      });
    } catch (err: any) {
      let errorMessage = err.message || "Failed to resend code";

      if (err.name === "LimitExceededException") {
        errorMessage =
          "Too many attempts. Please wait a few minutes before trying again.";
      } else if (err.name === "UserNotFoundException") {
        errorMessage =
          "No account found with this email. Please sign up first.";
      }

      setError(errorMessage);
      addToast({
        type: "error",
        title: "Failed to resend",
        message: errorMessage,
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          Enter the verification code sent to your email address
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="123456"
              maxLength={6}
              className="text-center text-2xl tracking-widest"
            />
          </div>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying..." : "Verify Email"}
          </Button>
          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resending}
              className="text-sm text-primary underline hover:no-underline disabled:opacity-50"
            >
              {resending ? "Sending..." : "Didn't receive a code? Resend"}
            </button>
            <div className="text-sm text-muted-foreground">
              <Link href="/login" className="text-primary underline">
                Back to Sign In
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Loading fallback for Suspense
const VerifyFormSkeleton = () => (
  <Card className="w-full max-w-md">
    <CardHeader>
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-64 mt-2" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </CardContent>
  </Card>
);

// Main page component with Suspense boundary
export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyFormSkeleton />}>
      <VerifyForm />
    </Suspense>
  );
}
