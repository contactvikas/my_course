"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"up" | "in">("up");
  const [f, setF] = useState({ name: "", email: "", password: "", phone: "", referral: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    setMsg(""); setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
      error ? setMsg(error.message) : onClose();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: f.email, password: f.password,
        options: { data: { name: f.name, phone: "+91" + f.phone, referral: f.referral } },
      });
      if (error) setMsg(error.message);
      else if (data.session) onClose();
      else setMsg("Account created. Check your email to confirm, then log in.");
    }
    setBusy(false);
  };

  const google = () => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + "/dashboard" } });

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={onClose} aria-label="Close">×</button>
        <h2>{mode === "up" ? "Create an Account" : "Log in"}</h2>
        {mode === "up" && <input placeholder="Name" value={f.name} onChange={set("name")} />}
        <input placeholder="Email address" type="email" value={f.email} onChange={set("email")} />
        <input placeholder="Password" type="password" value={f.password} onChange={set("password")} />
        {mode === "up" && (
          <>
            <div className="phone"><span>🇮🇳 +91</span><input placeholder="Phone number" value={f.phone} onChange={set("phone")} /></div>
            <input placeholder="Referral code (optional)" value={f.referral} onChange={set("referral")} />
          </>
        )}
        <button className="primary wide" disabled={busy} onClick={submit}>{mode === "up" ? "Next" : "Log in"}</button>
        {msg && <p className="err">{msg}</p>}
        <div className="or"><span>Or</span></div>
        <button className="outline wide" onClick={google}>Continue with Google</button>
        <p className="center">
          {mode === "up" ? "Already have an account? " : "New here? "}
          <a onClick={() => { setMode(mode === "up" ? "in" : "up"); setMsg(""); }}>{mode === "up" ? "Log in" : "Create account"}</a>
        </p>
      </div>
    </div>
  );
}
