import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { useEffect, useReducer } from "react";
import { toast } from "react-hot-toast";
import { getCurrentUser } from "~/services/auth.server";
import { createSupabaseServerClient } from "~/services/supabase.server";

// Redirect to dashboard if already signed in
export async function loader({ request }: LoaderFunctionArgs) {
  const { user, response } = await getCurrentUser(request);

  // Parse URL for query params
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const redirectTo = url.searchParams.get("redirectTo") || "/";

  if (user) {
    return new Response(null, {
      status: 302,
      headers: { Location: redirectTo },
    });
  }

  return json({ user, error, redirectTo }, { headers: response.headers });
}

// Handle form submission and authentication
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });

  const authMethod = formData.get("authMethod") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/";
  const domainUrl = process.env.DOMAIN_URL;

  // Handle Google OAuth sign in
  if (authMethod === "google") {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${domainUrl}/auth/callback?redirectTo=${encodeURIComponent(
          redirectTo
        )}`,
      },
    });

    if (error) {
      return json({ error: error.message }, { headers: response.headers });
    }

    // Redirect to the OAuth provider's login page
    return redirect(data.url, { headers: response.headers });
  }

  // Handle email/password sign in
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return json({ error: error.message }, { headers: response.headers });
  }

  return redirect(redirectTo, { headers: response.headers });
}

export default function SignIn() {
  const { error: urlError, redirectTo } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showPassword, togglePasswordVisibility] = useReducer(
    (state: boolean) => !state,
    false
  );

  // Show error message from action or URL
  useEffect(() => {
    // Check for action errors
    if (actionData?.error) {
      toast.error(actionData.error);
    }

    // Check for URL errors (from OAuth callback)
    if (urlError) {
      toast.error(urlError);
    }
  }, [actionData, urlError]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4">
      <div className="w-full rounded-2xl bg-gray-100 p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Sign in
        </h1>

        {/* Comment out for now as supabase google auth bug is not fixed */}
        <Form method="post">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <input type="hidden" name="authMethod" value="google" />
          <button
            type="submit"
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-2.5 font-medium text-gray-700 transition-all hover:bg-gray-50"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="h-5 w-5"
            />
            Continue with Google
          </button>
        </Form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-100 px-2 text-gray-500">
              Or sign in with email
            </span>
          </div>
        </div>

        <Form method="post">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full rounded-lg border-gray-300 bg-white"
              required
            />
          </div>

          <div className="mb-6">
            <div className="mb-1 flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <label className="flex items-center">
                <span className="mr-2 text-xs text-gray-500">Show</span>
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={togglePasswordVisibility}
                  className="h-3 w-3 accent-emerald-500"
                  tabIndex={-1}
                />
              </label>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="w-full rounded-lg border-gray-300 bg-white"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-emerald-500 py-2.5 font-semibold text-white transition-all hover:bg-emerald-600 disabled:opacity-70"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </Form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link
            to="/auth/signup"
            className="text-gray-600 hover:text-emerald-600 hover:underline"
          >
            No account? Create here
          </Link>
          <Link
            to="/auth/reset-password"
            className="text-gray-600 hover:text-emerald-600 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>
    </main>
  );
}
