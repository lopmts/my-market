import type { Metadata } from "next";
import { ProfileContent } from "./profile-content";

export const metadata: Metadata = {
  title: "Minha conta | My Market",
  description: "Gerencie seus dados pessoais e endereços da sua conta My Market.",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfileContent />;
}
