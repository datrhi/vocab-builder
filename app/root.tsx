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
} from "@remix-run/react";

import { Toaster } from "react-hot-toast";
import { createSupabaseServerClient } from "~/services/supabase.server"; // Added
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

export const meta: MetaFunction = () => {
  return [
    { title: "Quiz.com - Play & Create Fun Quizzes" },
    {
      name: "description",
      content:
        "Create, play, and share interactive quizzes with friends and classmates",
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
  const supabase = createSupabaseServerClient({ request, response });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return json({ env, user }, { headers: response.headers });
}

// The `Layout` component is effectively merged into `App` now.
// If you had specific logic in `Layout` beyond the HTML shell, it would be integrated here.

export default function App() {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full bg-neutral-50 font-nunito">
        <Outlet />
        <Toaster position="bottom-center" />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
