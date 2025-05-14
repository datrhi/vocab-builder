import { createCookie } from "@remix-run/node"; // Ensure this matches your Remix adapter
import { createServerClient, type CookieOptions } from "@supabase/ssr";

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
      async get(name: string) {
        const cookieHeader = request.headers.get("Cookie");
        const cookie = createCookie(name);
        return (await cookie.parse(cookieHeader)) || null;
      },
      async set(name: string, value: string, options: CookieOptions) {
        const cookie = createCookie(name, options);
        response.headers.append("Set-Cookie", await cookie.serialize(value));
      },
      async remove(name: string, options: CookieOptions) {
        const cookie = createCookie(name, options);
        response.headers.append(
          "Set-Cookie",
          await cookie.serialize("", { ...options, expires: new Date(0) })
        );
      },
    },
  });
};
