import "@/styles/globals.css";
import Providers from "@/components/Provider";
import Header from "@/components/Header"; // ✅ Import your header

export default function App({ Component, pageProps }) {
  // Aggressive error suppression for browser extension conflicts
  if (typeof window !== "undefined") {
    // Override console.error to suppress extension errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(" ");
      if (
        message.includes("Extension ID") ||
        message.includes("runtime.sendMessage") ||
        message.includes("chrome.runtime") ||
        message.includes("chrome-extension://")
      ) {
        // Suppress extension-related errors
        return;
      }
      console.log("Are we here 5?");
      originalConsoleError.apply(console, args);
      console.log("Are we here 6?");
    };

    // Global error handler for unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      const message =
        event.reason?.message || event.reason?.toString() || "";
      if (
        message.includes("Extension ID") ||
        message.includes("runtime.sendMessage") ||
        message.includes("chrome.runtime") ||
        message.includes("chrome-extension://")
      ) {
        console.warn("Browser extension error suppressed");
        event.preventDefault();
        return;
      }
    });

    // Global error handler
    window.addEventListener("error", (event) => {
      const message = event.error?.message || event.message || "";
      if (
        message.includes("Extension ID") ||
        message.includes("runtime.sendMessage") ||
        message.includes("chrome.runtime") ||
        message.includes("chrome-extension://")
      ) {
        console.warn("Browser extension error suppressed");
        event.preventDefault();
        return;
      }
    });

    // Additional handler for Next.js error overlay
    const originalError = window.Error;
    window.Error = function (...args) {
      const error = new originalError(...args);
      const message = error.message || "";
      if (
        message.includes("Extension ID") ||
        message.includes("runtime.sendMessage") ||
        message.includes("chrome.runtime") ||
        message.includes("chrome-extension://")
      ) {
        // Return a harmless error instead
        return new originalError("Browser extension conflict resolved");
      }
      return error;
    };
  }

  return (
    <Providers>
      <Header /> {/* ✅ Header shows up on every page */}
      <Component {...pageProps} />
    </Providers>
  );
}
