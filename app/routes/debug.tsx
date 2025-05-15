import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import React from "react";
import { createSupabaseServerClient } from "~/services/supabase.server";
import type { Database } from "../../types/supabase";

type QuizRoom = Database["public"]["Tables"]["quiz_rooms"]["Row"];

interface DebugInfo {
  systemInfo: {
    date: string;
    supabaseUrl: string;
    nodeVersion: string;
    memoryUsage: NodeJS.MemoryUsage;
  };
  dbStats: {
    wordCount: number;
    categoryList: string[];
    roomCount: number;
    participantCount: number;
    recentRooms: QuizRoom[];
  };
  error?: string;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const systemInfo = {
    date: new Date().toISOString(),
    supabaseUrl: process.env.SUPABASE_URL || "Not set",
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
  };

  let dbStats = {
    wordCount: 0,
    categoryList: [] as string[],
    roomCount: 0,
    participantCount: 0,
    recentRooms: [] as QuizRoom[],
  };

  let error;

  try {
    const response = new Response();
    const supabase = createSupabaseServerClient({ request, response });

    // Get word count
    const { count: wordCount, error: wordError } = await supabase
      .from("words")
      .select("*", { count: "exact", head: true });

    if (wordError) throw new Error(`Word count error: ${wordError.message}`);

    // Get categories
    const { data: categories, error: categoryError } = await supabase
      .from("words")
      .select("category")
      .limit(100);

    if (categoryError)
      throw new Error(`Category error: ${categoryError.message}`);

    // Get room count
    const { count: roomCount, error: roomError } = await supabase
      .from("quiz_rooms")
      .select("*", { count: "exact", head: true });

    if (roomError) throw new Error(`Room count error: ${roomError.message}`);

    // Get participant count
    const { count: participantCount, error: participantError } = await supabase
      .from("quiz_participants")
      .select("*", { count: "exact", head: true });

    if (participantError)
      throw new Error(`Participant count error: ${participantError.message}`);

    // Get recent rooms
    const { data: recentRooms, error: recentRoomsError } = await supabase
      .from("quiz_rooms")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentRoomsError)
      throw new Error(`Recent rooms error: ${recentRoomsError.message}`);

    // Update dbStats with the collected data
    dbStats = {
      wordCount: wordCount || 0,
      categoryList: [...new Set(categories?.map((c) => c.category) || [])],
      roomCount: roomCount || 0,
      participantCount: participantCount || 0,
      recentRooms: recentRooms || [],
    };
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error("Debug route error:", e);
  }

  return json<DebugInfo>({ systemInfo, dbStats, error });
};

export default function DebugRoute() {
  const { systemInfo, dbStats, error } = useLoaderData<typeof loader>();

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">System Debug</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <pre className="whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      <div className="mb-6 p-4 bg-white shadow rounded">
        <h2 className="text-xl font-semibold mb-2">System Information</h2>
        <dl className="grid grid-cols-2 gap-2">
          <dt className="font-medium">Date:</dt>
          <dd>{systemInfo.date}</dd>
          <dt className="font-medium">Supabase URL:</dt>
          <dd>{systemInfo.supabaseUrl}</dd>
          <dt className="font-medium">Node Version:</dt>
          <dd>{systemInfo.nodeVersion}</dd>
        </dl>

        <h3 className="text-lg font-semibold mt-4 mb-2">Memory Usage</h3>
        <dl className="grid grid-cols-2 gap-2">
          {Object.entries(systemInfo.memoryUsage).map(([key, value]) => (
            <React.Fragment key={key}>
              <dt className="font-medium">{key}:</dt>
              <dd>{Math.round(Number(value) / (1024 * 1024))} MB</dd>
            </React.Fragment>
          ))}
        </dl>
      </div>

      <div className="mb-6 p-4 bg-white shadow rounded">
        <h2 className="text-xl font-semibold mb-2">Database Statistics</h2>
        <dl className="grid grid-cols-2 gap-2">
          <dt className="font-medium">Word Count:</dt>
          <dd>{dbStats.wordCount.toLocaleString()}</dd>
          <dt className="font-medium">Room Count:</dt>
          <dd>{dbStats.roomCount.toLocaleString()}</dd>
          <dt className="font-medium">Participant Count:</dt>
          <dd>{dbStats.participantCount.toLocaleString()}</dd>
        </dl>

        <h3 className="text-lg font-semibold mt-4 mb-2">
          Available Categories ({dbStats.categoryList.length})
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {dbStats.categoryList.map((category) => (
            <span
              key={category}
              className="px-2 py-1 bg-gray-200 rounded text-sm"
            >
              {category}
            </span>
          ))}
        </div>

        <h3 className="text-lg font-semibold mt-4 mb-2">Recent Rooms</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PIN
              </th>
              <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dbStats.recentRooms.map((room) => (
              <tr key={room.id}>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  {room.id.substring(0, 8)}...
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  {room.pin_code}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  {room.category}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  {new Date(room.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-center">
        <a
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
}
