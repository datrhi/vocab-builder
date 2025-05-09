import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createSupabaseServerClient } from "~/services/supabase.server"; // Ensure this path is correct

// Loader to redirect if someone tries to GET this route
export async function loader({ request }: LoaderFunctionArgs) {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // If already logged out, redirect to home or login
    return redirect("/login", { headers: response.headers });
  }
  // If logged in and GETs /logout, redirect to home, as logout should be a POST action
  return redirect("/", { headers: response.headers });
}

// Action to handle the logout process
export async function action({ request }: ActionFunctionArgs) {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });

  const { error } = await supabase.auth.signOut();

  if (error) {
    // You might want to log this error or handle it differently
    console.error("Supabase sign out error:", error);
    // Even if there's an error, try to redirect to a safe page
    return redirect("/login", { headers: response.headers });
  }

  // On successful logout, Supabase client handles clearing the session cookie via response headers.
  // Redirect to the login page or homepage.
  return redirect("/login", { headers: response.headers });
}

// This route typically does not render a UI, so a default export returning null is common.
// Or, you could render a simple "Logging out..." message if preferred,
// but the action will redirect immediately.
export default function LogoutRoute() {
  return null;
}