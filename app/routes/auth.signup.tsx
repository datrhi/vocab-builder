import {
  json,
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

interface ActionData {
  error?: string;
  success?: string;
}

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

// Handle form submission and registration
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });
  const domainUrl = process.env.DOMAIN_URL;

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  // Validate passwords match
  if (password !== confirmPassword) {
    return json<ActionData>(
      { error: "Passwords do not match" },
      { headers: response.headers }
    );
  }

  // Register with email/password
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${domainUrl}/auth/callback?redirectTo=${encodeURIComponent(
        redirectTo
      )}`,
    },
  });

  if (error) {
    return json<ActionData>(
      { error: error.message },
      { headers: response.headers }
    );
  }

  return json<ActionData>(
    { success: "Please check your email to confirm your account" },
    { headers: response.headers }
  );
}

export default function SignUp() {
  const { error: urlError, redirectTo } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showPassword, togglePasswordVisibility] = useReducer(
    (state: boolean) => !state,
    false
  );

  // Show success/error messages
  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.success);
    }

    if (actionData?.error) {
      toast.error(actionData.error);
    }

    if (urlError) {
      toast.error(urlError);
    }
  }, [actionData, urlError]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4">
      <div className="w-full rounded-2xl bg-gray-100 p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Create account
        </h1>

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

          <div className="mb-4">
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
                minLength={6}
              />
            </div>
          </div>

          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              className="w-full rounded-lg border-gray-300 bg-white"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-emerald-500 py-2.5 font-semibold text-white transition-all hover:bg-emerald-600 disabled:opacity-70"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </Form>

        <div className="mt-6 text-center text-sm">
          <Link
            to="/auth/signin"
            className="text-gray-600 hover:text-emerald-600 hover:underline"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
