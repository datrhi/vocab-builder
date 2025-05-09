import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node"; // json removed as it's not used
import { createSupabaseServerClient } from "~/services/supabase.server";

export const meta: MetaFunction = () => {
  return [{ title: "Vocabulary Quiz" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    // If the user is logged in, redirect to the admin page
    return redirect("/admin", { headers: response.headers });
  }

  // If the user is not logged in, redirect to the login page
  return redirect("/login", { headers: response.headers });
}

// This page will not render anything visible as the loader always redirects.
// Returning null is standard practice for such routes.
export default function Index() {
  return null;
}
