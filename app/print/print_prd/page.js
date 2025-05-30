"use client";

import QRCodeGenerator from "../../../components/QRCodeGeneratorPrd";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function Page() {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  if (loading) {
    return <p>Loading...</p>;
  }

  const router = useRouter();

  if (!session) {
    router.push("/auth");
    return null;
  }

  const isAdmin = session?.user?.role === "admin";

  return <QRCodeGenerator />;
}
