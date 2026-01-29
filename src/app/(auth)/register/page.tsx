"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
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
import { SuccessIcon } from "@/components/ui/empty-state";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signUp(email, password, username || undefined);
      setSuccess(true);
      addToast({
        type: "success",
        title: "Account created!",
        message: "Please check your email to verify your account.",
      });
      setTimeout(() => {
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to sign up";
      setError(errorMessage);

      // Check if user already exists - offer helpful options
      if (err.code === "UsernameExistsException") {
        addToast({
          type: "warning",
          title: "Account exists",
          message:
            "Try signing in or verifying your email if you haven't already.",
          duration: 8000,
        });
      } else {
        addToast({
          type: "error",
          title: "Registration failed",
          message: errorMessage,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <SuccessIcon />
            <div>
              <h2 className="text-xl font-semibold">Check your email</h2>
              <p className="text-muted-foreground mt-2">
                We've sent a verification code to <strong>{email}</strong>.
                Please check your inbox and verify your account.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Redirecting to verification...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Sign up for AWS Study Notes</CardDescription>
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
            <Label htmlFor="username">Username (optional)</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="johndoe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={8}
            />
          </div>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              {error.includes("already exists") && (
                <div className="flex gap-2 text-sm">
                  <Link href="/login" className="text-primary underline">
                    Sign in
                  </Link>
                  <span className="text-muted-foreground">or</span>
                  <Link
                    href={`/verify?email=${encodeURIComponent(email)}`}
                    className="text-primary underline"
                  >
                    Verify email
                  </Link>
                </div>
              )}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary underline">
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
