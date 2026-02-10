import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
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
import { Separator } from "@/components/ui/separator";
import { LogOut, Save } from "lucide-react";

const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required."),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: "" },
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.display_name) {
          reset({ displayName: data.display_name });
        }
      });
  }, [user, reset]);

  const onSubmit = async (values: ProfileValues) => {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: values.displayName.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setSaving(false);
    if (!error) setSaved(true);
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your email and display name</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                {...register("displayName")}
                placeholder="Your name"
              />
              {errors.displayName && (
                <p className="text-sm text-destructive">{errors.displayName.message}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? "Saving..." : "Save"}
              </Button>
              {saved && (
                <span className="text-sm text-success">Saved successfully!</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardContent className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Sign out</p>
            <p className="text-sm text-muted-foreground">
              Sign out of your account on this device
            </p>
          </div>
          <Button variant="destructive" className="w-full sm:w-auto" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-1" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
