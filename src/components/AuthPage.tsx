import { useState } from "react";
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

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    if (mode === "signup" && !displayName.trim()) {
      setError("Please enter your name.");
      return;
    }

    setSubmitting(true);
    let err: string | null;
    if (mode === "signin") {
      err = await signIn(email.trim(), password);
    } else {
      err = await signUp(email.trim(), password, displayName.trim());
      if (!err) {
        setInfo("Account created! Check your email to confirm, then sign in.");
        setMode("signin");
        setDisplayName("");
        setPassword("");
        setSubmitting(false);
        return;
      }
    }
    if (err) setError(err);
    setSubmitting(false);
  };

  const toggleMode = () => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError(null);
    setInfo(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">90-in-180 Stay Calculator</CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Sign in to your account"
              : "Create a new account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="auth-name">Display name</Label>
                <Input
                  id="auth-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {info && <p className="text-sm text-success">{info}</p>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting
                ? "Please wait..."
                : mode === "signin"
                ? "Sign in"
                : "Create account"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="text-primary underline underline-offset-4 hover:text-primary/80 cursor-pointer"
                  onClick={toggleMode}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-primary underline underline-offset-4 hover:text-primary/80 cursor-pointer"
                  onClick={toggleMode}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
