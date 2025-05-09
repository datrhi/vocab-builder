import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation, Link } from "@remix-run/react"; // Added Link
import { useState, useEffect } from "react"; // Added for client-side state
import { createSupabaseServerClient } from "~/services/supabase.server"; // Ensure this path is correct
import zxcvbn, { type ZXCVBNResult } from 'zxcvbn'; // Corrected type name
import PasswordStrengthIndicator from '~/components/PasswordStrengthIndicator'; // Import the new component

export const meta: MetaFunction = () => {
  return [{ title: "Sign Up | Vocabulary Quiz" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    // If the user is already logged in, redirect them from the signup page
    return redirect("/", { headers: response.headers });
  }

  return json(null, { headers: response.headers });
}

export async function action({ request }: ActionFunctionArgs) {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });
  const formData = await request.formData();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  // Optional: Add password confirmation if desired
  const confirmPassword = String(formData.get("confirmPassword")); // Re-enabled

  if (!email || !password) {
    return json(
      { error: "Email and password are required." },
      { status: 400, headers: response.headers }
    );
  }

  // --- Password Strength Check ---
  const passwordStrength = zxcvbn(password);
  // Require a score of 3 or 4 (0, 1, 2 are too weak)
  if (passwordStrength.score < 3) {
    let feedback = "Password is too weak.";
    if (passwordStrength.feedback?.warning) {
      feedback += ` ${passwordStrength.feedback.warning}`;
    }
    if (passwordStrength.feedback?.suggestions?.length > 0) {
      feedback += ` Suggestions: ${passwordStrength.feedback.suggestions.join(' ')}`;
    }
    return json({ error: feedback }, { status: 400, headers: response.headers });
  }

  // --- Password Confirmation Check ---
  if (password !== confirmPassword) { // Re-enabled check
    return json({ error: "Passwords do not match." }, { status: 400, headers: response.headers });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // You can add options here, like redirecting after email confirmation
    options: {
      emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
    },
  });

  if (error) {
    return json(
      { error: error.message },
      { status: 400, headers: response.headers }
    );
  }

  // Check if email confirmation is required
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    // This typically means email confirmation is pending
    return json(
      { message: "Please check your email to confirm your account." },
      { headers: response.headers }
    );
  }

  // If signup is successful and no confirmation is needed, or if auto-confirmation is on.
  // Supabase client handles setting the session cookie via response headers if user is immediately active.
  // Redirect to a protected route or login page if confirmation is required and not handled above.
  // For now, let's assume successful signup (or pending confirmation) redirects to login or shows a message.
  // If Supabase auto-confirms or if you handle the session immediately, you might redirect to "/"
  // If signup is successful and auto-confirmation is off, the user will see the message from the previous check.
  // If auto-confirmation is on, the user might be logged in, but we'll still show the message for now.
  // A redirect could be added here if needed for auto-confirmation scenarios, but returning the message is safer.
  // return redirect("/login", { headers: response.headers });
  // We return the last successful state which might be the confirmation message, or handle other success cases if needed.
  // If we reach here without returning a message (e.g., auto-confirm is on and successful), return a generic success or redirect.
  // For now, let's assume the message return covers the main flow. If not, add specific handling.
  // If data.user exists and identities are present, it means signup was likely successful and auto-confirmed.
  if (data.user) {
    // Optionally redirect immediately if auto-confirmed, otherwise the message is shown.
    // return redirect("/", { headers: response.headers });
    // Let's return a generic success message if no specific confirmation message was sent.
    return json(
      { message: "Account created successfully!" },
      { headers: response.headers }
    );
  }

  // Fallback in case logic doesn't cover a state (should ideally not be reached)
  return json(
    { error: "An unexpected issue occurred during signup." },
    { status: 500, headers: response.headers }
  );
}

export default function SignupPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [password, setPassword] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState(''); // Added state for confirm password input
  const [passwordFeedback, setPasswordFeedback] = useState<ZXCVBNResult | null>(null); // Corrected type name

  useEffect(() => {
    if (password) {
      const result = zxcvbn(password);
      setPasswordFeedback(result);
    } else {
      setPasswordFeedback(null); // Clear feedback if password is empty
    }
  }, [password]);

  // Removed getStrengthColor and getStrengthText functions as they are handled in the component


  return (
    // Adjusted to work within the main layout from root.tsx
    <div className="flex flex-col items-center justify-center flex-grow p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
          Create Your VocabQuiz Account
        </h1>
        <Form method="post" className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {/* Password Strength Indicator */}
            {password && ( // Show indicator only when password is not empty
              <PasswordStrengthIndicator score={passwordFeedback?.score} />
            )}
            {/* Keep showing warnings and suggestions */}
            {password && passwordFeedback?.feedback?.warning && (
               <p className="mt-1 text-xs text-red-500">{passwordFeedback.feedback.warning}</p>
            )}
            {password && passwordFeedback?.feedback?.suggestions?.map((suggestion: string, index: number) => (
               <p key={index} className="mt-1 text-xs text-gray-500 dark:text-gray-400">{suggestion}</p>
            ))}
          </div>

          {/* Confirm password field */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={confirmPasswordValue}
              onChange={(e) => setConfirmPasswordValue(e.target.value)}
            />
            {/* Display mismatch error specifically for confirm password */}
            {password && confirmPasswordValue && password !== confirmPasswordValue && (
              <p className="mt-1 text-xs text-red-500">Passwords do not match.</p>
            )}
          </div>

          {actionData && "error" in actionData && actionData.error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {actionData.error}
            </p>
          )}
          {actionData && "message" in actionData && actionData.message && (
            <p className="text-sm text-green-600 dark:text-green-400">
              {actionData.message}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? "Creating account..." : "Sign Up"}
            </button>
          </div>
        </Form>
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
