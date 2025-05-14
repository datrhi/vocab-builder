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
import { useEffect } from "react";
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

// Handle password reset request
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });

  const email = formData.get("email") as string;

  // Send password reset email
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${new URL(request.url).origin}/auth/update-password`,
  });

  if (error) {
    return json<ActionData>(
      { error: error.message },
      { headers: response.headers }
    );
  }

  return json<ActionData>(
    { success: "Password reset instructions sent to your email" },
    { headers: response.headers }
  );
}

export default function ResetPassword() {
  const { error: urlError } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

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
          Reset Password
        </h1>

        <p className="mb-6 text-center text-gray-600">
          Enter your email address and we'll send you instructions to reset your
          password.
        </p>

        <Form method="post">
          <div className="mb-6">
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-emerald-500 py-2.5 font-semibold text-white transition-all hover:bg-emerald-600 disabled:opacity-70"
          >
            {isSubmitting
              ? "Sending instructions..."
              : "Send reset instructions"}
          </button>
        </Form>

        <div className="mt-6 text-center text-sm">
          <Link
            to="/auth/signin"
            className="text-gray-600 hover:text-emerald-600 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
