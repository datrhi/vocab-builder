import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { createSupabaseServerClient } from "~/services/supabase.server";

// Handle sign out
export async function loader({ request }: LoaderFunctionArgs) {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });

  // Get the URL to redirect to after signing out (defaulting to signin page)
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo") || "/auth/signin";

  // Sign out the user
  await supabase.auth.signOut();

  // Redirect to the specified location with the updated headers
  return redirect(redirectTo, {
    headers: response.headers,
  });
}
