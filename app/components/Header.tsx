import { Link, useNavigate, useOutletContext } from "@remix-run/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Search } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { QuizLogo } from "~/components/QuizLogo";
import type { Database } from "../../types/supabase";

interface HeaderProps {
  showPin?: boolean;
  showAuth?: boolean;
  showSearch?: boolean;
  user?: { id: string; email?: string } | null;
}

type OutletContext = {
  supabase: SupabaseClient<Database>;
  env: {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
  };
  user: any;
};

export default function Header({
  showPin = true,
  showAuth = true,
  showSearch = true,
  user,
}: HeaderProps) {
  const [gamePin, setGamePin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const context = useOutletContext<OutletContext>();

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/\D/g, "");
    setGamePin(value);
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gamePin.length === 6) {
      try {
        setIsLoading(true);

        // Get Supabase client from outlet context
        const { supabase } = context;

        if (!supabase) {
          toast.error("Could not connect to database");
          return;
        }

        // Query room by pin code
        const { data: room, error } = await supabase
          .from("quiz_rooms")
          .select("id")
          .eq("pin_code", gamePin)
          .single();

        if (error || !room) {
          toast.error("Invalid room PIN");
          return;
        }

        // Navigate to the room with the PIN
        navigate(`/play/${room.id}?pin=${gamePin}`);
      } catch (error) {
        console.error("Error joining game:", error);
        toast.error("Failed to join game");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <header className="relative z-10 w-full px-4 py-3 mb-12">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link to="/" className="flex items-center">
          <QuizLogo />
        </Link>

        <div className="flex flex-1 items-center justify-center gap-2 px-4">
          {showPin && (
            <form
              onSubmit={handleJoinGame}
              className="flex w-full max-w-md items-center justify-between rounded bg-pink-200 px-4 py-2"
            >
              <span className="font-semibold text-gray-700">
                Join Game? Enter PIN:
              </span>
              <input
                type="text"
                className="ml-2 w-24 rounded-full border-0 bg-white py-1 text-center shadow-sm focus:ring-0"
                placeholder="123 456"
                maxLength={6}
                value={gamePin}
                onChange={handlePinChange}
                disabled={isLoading}
              />
            </form>
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
