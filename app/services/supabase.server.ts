import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";

// Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in your .env file
if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL is not set in .env");
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error("SUPABASE_ANON_KEY is not set in .env");
}

export const supabaseURL = process.env.SUPABASE_URL;
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

/**
 * Creates a Supabase client for server-side operations in Remix.
 * It requires the Request object to read cookies and Response object
 * to set cookies.
 *
 * @param {Request} request The Remix Request object.
 * @param {Response} response The Remix Response object to set cookies on.
 * @returns {SupabaseClient} A Supabase client instance.
 */
export const createSupabaseServerClient = ({
  request,
  response,
}: {
  request: Request;
  response: Response;
}) => {
  return createServerClient(supabaseURL, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("Cookie") ?? "") as {
          name: string;
          value: string;
        }[];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.headers.append(
            "Set-Cookie",
            serializeCookieHeader(name, value, options)
          )
        );
      },
    },
  });
};
