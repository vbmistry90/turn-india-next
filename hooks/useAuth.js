import useSWR from "swr";
import { useRouter } from "next/router";

const fetcher = (url) =>
  fetch(url, { credentials: "include" }).then(async (res) => {
    if (!res.ok) {
      const err = new Error("Not authenticated");
      err.status = res.status;
      throw err;
    }
    return res.json();
  });

export default function useAuth({ redirectOnFail = false } = {}) {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR("/api/auth/me", fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  });

  if (error && redirectOnFail) {
    router.replace("/login");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    mutate(undefined, false);
    router.push("/login");
  }

  return {
    user: data?.user || null,
    isLoading,
    isError: Boolean(error),
    logout,
  };
}
