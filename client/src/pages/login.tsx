import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Database, Loader2, Mail, KeyRound, ArrowRight } from "lucide-react";

export default function Login() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendOtp = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }

    if (!trimmedEmail.endsWith("@boardinfinity.com")) {
      toast({
        title: "Access restricted",
        description: "Only @boardinfinity.com email addresses are allowed.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setStep("otp");
      toast({
        title: "OTP sent",
        description: `Check your inbox at ${trimmedEmail}`,
      });
    } catch (err: any) {
      toast({
        title: "Failed to send OTP",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      toast({ title: "OTP required", description: "Please enter the 6-digit code.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp.trim(),
        type: "email",
      });

      if (error) throw error;

      toast({ title: "Logged in", description: "Welcome to Nexus." });
      // Auth state change listener in AuthProvider will handle the redirect
    } catch (err: any) {
      toast({
        title: "Verification failed",
        description: err.message || "Invalid or expired code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="login-page">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo & Title */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Database className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">NEXUS</h1>
          </div>
          <p className="text-sm text-muted-foreground">Board Infinity Data Intelligence Platform</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              {step === "email" ? "Sign in with Email" : "Enter Verification Code"}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {step === "email"
                ? "We'll send a one-time code to your @boardinfinity.com email."
                : `A 6-digit code was sent to ${email}`}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === "email" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@boardinfinity.com"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                      data-testid="input-email"
                      autoFocus
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleSendOtp}
                  disabled={loading}
                  data-testid="btn-send-otp"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  Send Code
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-xs">Verification Code</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      className="pl-9 tracking-widest text-center font-mono"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                      data-testid="input-otp"
                      autoFocus
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  data-testid="btn-verify-otp"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <KeyRound className="h-4 w-4 mr-2" />
                  )}
                  Verify & Sign In
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() => { setStep("email"); setOtp(""); }}
                  data-testid="btn-back-email"
                >
                  Use a different email
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-[10px] text-center text-muted-foreground">
          Access restricted to Board Infinity team members.
        </p>
      </div>
    </div>
  );
}
