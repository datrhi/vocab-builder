import { json, LoaderFunctionArgs, ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, Link, Form, useNavigation, useActionData } from "@remix-run/react";
import { createSupabaseServerClient } from "~/services/supabase.server";
import type { Database } from "../../types/supabase";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState, useRef } from "react";

type Word = Database["public"]["Tables"]["words"]["Row"];

interface QuizLoaderData {
  wordId: string | null;
  imagePublicUrl: string | null;
  definition: string | null;
  partOfSpeech: string | null;
  wordToScramble: string | null;
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
  let definition: string | null = null;
  let partOfSpeech: string | null = null;
  let wordToScramble: string | null = null;
  let loaderError: string | null = null;

  const { data: allWords, error: allWordsError } = await supabase
    .from("words")
    .select("id, word, image_storage_path, definition, part_of_speech_type");

  if (allWordsError) {
    console.error("Error fetching word list for quiz:", allWordsError);
    return json({ wordId: null, imagePublicUrl: null, definition: null, partOfSpeech: null, wordToScramble: null, error: "Could not load words for quiz.", user }, { headers: response.headers });
  }

  if (!allWords || allWords.length === 0) {
    return json({ wordId: null, imagePublicUrl: null, definition: null, partOfSpeech: null, wordToScramble: null, error: "No words found for quiz. Please add some!", user }, { headers: response.headers });
  }

  const availableWords = allWords.filter(w => w.word && w.image_storage_path && w.definition && w.part_of_speech_type);

  if (availableWords.length === 0) {
     return json({ wordId: null, imagePublicUrl: null, definition: null, partOfSpeech: null, wordToScramble: null, error: "No words with all required fields (word, image, definition, part of speech) found for quiz.", user }, { headers: response.headers });
  }

  const randomIndex = Math.floor(Math.random() * availableWords.length);
  const randomWord = availableWords[randomIndex];
  wordId = randomWord.id;
  wordToScramble = randomWord.word;
  definition = randomWord.definition;
  partOfSpeech = randomWord.part_of_speech_type;

  if (randomWord.image_storage_path) {
    const { data: publicUrlData } = supabase.storage
      .from("word-images")
      .getPublicUrl(randomWord.image_storage_path);
    imagePublicUrl = publicUrlData?.publicUrl || null;

    if (!imagePublicUrl) {
        loaderError = "Could not retrieve image for the quiz word.";
        wordId = null;
        definition = null;
        partOfSpeech = null;
        wordToScramble = null;
    }
  } else {
    loaderError = "Selected quiz word does not have an image path.";
    wordId = null;
    definition = null;
    partOfSpeech = null;
    wordToScramble = null;
  }
  
  if (!wordId) {
     return json({ wordId: null, imagePublicUrl: null, definition: null, partOfSpeech: null, wordToScramble: null, error: loaderError || "Failed to prepare a quiz question.", user }, { headers: response.headers });
  }

  return json({ wordId, imagePublicUrl, definition, partOfSpeech, wordToScramble, error: loaderError, user }, { headers: response.headers });
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


// Helper function to scramble a word
const scrambleWord = (word: string): string => {
  if (!word || word.length === 0) return "";
  const letters = word.split('');
  let scrambled = '';
  // Ensure it's actually scrambled for words > 1 char
  // and doesn't accidentally produce the same word if possible
  do {
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    scrambled = letters.join('');
  } while (word.length > 1 && scrambled === word && new Set(word.split('')).size > 1); // Re-scramble if same and has unique chars
  return scrambled;
};

export default function QuizPage() {
  const { wordId, imagePublicUrl, definition, partOfSpeech, wordToScramble, error, user } = useLoaderData<QuizLoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const formRef = useRef<HTMLFormElement>(null);

  const [guess, setGuess] = useState("");
  const [scrambledWordDisplay, setScrambledWordDisplay] = useState("");

  useEffect(() => {
    if (wordToScramble) {
      setScrambledWordDisplay(scrambleWord(wordToScramble));
    } else {
      setScrambledWordDisplay("");
    }
  }, [wordToScramble]);

  useEffect(() => {
    if (wordId) {
      setGuess("");
    }
  }, [wordId]);

  useEffect(() => {
    // Reset scrambled word when a new wordId comes in (after submission or error)
    if (wordId && wordToScramble) {
      setScrambledWordDisplay(scrambleWord(wordToScramble));
    }
  }, [wordId, wordToScramble, actionData]);


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
          className="w-full h-72 object-contain rounded-lg shadow-md mb-4"
        />
        {definition && (
          <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-lg text-gray-800 dark:text-gray-200 text-center">{definition}</p>
          </div>
        )}
        {partOfSpeech && (
          <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <p className="text-sm italic text-blue-700 dark:text-blue-300 text-center">({partOfSpeech})</p>
          </div>
        )}

        {scrambledWordDisplay && (
          <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-700 rounded-lg">
            <p className="text-2xl font-bold tracking-widest text-yellow-800 dark:text-yellow-200 text-center">
              {scrambledWordDisplay.split('').join('/')}
            </p>
          </div>
        )}

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

        {(!actionData?.isCorrect !== undefined) && (
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
                disabled={isSubmitting}
                autoComplete="off" // Prevents dropdown of previous entries
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Guess"}
            </button>
          </Form>
        )}

      </div> {/* Closes the white card div */}

      {(actionData?.isCorrect !== undefined || actionData?.error) && (
         <div className="mt-6">
            <button
               onClick={() => {
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
