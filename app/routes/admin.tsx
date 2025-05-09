import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react"; // Removed Form
import { createSupabaseServerClient } from "~/services/supabase.server";
import type { Session } from "@supabase/supabase-js";

export const meta: MetaFunction = () => {
  return [{ title: "Admin Dashboard | Vocabulary Quiz" }];
};

type LoaderData = {
  session: Session | null;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // If no session, redirect to login
    return redirect("/login", { headers: response.headers });
  }

  // For now, any authenticated user is considered an admin
  return json({ session }, { headers: response.headers });
}

export default function AdminLayout() {
  const { session } = useLoaderData<LoaderData>();

  if (!session) {
    // This should ideally not be reached if loader redirects, but as a fallback
    return <p>You must be logged in to view this page. <Link to="/login">Login</Link></p>;
  }

  return (
    // Adjusted to work within the main layout from root.tsx
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex-grow">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Admin Dashboard</h1>
      <div className="md:flex md:space-x-6 lg:space-x-8">
        <aside className="md:w-1/4 lg:w-1/5 mb-6 md:mb-0">
          <nav className="space-y-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl">
            <Link
              to="/admin/add-word"
              className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-300"
            >
              Add New Word
            </Link>
            {/* Add other admin links here with similar styling */}
            {/* Example:
            <Link
              to="/admin/manage-users"
              className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-300"
            >
              Manage Users
            </Link>
            */}
          </nav>
        </aside>
        <div className="md:w-3/4 lg:w-4/5 bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl">
          <Outlet /> {/* Child admin routes (like add-word) will render here */}
        </div>
      </div>
    </div>
  );
}