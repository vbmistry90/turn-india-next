import { useState } from "react";
import Head from "next/head";
import { MdEco, MdCheckCircle } from "react-icons/md";
import { timedFetch } from "@/lib/apiClient";

const emptyForm = { name: "", email: "", phone: "", subject: "", message: "" };

export default function ContactPage() {
  const [form, setForm] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await timedFetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      setError(data.message || "Something went wrong");
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setForm(emptyForm);
    setLoading(false);
  }

  return (
    <>
      <Head>
        <title>Contact Us · TurnIndia</title>
      </Head>
      <div className="min-h-screen bg-ink-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-center gap-2 mb-6 text-ink-800">
            <MdEco size={28} className="text-primary-600" />
            <span className="text-xl font-semibold">TurnIndia Admin</span>
          </div>

          <div className="card">
            {submitted ? (
              <div className="text-center py-8">
                <MdCheckCircle size={48} className="text-primary-600 mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-ink-800">Thanks for reaching out!</h2>
                <p className="text-sm text-ink-500 mt-1">We've received your message and will get back to you soon.</p>
                <button onClick={() => setSubmitted(false)} className="btn-secondary mt-5">
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-semibold text-ink-800 mb-1">Get in touch</h1>
                <p className="text-sm text-ink-500 mb-6">Have a question or feedback? Send us a message.</p>

                {error && (
                  <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">Name</label>
                      <input name="name" required className="input-field" value={form.name} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">Email</label>
                      <input type="email" name="email" required className="input-field" value={form.email} onChange={handleChange} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Phone (optional)</label>
                    <input name="phone" className="input-field" value={form.phone} onChange={handleChange} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Subject</label>
                    <input name="subject" className="input-field" value={form.subject} onChange={handleChange} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Message</label>
                    <textarea name="message" rows={4} required className="input-field" value={form.message} onChange={handleChange} />
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
