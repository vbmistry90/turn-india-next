import { useState } from "react";
import useSWR from "swr";
import DashboardLayout from "@/components/DashboardLayout";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";
import ProfileSkeleton from "@/components/skeletons/ProfileSkeleton";
import { timedFetcher, timedFetch } from "@/lib/apiClient";
import {
  MdPerson,
  MdLock,
  MdSecurity,
  MdQrCode2,
  MdEmail,
  MdSms,
  MdCheckCircle,
} from "react-icons/md";

const fetcher = timedFetcher;

function Section({ icon: Icon, title, description, children }) {
  return (
    <div className="card">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
          <Icon size={20} />
        </div>
        <div>
          <h2 className="font-semibold text-ink-800">{title}</h2>
          {description && <p className="text-sm text-ink-500">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { data, mutate } = useSWR("/api/user/profile", fetcher);
  const user = data?.data;

  const [profileForm, setProfileForm] = useState(null);
  const [profileMsg, setProfileMsg] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const [totpModal, setTotpModal] = useState(false);
  const [totpSetup, setTotpSetup] = useState(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpError, setTotpError] = useState("");

  const [emailModal, setEmailModal] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [smsModal, setSmsModal] = useState(false);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [smsError, setSmsError] = useState("");

  const [busy, setBusy] = useState(false);

  function startEditProfile() {
    setProfileForm({ name: user.name, phone: user.phone || "" });
    setProfileMsg("");
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    const res = await timedFetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm),
    });
    const result = await res.json();
    setSavingProfile(false);
    if (result.success) {
      setProfileMsg("Profile updated successfully");
      mutate();
    } else {
      setProfileMsg(result.message || "Failed to update profile");
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwError("");
    setPwMsg("");

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("New passwords do not match");
      return;
    }

    setSavingPw(true);
    const res = await timedFetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pwForm),
    });
    const result = await res.json();
    setSavingPw(false);

    if (!result.success) {
      setPwError(result.message || "Failed to change password");
      return;
    }
    setPwMsg("Password updated successfully");
    setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  }

  async function startTotpSetup() {
    setTotpError("");
    setTotpCode("");
    setBusy(true);
    const res = await timedFetch("/api/user/2fa/totp/setup", { method: "POST" });
    const result = await res.json();
    setBusy(false);
    if (result.success) {
      setTotpSetup(result);
      setTotpModal(true);
    } else {
      alert(result.message || "Failed to start setup");
    }
  }

  async function confirmTotp(e) {
    e.preventDefault();
    setTotpError("");
    setBusy(true);
    const res = await timedFetch("/api/user/2fa/totp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: totpCode }),
    });
    const result = await res.json();
    setBusy(false);
    if (!result.success) {
      setTotpError(result.message || "Invalid code");
      return;
    }
    setTotpModal(false);
    mutate();
  }

  async function startEmailSetup() {
    setEmailError("");
    setEmailCode("");
    setEmailSent(false);
    setEmailModal(true);
    setBusy(true);
    const res = await timedFetch("/api/user/2fa/email/setup", { method: "POST" });
    const result = await res.json();
    setBusy(false);
    if (result.success) {
      setEmailSent(true);
    } else {
      setEmailError(result.message || "Failed to send code");
    }
  }

  async function confirmEmail(e) {
    e.preventDefault();
    setEmailError("");
    setBusy(true);
    const res = await timedFetch("/api/user/2fa/email/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: emailCode }),
    });
    const result = await res.json();
    setBusy(false);
    if (!result.success) {
      setEmailError(result.message || "Invalid code");
      return;
    }
    setEmailModal(false);
    mutate();
  }

  function startSmsSetup() {
    setSmsError("");
    setSmsCode("");
    setSmsSent(false);
    setSmsPhone(user?.phone || "");
    setSmsModal(true);
  }

  async function sendSmsCode() {
    setSmsError("");
    setBusy(true);
    const res = await timedFetch("/api/user/2fa/sms/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: smsPhone }),
    });
    const result = await res.json();
    setBusy(false);
    if (result.success) {
      setSmsSent(true);
    } else {
      setSmsError(result.message || "Failed to send code");
    }
  }

  async function confirmSms(e) {
    e.preventDefault();
    setSmsError("");
    setBusy(true);
    const res = await timedFetch("/api/user/2fa/sms/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: smsCode }),
    });
    const result = await res.json();
    setBusy(false);
    if (!result.success) {
      setSmsError(result.message || "Invalid code");
      return;
    }
    setSmsModal(false);
    mutate();
  }

  async function disable2FA() {
    if (!confirm("Disable two-factor authentication? Your account will be less secure.")) return;
    setBusy(true);
    await timedFetch("/api/user/2fa/disable", { method: "POST" });
    setBusy(false);
    mutate();
  }

  if (!user) {
    return (
      <DashboardLayout title="My Profile">
        <ProfileSkeleton />
      </DashboardLayout>
    );
  }

  const methodLabels = { totp: "Authenticator App", email: "Email", sms: "SMS" };

  return (
    <DashboardLayout title="My Profile">
      <div className="space-y-6 max-w-3xl">
        <Section icon={MdPerson} title="Account Information" description="Your basic profile details">
          {profileForm ? (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {profileMsg && <p className="text-sm text-primary-700">{profileMsg}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Name</label>
                  <input
                    className="input-field"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Phone</label>
                  <input
                    className="input-field"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+1 555 000 1234"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={savingProfile} className="btn-primary">
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setProfileForm(null)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <div className="space-y-1 text-sm">
                <p><span className="text-ink-400">Name:</span> <span className="text-ink-800 font-medium">{user.name}</span></p>
                <p><span className="text-ink-400">Email:</span> <span className="text-ink-800 font-medium">{user.email}</span></p>
                <p><span className="text-ink-400">Phone:</span> <span className="text-ink-800 font-medium">{user.phone || "Not set"}</span></p>
                <p><span className="text-ink-400">Role:</span> <StatusBadge value={user.role} /></p>
              </div>
              <button className="btn-secondary" onClick={startEditProfile}>
                Edit
              </button>
            </div>
          )}
        </Section>

        <Section icon={MdLock} title="Change Password" description="Use a strong, unique password">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {pwError && <p className="text-sm text-red-600">{pwError}</p>}
            {pwMsg && <p className="text-sm text-primary-700">{pwMsg}</p>}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                className="input-field"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="input-field"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  className="input-field"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                />
              </div>
            </div>
            <button type="submit" disabled={savingPw} className="btn-primary">
              {savingPw ? "Updating..." : "Update Password"}
            </button>
          </form>
        </Section>

        <Section
          icon={MdSecurity}
          title="Two-Factor Authentication"
          description="Add an extra layer of security to your account at login"
        >
          {user.twoFactorEnabled ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                <MdCheckCircle size={20} />
                2FA enabled via {methodLabels[user.twoFactorMethod]}
              </div>
              <button onClick={disable2FA} disabled={busy} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50">
                Disable
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={startTotpSetup} disabled={busy} className="border border-ink-200 rounded-lg p-4 text-left hover:border-primary-400 hover:bg-primary-50/40 transition-colors">
                <MdQrCode2 size={22} className="text-primary-600 mb-2" />
                <p className="font-medium text-ink-800 text-sm">Authenticator App</p>
                <p className="text-xs text-ink-500 mt-1">Google Authenticator, Authy, etc.</p>
              </button>
              <button onClick={startEmailSetup} disabled={busy} className="border border-ink-200 rounded-lg p-4 text-left hover:border-primary-400 hover:bg-primary-50/40 transition-colors">
                <MdEmail size={22} className="text-primary-600 mb-2" />
                <p className="font-medium text-ink-800 text-sm">Email</p>
                <p className="text-xs text-ink-500 mt-1">Get a code sent to {user.email}</p>
              </button>
              <button onClick={startSmsSetup} disabled={busy} className="border border-ink-200 rounded-lg p-4 text-left hover:border-primary-400 hover:bg-primary-50/40 transition-colors">
                <MdSms size={22} className="text-primary-600 mb-2" />
                <p className="font-medium text-ink-800 text-sm">SMS</p>
                <p className="text-xs text-ink-500 mt-1">Get a code sent via text message</p>
              </button>
            </div>
          )}
        </Section>
      </div>

      <Modal open={totpModal} onClose={() => setTotpModal(false)} title="Set up Authenticator App">
        {totpSetup && (
          <div className="space-y-4 text-sm">
            <p className="text-ink-600">Scan this QR code with Google Authenticator, Authy, or any TOTP app:</p>
            <div className="flex justify-center bg-ink-50 rounded-lg p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={totpSetup.qrDataUrl} alt="TOTP QR code" width={200} height={200} />
            </div>
            <p className="text-xs text-ink-400">
              Can&apos;t scan? Enter this key manually: <code className="bg-ink-100 px-1.5 py-0.5 rounded">{totpSetup.secret}</code>
            </p>
            <form onSubmit={confirmTotp} className="space-y-3">
              {totpError && <p className="text-red-600 text-sm">{totpError}</p>}
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                className="input-field text-center text-lg tracking-[0.4em]"
                placeholder="123456"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              />
              <button type="submit" disabled={busy || totpCode.length < 6} className="btn-primary w-full">
                Verify & Enable
              </button>
            </form>
          </div>
        )}
      </Modal>

      <Modal open={emailModal} onClose={() => setEmailModal(false)} title="Set up Email Verification">
        <div className="space-y-4 text-sm">
          {emailSent ? (
            <form onSubmit={confirmEmail} className="space-y-3">
              <p className="text-ink-600">We sent a 6-digit code to <strong>{user.email}</strong>.</p>
              {emailError && <p className="text-red-600 text-sm">{emailError}</p>}
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                className="input-field text-center text-lg tracking-[0.4em]"
                placeholder="123456"
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
              />
              <button type="submit" disabled={busy || emailCode.length < 6} className="btn-primary w-full">
                Verify & Enable
              </button>
            </form>
          ) : (
            <p className="text-ink-500">{emailError || "Sending code..."}</p>
          )}
        </div>
      </Modal>

      <Modal open={smsModal} onClose={() => setSmsModal(false)} title="Set up SMS Verification">
        <div className="space-y-4 text-sm">
          {!smsSent ? (
            <>
              <label className="block text-sm font-medium text-ink-700 mb-1">Phone number</label>
              <input
                className="input-field"
                placeholder="+1 555 000 1234"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
              />
              {smsError && <p className="text-red-600 text-sm">{smsError}</p>}
              <button onClick={sendSmsCode} disabled={busy || !smsPhone} className="btn-primary w-full">
                Send Code
              </button>
            </>
          ) : (
            <form onSubmit={confirmSms} className="space-y-3">
              <p className="text-ink-600">We sent a 6-digit code to <strong>{smsPhone}</strong>.</p>
              {smsError && <p className="text-red-600 text-sm">{smsError}</p>}
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                className="input-field text-center text-lg tracking-[0.4em]"
                placeholder="123456"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ""))}
              />
              <button type="submit" disabled={busy || smsCode.length < 6} className="btn-primary w-full">
                Verify & Enable
              </button>
            </form>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
