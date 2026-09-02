import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { MdEco, MdArrowBack } from "react-icons/md";
import { timedFetch } from "@/lib/apiClient";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", rememberMe: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- 2FA challenge state ---
  const [twoFA, setTwoFA] = useState(null); // { method, tempToken, message }
  const [code, setCode] = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await timedFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      if (data.requires2FA) {
        setTwoFA({ method: data.method, tempToken: data.tempToken, message: data.message });
        setLoading(false);
        return;
      }

      const redirect = router.query.redirect || "/dashboard";
      router.push(redirect);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await timedFetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken: twoFA.tempToken, code }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Verification failed");
        setLoading(false);
        return;
      }

      const redirect = router.query.redirect || "/dashboard";
      router.push(redirect);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Login · TurnIndia</title>
      </Head>
      <div className="min-h-screen bg-ink-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-6 text-ink-800">
            <MdEco size={28} className="text-primary-600" />
            <span className="text-xl font-semibold">TurnIndia Admin</span>
          </div>

          <div className="card">
            {twoFA ? (
              <>
                <button
                  onClick={() => {
                    setTwoFA(null);
                    setCode("");
                    setError("");
                  }}
                  className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700 mb-4"
                >
                  <MdArrowBack size={16} /> Back
                </button>
                <h1 className="text-xl font-semibold text-ink-800 mb-1">Two-factor verification</h1>
                <p className="text-sm text-ink-500 mb-6">{twoFA.message}</p>

                {error && (
                  <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
                    {error}
                  </div>
                )}

                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">
                      {twoFA.method === "totp" ? "Authenticator code" : "Verification code"}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      autoFocus
                      className="input-field text-center text-lg tracking-[0.4em]"
                      placeholder="••••••"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                  <button type="submit" disabled={loading || code.length < 6} className="btn-primary w-full">
                    {loading ? "Verifying..." : "Verify & Sign in"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold text-ink-800 mb-1">Welcome back</h1>
                <p className="text-sm text-ink-500 mb-6">Sign in to manage your dashboard</p>

                {error && (
                  <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="input-field"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Password</label>
                    <input
                      type="password"
                      name="password"
                      required
                      className="input-field"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={form.rememberMe}
                        onChange={handleChange}
                        className="rounded border-ink-300 text-primary-600 focus:ring-primary-500"
                      />
                      Remember me
                    </label>
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                </form>

                <p className="text-sm text-ink-500 mt-6 text-center">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="text-primary-600 font-medium hover:underline">
                    Register
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
