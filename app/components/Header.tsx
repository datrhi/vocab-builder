import { Link, useFetcher, useNavigation } from "@remix-run/react"; // Removed useOutletContext
import type { Session } from "@supabase/supabase-js";
import { useState } from "react";

// Define props for the Header component
interface HeaderProps {
  session: Session | null;
}

export default function Header({ session }: HeaderProps) { // Accept session as a prop
  // const { session } = useOutletContext<OutletContextType>(); // Removed useOutletContext
  const user = session?.user;
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = !!user;
  const isLoading = navigation.state !== 'idle';

  return (
    <header className="bg-gray-100 dark:bg-gray-800 shadow-md sticky top-0 z-50"> {/* Made header sticky */}
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
              VocabQuiz
            </Link>
          </div>
          {/* Desktop Menu */}
          <div className="hidden sm:flex items-center space-x-2">
            <Link to="/learn" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700">
              Learn
            </Link>
            <Link to="/quiz" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700">
              Quiz
            </Link>
            {isAdmin && (
              <Link to="/admin" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700">
                Admin
              </Link>
            )}
            {user ? (
              <fetcher.Form method="post" action="/logout">
                <button
                  type="submit"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  Logout ({user.email?.split('@')[0]})
                </button>
              </fetcher.Form>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700">
                  Login
                </Link>
                <Link to="/signup" className="ml-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                  Sign Up
                </Link>
              </>
            )}
          </div>
          {/* Mobile menu button */}
          <div className="sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} sm:hidden absolute w-full bg-gray-100 dark:bg-gray-800 shadow-lg z-40 border-t border-gray-200 dark:border-gray-700`} id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link to="/learn" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => setIsMobileMenuOpen(false)}>Learn</Link>
          <Link to="/quiz" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => setIsMobileMenuOpen(false)}>Quiz</Link>
          {isAdmin && <Link to="/admin" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => setIsMobileMenuOpen(false)}>Admin</Link>}
          {user ? (
            <fetcher.Form method="post" action="/logout" onSubmit={() => setIsMobileMenuOpen(false)}>
              <button type="submit" className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700">
                Logout ({user.email?.split('@')[0]})
              </button>
            </fetcher.Form>
          ) : (
            <>
              <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
              <Link to="/signup" className="block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600" onClick={() => setIsMobileMenuOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
      
      {/* Loading bar */}
      {isLoading && (
        <div className="h-1 bg-blue-500 animate-pulse w-full"></div>
      )}
    </header>
  );
}