import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { createSupabaseServerClient } from "~/services/supabase.server";

// Handle OAuth and email confirmation redirects from Supabase
export async function loader({ request }: LoaderFunctionArgs) {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });
  const url = new URL(request.url);

  // Get redirectTo from query parameters or default to homepage
  const redirectTo = url.searchParams.get("redirectTo") || "/";

  // Exchange auth code for session
  const { error } = await supabase.auth.exchangeCodeForSession(
    url.searchParams.get("code") || ""
  );

  if (error) {
    // If there's an error, redirect to signin with error query param
    return redirect(
      `/auth/signin?error=${encodeURIComponent(
        error.message
      )}&redirectTo=${encodeURIComponent(redirectTo)}`,
      {
        headers: response.headers,
      }
    );
  }

  // On success, redirect to the intended destination
  return redirect(redirectTo, {
    headers: response.headers,
  });
}
