import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { requireAuth } from "~/services/auth.server";
import { createSupabaseServerClient } from "~/services/supabase.server";

interface LoaderData {
  user: {
    id: string;
    email?: string;
    aud?: string;
    role?: string;
    app_metadata?: Record<string, any>;
    user_metadata?: Record<string, any>;
  };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { user } = await requireAuth(request);

  return json<LoaderData>({ user });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { user } = await requireAuth(request);

  const formData = await request.formData();
  const intent = formData.get("intent");
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });

  if (intent === "save-profile") {
    const email = formData.get("email") as string;

    // Update email in auth
    const { error: authError } = await supabase.auth.updateUser({
      email,
    });

    if (authError) {
      return json({ error: authError.message }, { status: 400 });
    }

    // Update profile in database
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ email })
      .eq("id", user.id);

    if (profileError) {
      return json({ error: profileError.message }, { status: 400 });
    }

    return json({ success: true });
  }

  if (intent === "sign-out") {
    return redirect("/auth/signout");
  }

  return null;
};

export default function Profile() {
  const { user } = useLoaderData<typeof loader>();
  const [email, setEmail] = useState(user.email || "");

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4">
      {/* User Profile Header */}
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Main Content */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="md:col-span-3">
            {/* Profile Card */}
            <div className="bg-gray-100 rounded-md shadow-sm p-8">
              <div className="flex flex-col items-center mb-8">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-gray-100 flex items-center justify-center">
                    {user?.user_metadata?.avatar_url ? (
                      <img
                        src={user?.user_metadata?.avatar_url}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-14 w-14"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Change profile picture
                </button>
              </div>

              <Form method="post">
                <input type="hidden" name="intent" value="save-profile" />

                <div className="mb-6">
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={user.id}
                    readOnly
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 disabled:opacity-50"
                  />
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="text-center mb-4">
                  <button
                    type="button"
                    className="text-blue-500 text-sm hover:underline font-medium"
                  >
                    Send a password reset link to my email
                  </button>
                </div>

                <div className="text-center mb-6">
                  <button
                    type="button"
                    className="text-blue-500 text-sm hover:underline font-medium"
                  >
                    Send a delete account link to my email
                  </button>
                </div>

                <div className="flex justify-center">
                  <button
                    type="submit"
                    className="bg-green-100 text-green-800 font-medium px-6 py-2 rounded-full hover:bg-green-200"
                  >
                    Save
                  </button>
                </div>
              </Form>
            </div>

            {/* Sign Out */}
            <div className="bg-gray-100 rounded-md shadow-sm p-6 mt-6 text-center">
              <Form method="post">
                <input type="hidden" name="intent" value="sign-out" />
                <button
                  type="submit"
                  className="bg-red-100 text-red-600 font-medium px-6 py-2 rounded-full hover:bg-red-200"
                >
                  Sign out
                </button>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
