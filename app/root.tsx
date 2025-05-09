import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData, // Added
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node"; // Added LoaderFunctionArgs
import { json } from "@remix-run/node"; // Added

import tailwindStylesUrl from "./tailwind.css?url";
import { createSupabaseServerClient } from "~/services/supabase.server"; // Added

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
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

// Added loader function
export async function loader({ request }: LoaderFunctionArgs) {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  };

  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return json({ env, session }, { headers: response.headers });
}

// The `Layout` component is effectively merged into `App` now.
// If you had specific logic in `Layout` beyond the HTML shell, it would be integrated here.

export default function App() {
  const { env, session } = useLoaderData<typeof loader>();

  // `session` is available here and can be passed via context or used directly.
  // `env` is used to expose Supabase config to the client.

  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
        />
      </head>
      <body className="h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased flex flex-col">
        {/* Pass session directly to Header */}
        <Header session={session} />
        <main className="flex-grow">
          <Outlet context={{ session }} /> {/* Outlet still receives context for child routes */}
        </main>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
// Need to import Header
import Header from "./components/Header";
