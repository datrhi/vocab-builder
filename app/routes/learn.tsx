import { json, LoaderFunctionArgs, ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, Link, Form, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { createSupabaseServerClient } from "~/services/supabase.server";
import type { Database } from "../../types/supabase"; // Corrected import path
import type { User } from "@supabase/supabase-js";

type Word = Database["public"]["Tables"]["words"]["Row"];
type UserWordProgress = Database["public"]["Tables"]["user_word_progress"]["Row"];

interface LoaderData {
  word: Word | null;
  imageUrl: string | null;
  userWordProgress: UserWordProgress | null;
  error?: string;
  user: User | null;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response }); // Corrected function call

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let wordData: Word | null = null;
  let loaderError: string | null = null;

  // 1. Fetch all word IDs
  const { data: allWordsList, error: allWordsError } = await supabase
    .from("words")
    .select("id");

  if (allWordsError) {
    console.error("Error fetching word list:", allWordsError);
    return json({ word: null, imageUrl: null, userWordProgress: null, error: "Could not load words.", user }, { headers: response.headers });
  }

  if (!allWordsList || allWordsList.length === 0) {
    return json({ word: null, imageUrl: null, userWordProgress: null, error: "No words found in the database. Please add some!", user }, { headers: response.headers });
  }

  let availableWordIds = allWordsList.map(w => w.id);

  // 2. If user is logged in, filter out learned words
  if (user) {
    const { data: learnedProgress, error: learnedProgressError } = await supabase
      .from("user_word_progress")
      .select("word_id")
      .eq("user_id", user.id)
      .eq("status", "learned");

    if (learnedProgressError) {
      console.error("Error fetching user's learned words:", learnedProgressError);
      // Non-critical, proceed with all words if this fails
    } else if (learnedProgress && learnedProgress.length > 0) {
      const learnedIds = new Set(learnedProgress.map(p => p.word_id));
      availableWordIds = availableWordIds.filter(id => !learnedIds.has(id));
    }
  }

  // 3. Select a random word ID from available ones
  if (availableWordIds.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableWordIds.length);
    const randomWordId = availableWordIds[randomIndex];

    const { data: fetchedWord, error: fetchWordError } = await supabase
      .from("words")
      .select("*")
      .eq("id", randomWordId)
      .single(); // Use single as we expect one word

    if (fetchWordError) {
      console.error("Error fetching random word:", fetchWordError);
      loaderError = "Could not fetch a specific word.";
    } else {
      wordData = fetchedWord;
    }
  } else {
    // No available (unlearned) words
    if (user && allWordsList.length > 0) {
      loaderError = "Congratulations! You've learned all available words.";
      // Optionally, could pick a random learned word for review here
      // For now, we'll just show the message and no word.
    } else {
      // This case should be covered by the initial allWordsList check,
      // but as a fallback if availableWordIds is empty for an anonymous user.
      loaderError = "No more words to learn at the moment.";
    }
  }
  
  // If no wordData was successfully fetched (due to error or no words available)
  if (!wordData && loaderError) {
    return json({ word: null, imageUrl: null, userWordProgress: null, error: loaderError, user }, { headers: response.headers });
  }
  // Fallback if somehow wordData is null without a specific loaderError set
  if (!wordData) {
     return json({ word: null, imageUrl: null, userWordProgress: null, error: "No word could be loaded.", user }, { headers: response.headers });
  }

  let imageUrl: string | null = null;
  let userWordProgress: UserWordProgress | null = null;
  if (wordData.image_storage_path) {
    const { data: publicUrlData } = supabase.storage
      .from("word-images") // As defined in PLAN.md
      .getPublicUrl(wordData.image_storage_path);
    imageUrl = publicUrlData?.publicUrl || null;
  }

  if (user && wordData) {
    const { data: progressData, error: progressError } = await supabase
      .from("user_word_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("word_id", wordData.id)
      .maybeSingle();

    if (progressError) {
      console.error("Error fetching user word progress:", progressError);
      // Non-critical error, so we don't block the page
    } else {
      userWordProgress = progressData;
    }
  }

  return json({ word: wordData, imageUrl, userWordProgress, user, error: loaderError }, { headers: response.headers });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });
  const formData = await request.formData();
  const wordId = formData.get("wordId") as string;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login", { headers: response.headers });
  }

  if (!wordId) {
    return json({ error: "Word ID is missing." }, { status: 400, headers: response.headers });
  }

  // Upsert logic: Insert or update the progress
  const { error: upsertError } = await supabase
    .from("user_word_progress")
    .upsert({
      user_id: user.id,
      word_id: wordId,
      status: "learned", // Mark as learned
      last_reviewed_at: new Date().toISOString(),
      // correct_in_a_row, total_correct, total_incorrect will be handled by quiz
    }, { onConflict: 'user_id,word_id' });

  if (upsertError) {
    console.error("Error updating word progress:", upsertError);
    return json({ error: "Could not mark word as learned. " + upsertError.message }, { status: 500, headers: response.headers });
  }

  // Redirect to the same page to show updated status or next word (for now, just reloads)
  // Or, could return success and let client decide. For now, reload.
  return redirect("/learn", { headers: response.headers });
};


export default function LearnPage() {
  const { word, imageUrl, userWordProgress, error, user } = useLoaderData<LoaderData>();
  const [showDetails, setShowDetails] = useState(false);
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex-grow flex flex-col items-center justify-center text-center">
        <p className="text-xl text-red-500 dark:text-red-400 mb-4">{error}</p>
        <Link to="/" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">Go Home</Link>
      </div>
    );
  }

  if (!word) {
    return (
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex-grow flex flex-col items-center justify-center text-center">
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">No word to display. Admin can add words <Link to="/admin/add-word" className="text-blue-600 dark:text-blue-400 hover:underline">here</Link>.</p>
        <Link to="/" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline mt-2">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-lg flex-grow">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Learn a Word</h1>
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={word.image_alt_text || `Image for ${word.word}`}
            className="w-full h-72 object-contain rounded-lg shadow-md mb-6" // Increased height
          />
        ) : (
          <div className="w-full h-72 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-lg shadow-md mb-6">
            <p className="text-gray-500 dark:text-gray-400">No image available</p>
          </div>
        )}

        {!showDetails ? (
          <button
            onClick={() => setShowDetails(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 mb-4"
          >
            Reveal Word & Details
          </button>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-inner">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">{word.word}</h2>
          {word.definition && (
            <p className="text-lg text-gray-700 mb-2">
              <strong>Definition:</strong> {word.definition}
            </p>
          )}
          {word.example_sentence && (
            <p className="text-lg text-gray-700">
              <strong>Example:</strong> <em>{word.example_sentence}</em>
            </p>
          )}
        </div>
      )}

      {user && word && !userWordProgress?.status && showDetails && (
        <Form method="post" className="mt-4">
          <input type="hidden" name="wordId" value={word.id} />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50"
          >
            {isSubmitting ? "Marking..." : "Mark as Learned"}
          </button>
        </Form>
      )}
      {userWordProgress?.status === 'learned' && showDetails && (
         <p className="mt-4 text-center text-green-600 dark:text-green-400 font-semibold">Status: Learned!</p>
      )}

      </div> {/* Closes the white card div */}

      <div className="mt-6 space-y-4">
        <button
          onClick={() => window.location.reload()} // Simple reload for now
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          Next Word
        </button>
        <div className="text-center">
          <Link to="/" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}