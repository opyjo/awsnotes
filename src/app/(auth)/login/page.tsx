"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  // Redirect if already signed in
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      addToast({
        type: "success",
        message: "Welcome back!",
      });
      router.push("/dashboard");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to sign in";
      
      // Check if already signed in
      if (errorMessage.includes("already a signed in user") || errorMessage.includes("already signed in")) {
        addToast({
          type: "info",
          message: "You're already signed in! Redirecting...",
        });
        router.push("/dashboard");
        return;
      }
      
      setError(errorMessage);
      
      // Check if user needs to verify email
      if (err.code === "UserNotConfirmedException" || errorMessage.includes("verify")) {
        addToast({
          type: "warning",
          title: "Email not verified",
          message: "Please verify your email to continue.",
          duration: 8000,
        });
      } else {
        addToast({
          type: "error",
          title: "Sign in failed",
          message: errorMessage,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Sign in to your AWS Study Notes account</CardDescription>
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              {error.includes("verify") && (
                <Link 
                  href={`/verify?email=${encodeURIComponent(email)}`}
                  className="text-sm text-primary underline block"
                >
                  Go to verification page
                </Link>
              )}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary underline">
              Sign up
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
