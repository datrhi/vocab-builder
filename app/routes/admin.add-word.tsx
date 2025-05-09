import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect, unstable_parseMultipartFormData, unstable_createMemoryUploadHandler } from "@remix-run/node";
import { Form, useActionData, useNavigation, Link } from "@remix-run/react";
import { createSupabaseServerClient } from "~/services/supabase.server";
import type { Database } from "../../types/supabase"; // Corrected path
import crypto from "crypto"; // Added for randomUUID

export const meta: MetaFunction = () => {
  return [{ title: "Add New Word | Admin" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return redirect("/login", { headers: response.headers });
  }
  // Additional admin role check could go here if not just any authenticated user
  return json(null, { headers: response.headers });
}

type ActionResponse = {
  success?: boolean;
  message?: string; // For success messages
  error?: string;
  fieldErrors?: {
    word?: string;
    image?: string;
    // other fields
  };
};

export async function action({ request }: ActionFunctionArgs): Promise<Response> {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });

  // Check for authenticated user (admin) again in action
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return redirect("/login", { headers: response.headers });
  }

  const uploadHandler = unstable_createMemoryUploadHandler({
    maxPartSize: 5 * 1024 * 1024, // 5MB limit for images
  });
  const formData = await unstable_parseMultipartFormData(request, uploadHandler);

  const word = formData.get("word") as string;
  const definition = formData.get("definition") as string | null;
  const exampleSentence = formData.get("example_sentence") as string | null;
  const imageFile = formData.get("image") as File | null;

  // --- Basic Validation ---
  if (!word) {
    return json({ error: "Word is required.", fieldErrors: { word: "Word cannot be empty."} }, { status: 400, headers: response.headers });
  }
  if (!imageFile || imageFile.size === 0) {
     return json({ error: "Image is required.", fieldErrors: { image: "Please select an image."} }, { status: 400, headers: response.headers });
  }
  // Add more validation as needed (e.g., file type, size)

  // --- File Upload to Supabase Storage ---
  const fileExt = imageFile.name.split(".").pop();
  const randomUUID = crypto.randomUUID();
  // Sanitize word for use in filename (optional, but good practice)
  const sanitizedWord = word.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const fileName = `${sanitizedWord}-${randomUUID}.${fileExt}`;
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("word-images") // Your bucket name
    .upload(fileName, imageFile, {
      cacheControl: "3600", // Optional: Cache control header
      upsert: false, // Optional: true to overwrite if file with same name exists
    });

  if (uploadError) {
    console.error("Error uploading image:", uploadError);
    return json({ error: "Failed to upload image: " + uploadError.message }, { status: 500, headers: response.headers });
  }

  if (!uploadData?.path) {
    console.error("Upload successful but no path returned");
    return json({ error: "Failed to get image path after upload." }, { status: 500, headers: response.headers });
  }
  const imageStoragePath = uploadData.path;
  console.log("Image uploaded successfully. Path:", imageStoragePath);


  // --- Insert into 'words' table ---
  const { error: dbError } = await supabase
    .from("words")
    .insert({
      word,
      definition: definition || undefined, // Use undefined if null, as Supabase might prefer that for optional fields
      example_sentence: exampleSentence || undefined,
      image_storage_path: imageStoragePath,
      uploader_id: session.user.id,
      // image_alt_text can be added here if you have a field for it in the form
    } as Database['public']['Tables']['words']['Insert']); // Type assertion for stricter type checking

  if (dbError) {
    console.error("Error inserting word:", dbError);
    // Attempt to delete the uploaded image if database insert fails
    const { error: deleteError } = await supabase.storage.from("word-images").remove([imageStoragePath]);
    if (deleteError) {
      console.error("Failed to delete orphaned image after DB error:", deleteError);
      // Potentially log this for manual cleanup
    }
    return json({ error: "Failed to add word to database: " + dbError.message }, { status: 500, headers: response.headers });
  }

  return json({ success: true, message: `Word "${word}" added successfully!` }, { headers: response.headers });
}


export default function AddWordPage() {
  const actionData = useActionData<ActionResponse>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4 sm:px-6 lg:px-8 flex-grow">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Add New Word</h1>
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl space-y-6">
        <Form method="post" encType="multipart/form-data" className="space-y-6">
          <div>
            <label htmlFor="word" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Word:
          </label>
          <input
            type="text"
            id="word"
            name="word"
            required
            className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          {actionData?.fieldErrors?.word && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{actionData.fieldErrors.word}</p>}
          </div>

        <div>
          <label htmlFor="definition" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Definition:
          </label>
          <textarea
            id="definition"
            name="definition"
            rows={3}
            className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          </div>

        <div>
          <label htmlFor="example_sentence" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Example Sentence:
          </label>
          <textarea
            id="example_sentence"
            name="example_sentence"
            rows={3}
            className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Image:
          </label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            required
            className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-lg file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300
                       hover:file:bg-blue-100 dark:hover:file:bg-blue-800 cursor-pointer"
          />
          {actionData?.fieldErrors?.image && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{actionData.fieldErrors.image}</p>}
          </div>

        {actionData?.error && !actionData.fieldErrors && (
          <p className="text-sm text-red-600 dark:text-red-400">Error: {actionData.error}</p>
        )}
        {actionData?.success && actionData.message && (
          <p className="text-sm text-green-600 dark:text-green-400">{actionData.message}</p>
        )}

        <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? "Adding Word..." : "Add Word"}
            </button>
            <Link
              to="/admin"
              className="inline-flex justify-center py-3 px-6 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Admin Dashboard
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}