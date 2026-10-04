"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useSession() {
  const [session, setSession] = useState<any>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return { session, ready };
}
export const openAuth = () => window.dispatchEvent(new Event("open-auth"));
export const api = (path: string, token: string, body: any) =>
  fetch(path, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
export const deviceId = () => {
  let id = localStorage.getItem("device_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("device_id", id); }
  return id;
};
