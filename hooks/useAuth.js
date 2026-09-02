import useSWR from "swr";
import { useRouter } from "next/router";
import { timedFetcher, timedFetch } from "@/lib/apiClient";

export default function useAuth({ redirectOnFail = false } = {}) {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR("/api/auth/me", timedFetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  });

  if (error && redirectOnFail) {
    router.replace("/login");
  }

  async function logout() {
    await timedFetch("/api/auth/logout", { method: "POST" });
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
