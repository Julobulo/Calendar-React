// src/components/GoogleLoginButton.tsx
import { useEffect, useRef } from "react";

export function GoogleLoginButton() {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log(`debugging: ${import.meta.env.VITE_GOOGLE_CLIENT_ID}}`);
    if (!window.google || !divRef.current) return;
    console.log(`debugging: ${import.meta.env.VITE_GOOGLE_CLIENT_ID}}`);
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response: any) => {
        // response.credential is the Google ID token
        await fetch(`${import.meta.env.VITE_API_URL}/auth/google`, {
          method: "POST",
          credentials: "include", // important (cookies)
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: response.credential }),
        });
        // After login, your cookies now have access+refresh tokens.
        // Trigger a re-fetch of /auth/me
        window.dispatchEvent(new Event("auth:changed"));
      },
    });
    window.google.accounts.id.renderButton(divRef.current, {
      theme: "outline",
      size: "large",
      type: "standard",
      shape: "rectangular",
      text: "signin_with",
      logo_alignment: "left",
    });
  }, []);

  return <div ref={divRef} />;
}
