import { json, LoaderFunctionArgs, ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, Link, Form, useNavigation, useActionData, useSubmit } from "@remix-run/react";
import { createSupabaseServerClient } from "~/services/supabase.server";
import type { Database } from "../../types/supabase";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState, useRef } from "react";

type Word = Database["public"]["Tables"]["words"]["Row"];

interface QuizLoaderData {
  wordId: string | null;
  imagePublicUrl: string | null;
  error?: string;
  user: User | null;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let wordId: string | null = null;
  let imagePublicUrl: string | null = null;
  let loaderError: string | null = null;

  const { data: allWords, error: allWordsError } = await supabase
    .from("words")
    .select("id, image_storage_path");

  if (allWordsError) {
    console.error("Error fetching word list for quiz:", allWordsError);
    return json({ wordId: null, imagePublicUrl: null, error: "Could not load words for quiz.", user }, { headers: response.headers });
  }

  if (!allWords || allWords.length === 0) {
    return json({ wordId: null, imagePublicUrl: null, error: "No words found for quiz. Please add some!", user }, { headers: response.headers });
  }

  const availableWords = allWords.filter(w => w.image_storage_path);

  if (availableWords.length === 0) {
     return json({ wordId: null, imagePublicUrl: null, error: "No words with images found for quiz.", user }, { headers: response.headers });
  }

  const randomIndex = Math.floor(Math.random() * availableWords.length);
  const randomWord = availableWords[randomIndex];
  wordId = randomWord.id;

  if (randomWord.image_storage_path) {
    const { data: publicUrlData } = supabase.storage
      .from("word-images")
      .getPublicUrl(randomWord.image_storage_path);
    imagePublicUrl = publicUrlData?.publicUrl || null;

    if (!imagePublicUrl) {
        loaderError = "Could not retrieve image for the quiz word.";
        wordId = null; 
    }
  } else {
    loaderError = "Selected quiz word does not have an image path.";
    wordId = null;
  }
  
  if (!wordId) {
     return json({ wordId: null, imagePublicUrl: null, error: loaderError || "Failed to prepare a quiz question.", user }, { headers: response.headers });
  }

  return json({ wordId, imagePublicUrl, error: loaderError, user }, { headers: response.headers });
};

interface ActionData {
  isCorrect?: boolean;
  correctWord?: string;
  message?: string;
  error?: string;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });
  const formData = await request.formData();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login", { headers: response.headers });
  }

  const submittedWordId = formData.get("wordId") as string;
  const userGuess = formData.get("userGuess") as string;

  if (!submittedWordId || typeof userGuess !== 'string') {
    return json({ error: "Missing word ID or guess." }, { status: 400, headers: response.headers });
  }

  const { data: wordDetails, error: wordError } = await supabase
    .from("words")
    .select("word, id")
    .eq("id", submittedWordId)
    .single<Pick<Word, "id" | "word">>();

  if (wordError || !wordDetails) {
    console.error("Error fetching word details for quiz action:", wordError);
    return json({ error: "Could not verify your answer." }, { status: 500, headers: response.headers });
  }

  const isCorrect = userGuess.trim().toLowerCase() === wordDetails.word.trim().toLowerCase();
  let message: string;

   const { error: progressError } = await supabase
    .from("user_word_progress")
    .upsert(
      {
        user_id: user.id,
        word_id: wordDetails.id,
        last_reviewed_at: new Date().toISOString(),
        status: isCorrect ? "learned" : "learning",
        total_correct: isCorrect ? ((await supabase.from("user_word_progress").select("total_correct").eq("user_id", user.id).eq("word_id", wordDetails.id).single()).data?.total_correct || 0) + 1 : undefined,
        total_incorrect: !isCorrect ? ((await supabase.from("user_word_progress").select("total_incorrect").eq("user_id", user.id).eq("word_id", wordDetails.id).single()).data?.total_incorrect || 0) + 1 : undefined,
      },
      { onConflict: "user_id,word_id" }
    );

  if (progressError) {
    console.error("Error updating user word progress:", progressError);
  }

  if (isCorrect) {
    message = "Correct!";
  } else {
    message = `Oops! The correct word was: ${wordDetails.word}`;
  }

  return json({ isCorrect, correctWord: wordDetails.word, message }, { headers: response.headers });
};


export default function QuizPage() {
  const { wordId, imagePublicUrl, error, user } = useLoaderData<QuizLoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isSubmitting = navigation.state === "submitting";
  const formRef = useRef<HTMLFormElement>(null);

  const [guess, setGuess] = useState("");
  const [timeLeft, setTimeLeft] = useState(15);
  const [isTimedOut, setIsTimedOut] = useState(false);

  useEffect(() => {
    if (actionData?.isCorrect !== undefined || actionData?.error || !wordId) {
      setTimeLeft(15);
      setIsTimedOut(false);
      return;
    }
    if (isTimedOut) return;
    if (timeLeft === 0) {
      setIsTimedOut(true);
      if (formRef.current && !isSubmitting) {
        const formData = new FormData(formRef.current);
        formData.append("source", "timer");
        formData.set("userGuess", guess || "_timeout_");
        submit(formData, { method: "post" });
      }
      return;
    }
    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => Math.max(0, prevTime - 1));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft, wordId, actionData, submit, guess, isTimedOut, isSubmitting]);

  useEffect(() => {
    if (wordId) {
      setGuess("");
      setTimeLeft(15);
      setIsTimedOut(false);
    }
  }, [wordId]);


  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex-grow flex flex-col items-center justify-center text-center">
        <p className="text-xl text-red-500 dark:text-red-400 mb-4">{error}</p>
        {user ? (
            <Link to="/learn" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">Try Learning Mode</Link>
        ) : (
            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">Login to Play</Link>
        )}
         <div className="mt-4">
            <Link to="/" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  if (!wordId || !imagePublicUrl) {
    return (
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex-grow flex flex-col items-center justify-center text-center">
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">Could not load a quiz question. Please try again.</p>
        <Link to="/learn" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">Try Learning Mode</Link>
         <div className="mt-4">
            <Link to="/" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-md flex-grow text-center">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Guess the Word!</h1>
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl">
        <img
          src={imagePublicUrl}
          alt="Guess this word"
          className="w-full h-72 object-contain rounded-lg shadow-md mb-6"
        />

        {!actionData?.isCorrect && actionData?.isCorrect !== undefined && (
           <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200">
              <p>{actionData.message}</p>
           </div>
        )}
        {actionData?.isCorrect && (
           <div className="mb-4 p-3 rounded-lg bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200">
              <p>{actionData.message}</p>
           </div>
        )}
        {actionData?.error && (
           <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200">
              <p>Error: {actionData.error}</p>
           </div>
        )}

        <div className="mb-6 text-2xl font-semibold text-gray-800 dark:text-gray-200">
          Time Left: <span className={timeLeft <= 5 ? "text-red-500 dark:text-red-400" : "text-green-500 dark:text-green-400"}>{timeLeft}s</span>
        </div>

        {(!actionData?.isCorrect !== undefined && !isTimedOut) && (
          <Form method="post" ref={formRef} className="space-y-4">
            <input type="hidden" name="wordId" value={wordId} />
            <input type="hidden" name="source" value="manual" />
            <div>
              <label htmlFor="userGuess" className="sr-only">Your Guess</label>
              <input
                type="text"
                name="userGuess"
                id="userGuess"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Type your guess here"
                required
                disabled={isSubmitting || isTimedOut}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || isTimedOut}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Guess"}
            </button>
          </Form>
        )}
        
        {isTimedOut && actionData?.isCorrect === undefined && !actionData?.error && (
          <p className="text-red-500 dark:text-red-400 font-semibold mt-4">Time&amp;apos;s up! Submitting your answer...</p>
        )}
      </div> {/* Closes the white card div */}

      {(actionData?.isCorrect !== undefined || actionData?.error) && (
         <div className="mt-6">
            <button
               onClick={() => {
                 setTimeLeft(15);
                 setIsTimedOut(false);
                 setGuess("");
                 window.location.reload();
               }}
               className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
               Next Question
            </button>
         </div>
      )}

       <div className="mt-8">
        <Link to="/" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
