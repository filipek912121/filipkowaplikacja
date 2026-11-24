import { getT } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProfileView } from "@/components/social/profile-view";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { profileOverview } from "@/lib/services/profile";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${decodeURIComponent(username).slice(0, 20)}` };
}

export default async function PublicProfile({ params }: { params: Promise<{ username: string }> }) {
  const t = await getT();
  const me = await requireUser();
  const { username } = await params;
  const user = await getStore().getProfileByUsername(decodeURIComponent(username).slice(0, 20));
  if (!user) notFound();
  if (user.id === me.id) redirect("/profile");
  const o = await profileOverview(user.id, me.id);
  if (!o) notFound();
  return <ProfileView o={o} />;
}
