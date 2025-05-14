import { Link } from "@remix-run/react";
import { Search } from "lucide-react";
import { QuizLogo } from "~/components/QuizLogo";

interface HeaderProps {
  showPin?: boolean;
  showAuth?: boolean;
  showSearch?: boolean;
  user?: { id: string; email?: string } | null;
}

export default function Header({
  showPin = true,
  showAuth = true,
  showSearch = true,
  user,
}: HeaderProps) {
  return (
    <header className="relative z-10 w-full px-4 py-3 mb-12">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link to="/" className="flex items-center">
          <QuizLogo />
        </Link>

        <div className="flex flex-1 items-center justify-center gap-2 px-4">
          {showPin && (
            <div className="flex w-full max-w-md items-center justify-between rounded bg-pink-200 px-4 py-2">
              <span className="font-semibold text-gray-700">
                Join Game? Enter PIN:
              </span>
              <input
                type="text"
                className="ml-2 w-24 rounded-full border-0 bg-white py-1 text-center shadow-sm focus:ring-0"
                placeholder="123 456"
                maxLength={6}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {showSearch && (
            <button
              className="flex items-center justify-center rounded-full bg-gray-100 p-2 text-gray-700 hover:bg-gray-200"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
          )}
          {showAuth &&
            (user ? (
              <Link
                to={`/profile`}
                className="rounded-full bg-lime-200 px-5 py-1.5 font-semibold text-gray-700 transition-all hover:bg-lime-300"
              >
                {user?.email || user.id}
              </Link>
            ) : (
              <Link
                to="/auth/signin"
                className="rounded-full bg-lime-200 px-5 py-1.5 font-semibold text-gray-700 transition-all hover:bg-lime-300"
              >
                Sign in
              </Link>
            ))}
        </div>
      </div>
    </header>
  );
}
