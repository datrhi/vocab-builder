import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import Header from "~/components/Header";
import { createSupabaseServerClient } from "~/services/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });

  // Get the current user if they're logged in
  const { data } = await supabase.auth.getUser();

  // Redirect only if we're at exactly /auth
  if (url.pathname === "/auth") {
    return redirect("/auth/signin");
  }

  // Transform the user object to match Header component expectations
  return json({ user: data }, { headers: response.headers });
}

export default function AuthLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="flex min-h-screen flex-col bg-background bubble-bg">
      <Header />
      <Outlet />
    </div>
  );
}
