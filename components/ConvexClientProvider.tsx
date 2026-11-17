"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const client = useMemo(() => (url ? new ConvexReactClient(url) : null), [url]);
  if (!client) {
    return (
      <main className="shell no-nav">
        <div className="card">
          <h2>Backend nicht verbunden</h2>
          <p className="muted">
            NEXT_PUBLIC_CONVEX_URL fehlt. Lokal <code>npx convex dev</code> starten bzw. auf Vercel
            <code> CONVEX_DEPLOY_KEY</code> setzen.
          </p>
        </div>
      </main>
    );
  }
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
