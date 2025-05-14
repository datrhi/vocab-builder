import { createSupabaseServerClient } from "./supabase.server";

/**
 * Helper function to check if a user is authenticated
 */
export async function requireAuth(request: Request) {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Response(null, {
      status: 302,
      headers: {
        Location: `/auth/signin?redirectTo=${encodeURIComponent(request.url)}`,
      },
    });
  }

  return { user, response, supabase };
}

/**
 * Signs the user out and redirects to the sign-in page
 */
export async function signOut(request: Request) {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });

  await supabase.auth.signOut();

  return new Response(null, {
    status: 302,
    headers: {
      ...response.headers,
      Location: "/auth/signin",
    },
  });
}

/**
 * Gets the current user if authenticated, or null
 */
export async function getCurrentUser(request: Request) {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, response, supabase };
}
