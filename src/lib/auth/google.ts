/**
 * Google Identity Services (GIS) — obtain a provider ID token in the browser /
 * Capacitor WebView, which the backend exchanges at POST /auth/social.
 *
 * Set NEXT_PUBLIC_GOOGLE_CLIENT_ID (OAuth 2.0 Web client ID). For a native build
 * you'll also register the app's bundle id with Google and may prefer a native
 * plugin, but GIS works inside the WebView when the client id is whitelisted.
 */
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const GIS_SRC = "https://accounts.google.com/gsi/client";

interface CredentialResponse {
  credential?: string;
}
interface GsiButtonConfig {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with";
  shape?: "rectangular" | "pill";
  width?: number;
  logo_alignment?: "left" | "center";
}
interface GoogleId {
  initialize(config: {
    client_id: string;
    callback: (resp: CredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_prompt?: boolean;
  }): void;
  prompt(): void;
  cancel(): void;
  renderButton(parent: HTMLElement, options: GsiButtonConfig): void;
}
type GoogleNS = { accounts: { id: GoogleId } };

declare global {
  interface Window {
    google?: GoogleNS;
  }
}

export const isGoogleConfigured = (): boolean => CLIENT_ID.length > 0;

let scriptPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google")));
      return;
    }
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Render Google's official sign-in button into `parent` (transparently overlaid
 * on a custom-styled button by the caller). Google's button manages the FedCM
 * dialog and cancellation itself, so a dismissed prompt never leaves the app in a
 * stuck state — the credential simply arrives (or doesn't) via `onCredential`.
 */
export async function renderGoogleButton(
  parent: HTMLElement,
  onCredential: (idToken: string) => void,
  width: number,
): Promise<void> {
  if (!isGoogleConfigured()) throw new Error("Google sign-in isn't configured.");
  await loadGis();
  const id = window.google!.accounts.id;
  id.initialize({
    client_id: CLIENT_ID,
    cancel_on_tap_outside: true,
    use_fedcm_for_prompt: true,
    callback: (resp) => {
      if (resp.credential) onCredential(resp.credential);
    },
  });
  parent.replaceChildren();
  id.renderButton(parent, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "pill",
    logo_alignment: "center",
    width: Math.min(Math.max(Math.round(width), 200), 400),
  });
}
