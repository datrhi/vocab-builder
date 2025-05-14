import { Link } from "@remix-run/react";
import { useState } from "react";
import Header from "~/components/Header";

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would authenticate the user
    console.log("Authenticating...", { email, password });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background bubble-bg">
      <Header showPin={false} />

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4">
        <div className="w-full rounded-2xl bg-gray-100 p-8 shadow-sm">
          <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
            Sign in
          </h1>

          <button className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-2.5 font-medium text-gray-700 transition-all hover:bg-gray-50">
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="h-5 w-5"
            />
            Continue with Google
          </button>

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

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  />
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border-gray-300 bg-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-500 py-2.5 font-semibold text-white transition-all hover:bg-emerald-600"
            >
              Sign in
            </button>
          </form>

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
    </div>
  );
}
