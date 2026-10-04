"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession, openAuth } from "@/lib/useSession";
import { BRAND } from "@/lib/brand";
import AuthModal from "./AuthModal";

export default function Nav() {
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("open-auth", h);
    return () => window.removeEventListener("open-auth", h);
  }, []);
  const name = session?.user?.user_metadata?.name || session?.user?.email || "";
  return (
    <header className="nav">
      <Link href="/" className="logo">{BRAND}</Link>
      <nav>
        <a href="/#courses">Courses</a>
        <a href="/#faq">FAQ</a>
        {session ? (
          <>
            <Link href="/dashboard">My Dashboard</Link>
            <span className="avatar" title={name}>{name[0]?.toUpperCase()}</span>
            <a onClick={() => supabase.auth.signOut().then(() => (location.href = "/"))}>Sign out</a>
          </>
        ) : (
          <button className="primary" onClick={openAuth}>Login</button>
        )}
      </nav>
      {open && !session && <AuthModal onClose={() => setOpen(false)} />}
    </header>
  );
}
