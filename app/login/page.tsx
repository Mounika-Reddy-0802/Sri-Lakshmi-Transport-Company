"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { ApiError } from "@/lib/api";
import { HOME_FOR_ROLE, useAuth } from "@/lib/auth";



export default function LoginPage() {
  const router = useRouter();
  const { login, user, status } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Already signed in? Go straight to the right portal.
  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(HOME_FOR_ROLE[user.role]);
    }
  }, [status, user, router]);

  async function signIn(withEmail: string, withPassword: string) {
    setError(null);
    setPending(true);
    try {
      const signedIn = await login(withEmail, withPassword);
      router.replace(HOME_FOR_ROLE[signedIn.role]);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not reach the server. Is the API running on port 4000?",
      );
      setPending(false);
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void signIn(email, password);
  };

  return (
    <main className="min-h-screen bg-white px-5 py-10 dark:bg-[#15171D]">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted2 hover:text-midnight dark:hover:text-fog">
          <ArrowLeft size={16} /> Back to site
        </Link>
        <ThemeToggle />
      </div>

      <div className="mx-auto mt-14 max-w-5xl text-center">
        <div className="mb-6 flex justify-center"><Logo size={52} /></div>
        <h1 className="display text-4xl text-ink dark:text-white">Sign in</h1>
        <p className="mt-3 text-muted2">One account, three portals — you land on the right one automatically.</p>
      </div>

      <form onSubmit={onSubmit} className="mx-auto mt-10 w-full max-w-sm">
        <label htmlFor="email" className="block text-sm font-medium text-ink dark:text-white">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-steel focus:ring-2 focus:ring-steel/20 dark:bg-[#1A1D24] dark:text-white"
          placeholder="you@company.com"
        />

        <label htmlFor="password" className="mt-4 block text-sm font-medium text-ink dark:text-white">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-steel focus:ring-2 focus:ring-steel/20 dark:bg-[#1A1D24] dark:text-white"
          placeholder="••••••••"
        />

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-slate/10 px-4 py-3 text-sm text-midnight dark:text-fog">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-midnight px-5 py-3 text-sm font-medium text-white transition hover:bg-steel disabled:opacity-60"
        >
          {pending && <Loader2 size={16} className="animate-spin" />}
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mx-auto mt-10 max-w-5xl text-center text-xs text-muted2">
        Authentication is real — JWT access tokens with an httpOnly refresh cookie, and every
        request is scoped to the signed-in account&apos;s organization.
      </p>
    </main>
  );
}
