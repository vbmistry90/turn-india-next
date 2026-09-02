import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { MdEco } from "react-icons/md";
import { timedFetch } from "@/lib/apiClient";

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await timedFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Registration failed");
        setLoading(false);
        return;
      }

      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Register · TurnIndia</title>
      </Head>
      <div className="min-h-screen bg-ink-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-6 text-ink-800">
            <MdEco size={28} className="text-primary-600" />
            <span className="text-xl font-semibold">TurnIndia Admin</span>
          </div>

          <div className="card">
            <h1 className="text-xl font-semibold text-ink-800 mb-1">Create an account</h1>
            <p className="text-sm text-ink-500 mb-6">Get started with your admin dashboard</p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Full name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="input-field"
                  placeholder="Jane Doe"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>

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
                  minLength={6}
                  className="input-field"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Confirm password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="input-field"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="text-sm text-ink-500 mt-6 text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-primary-600 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
