export default function GameEnd() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-emerald-900 p-8 text-white">
      <h1 className="mb-6 text-3xl font-bold">Game Over!</h1>
      <p className="mb-8 text-xl">Thanks for playing!</p>
      <a
        href="/"
        className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
      >
        Back to Home
      </a>
    </div>
  );
}
