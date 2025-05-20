import type {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

import { createBrowserClient } from "@supabase/ssr";
import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { SoundEffectsProvider } from "./components/sound-effects";
import { getCurrentUser } from "./services/auth.server";
import tailwindStylesUrl from "./tailwind.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwindStylesUrl },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap",
  },
];

export type RootLoaderData = {
  env: {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
  };
  user: User | null;
};

export const meta: MetaFunction = () => {
  return [
    { title: "Vocab Builder - Engage and Enhance Your Vocabulary" },
    {
      name: "description",
      content:
        "Engage in fun and educational vocabulary challenges by creating, playing, and sharing interactive quizzes with friends and classmates.",
    },
  ];
};

// Added loader function
export async function loader({ request }: LoaderFunctionArgs) {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  };

  const response = new Response();

  const { user } = await getCurrentUser(request);

  return json({ env, user }, { headers: response.headers });
}

// Preload the audio assets
const audioAssets = [{ rel: "preload", href: "/audio/sfx.mp3", as: "audio" }];

// The `Layout` component is effectively merged into `App` now.
// If you had specific logic in `Layout` beyond the HTML shell, it would be integrated here.

export default function App() {
  const { env, user } = useLoaderData<typeof loader>();
  const [supabase] = useState(() => {
    return createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  });

  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />

        {/* Preload audio assets */}
        {audioAssets.map((asset) => (
          <link
            key={asset.href}
            rel={asset.rel}
            href={asset.href}
            as={asset.as}
          />
        ))}
      </head>
      <body className="h-full bg-neutral-50 font-nunito">
        <SoundEffectsProvider>
          <Outlet context={{ env, user, supabase }} />
          <Toaster
            position="bottom-center"
            toastOptions={{
              success: {
                icon: "✅",
              },
              error: {
                icon: "❌",
              },
            }}
          />
        </SoundEffectsProvider>
        <ScrollRestoration />
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
        />
      </body>
    </html>
  );
}
