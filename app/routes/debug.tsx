import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { LeaderboardDemo } from "~/components/LeaderboardDemo";
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
  return <LeaderboardDemo />;
}
