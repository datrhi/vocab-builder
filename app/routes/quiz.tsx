import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { User } from "@supabase/supabase-js";
import Header from "~/components/Header";
import { requireAuth } from "~/services/auth.server";

type LoaderData = {
  user: User | null;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { user } = await requireAuth(request);

  return json<LoaderData>({ user });
}

export default function AuthLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="flex min-h-screen flex-col bg-background bubble-bg">
      <Header user={user} />
      <Outlet />
    </div>
  );
}
