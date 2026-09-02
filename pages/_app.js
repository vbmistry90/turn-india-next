import { useEffect } from "react";
import { useRouter } from "next/router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import "@/styles/globals.css";

// Config: slightly faster start, no spinner (we already have the top bar).
NProgress.configure({ showSpinner: false, trickleSpeed: 120, minimum: 0.12 });

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const handleStart = (url) => {
      // Don't show the bar for a same-page query-string-only change
      // (e.g. pagination via ?page=2 on the same route component).
      if (url.split("?")[0] !== router.pathname) {
        NProgress.start();
      }
    };
    const handleStop = () => NProgress.done();

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleStop);
    router.events.on("routeChangeError", handleStop);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleStop);
      router.events.off("routeChangeError", handleStop);
    };
  }, [router]);

  return <Component {...pageProps} />;
}
