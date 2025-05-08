# English-to-Image Vocabulary Builder - Project Plan

**App Name:** Vocabulary Quiz

**Tech Stack:** Remix.js, Supabase, Tailwind CSS (recommended)

**Progress Key:**
*   `[ ]` - Not Started / In Progress
*   `[x]` - Completed

---

## Phase 0: Project Setup & Foundation

*   **Supabase Setup**
    *   [ ] Create a new Supabase project.
    *   [ ] **Database Schema:**
        *   [ ] Design and create `words` table:
            *   `id` (uuid, pk)
            *   `word` (text, unique, not null)
            *   `definition` (text)
            *   `example_sentence` (text)
            *   `image_storage_path` (text, not null)
            *   `image_alt_text` (text)
            *   `created_at` (timestamptz)
            *   `uploader_id` (uuid, fk to `auth.users`, optional)
        *   [ ] Design and create `user_word_progress` table:
            *   `id` (uuid, pk)
            *   `user_id` (uuid, fk to `auth.users`, not null)
            *   `word_id` (uuid, fk to `words`, not null)
            *   `status` (enum: 'learning', 'learned', 'mastered')
            *   `last_reviewed_at` (timestamptz)
            *   `correct_in_a_row` (integer)
            *   `total_correct` (integer)
            *   `total_incorrect` (integer)
            *   (Add unique constraint on `user_id`, `word_id`)
    *   [ ] **Supabase Storage:**
        *   [ ] Create a storage bucket (e.g., `word-images`).
        *   [ ] Set up Row Level Security (RLS) for public read access to images.
        *   [ ] Set up RLS for restricted uploads (e.g., authenticated users or admin role).
    *   [ ] **Supabase Auth:**
        *   [ ] Enable Email/Password authentication.
        *   [ ] (Optional) Consider social logins (Google, GitHub).
    *   [ ] **RLS Policies:**
        *   [ ] Implement RLS for `words` table (e.g., all authenticated users can read, specific role to write).
        *   [ ] Implement RLS for `user_word_progress` (users can only access/modify their own progress).

*   **Remix.js Project Setup**
    *   [ ] Initialize Remix project: `npx create-remix@latest my-vocab-app`.
    *   [ ] Install Supabase client: `npm install @supabase/supabase-js @supabase/ssr`.
    *   [ ] Set up environment variables (`.env`) for Supabase URL and Anon Key.
    *   [ ] Create Supabase server client utility (`app/services/supabase.server.ts` or similar using `@supabase/ssr`).
    *   [ ] (Optional) Install Tailwind CSS: `npm install -D tailwindcss postcss autoprefixer concurrently` and configure.
    *   [ ] Generate Supabase types: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > types/supabase.ts`.

*   **Basic Authentication Flow**
    *   [ ] Create `app/routes/login.tsx`:
        *   [ ] Login form UI.
        *   [ ] Action to handle Supabase `signInWithPassword`.
        *   [ ] Loader to redirect if already logged in.
    *   [ ] Create `app/routes/signup.tsx`:
        *   [ ] Signup form UI.
        *   [ ] Action to handle Supabase `signUp`.
        *   [ ] Loader to redirect if already logged in.
    *   [ ] Create `app/routes/logout.tsx`:
        *   [ ] Action to handle Supabase `signOut`.
    *   [ ] Implement session management using cookies (handled by `@supabase/ssr`).
    *   [ ] Create a root loader (`app/root.tsx`) to make user session available globally.

---

## Phase 1: Admin - Word & Image Management

*   **Admin Section Setup**
    *   [ ] Define an "admin" role or mechanism (e.g., custom claim, specific user ID list).
    *   [ ] Create protected route(s) for admin functionalities.

*   **Add New Word Feature (`app/routes/admin.add-word.tsx` or similar)**
    *   [ ] **UI:**
        *   [ ] Form with fields: `word`, `definition`, `example_sentence`.
        *   [ ] File input for image upload.
    *   [ ] **Remix Action:**
        *   [ ] Handle form submission (use `unstable_parseMultipartFormData` for file).
        *   [ ] Validate inputs.
        *   [ ] Upload image to Supabase Storage (ensure unique file names).
        *   [ ] Get the `image_storage_path` from the upload response.
        *   [ ] Insert word data (including `image_storage_path`) into the `words` table in Supabase.
        *   [ ] Provide success/error feedback to the admin.

*   **(Optional) List/Edit/Delete Words**
    *   [ ] Route to display all words for admin.
    *   [ ] Functionality to edit existing word details.
    *   [ ] Functionality to delete words (and their associated images from storage).

---

## Phase 2: Core Feature - Learning Mode

*   **Word Display Route (`app/routes/learn.tsx` or `app/routes/words.$wordId.tsx`)**
    *   [ ] **Remix Loader:**
        *   [ ] Fetch a word for the user (e.g., random, next unlearned).
        *   [ ] Get the public URL for the word's image from Supabase Storage.
        *   [ ] (If logged in) Fetch `user_word_progress` for this word.
    *   [ ] **UI:**
        *   [ ] Prominently display the image.
        *   [ ] Initially hide word/details.
        *   [ ] On user interaction (e.g., click, hover, button press), reveal:
            *   The word.
            *   Definition.
            *   Example sentence.
    *   [ ] **Interactions:**
        *   [ ] "Next Word" button/navigation.
        *   [ ] "Mark as Learned" button:
            *   **Remix Action:** Update `user_word_progress` status for the current user and word.

---

## Phase 3: Core Feature - Quiz Mode (Image to Word Guessing)

*   **Quiz Route (`app/routes/quiz.tsx`)**
    *   [ ] **Remix Loader:**
        *   [ ] Fetch a random word ID for the quiz (ensure user hasn't "mastered" it if tracking).
        *   [ ] Get the public URL for the word's image from Supabase Storage.
        *   [ ] **Crucially: DO NOT send the actual word string to the client in the loader data for the current question.**
        *   [ ] Return `{ imagePublicUrl, wordId }`.
    *   [ ] **UI (`QuizCard.tsx` component recommended):**
        *   [ ] Display the image.
        *   [ ] Text input field for the user's guess.
        *   [ ] Submit button.
        *   [ ] Display 15-second timer.
    *   [ ] **Client-Side Timer Logic:**
        *   [ ] `useEffect` hook to manage `setInterval`/`setTimeout`.
        *   [ ] Countdown from 15 seconds.
        *   [ ] On timeout:
            *   Disable input.
            *   Auto-submit the form (or trigger action with a special "timeout" guess).
    *   [ ] **Remix Action (handles guess submission):**
        *   [ ] Receive `wordId` and `userGuess` from form data.
        *   [ ] Fetch the correct word details (especially `word.word`) from Supabase using `wordId`.
        *   [ ] Compare `userGuess` (case-insensitive, trimmed) with the correct word.
        *   [ ] Update `user_word_progress` (increment `total_correct`/`total_incorrect`, `correct_in_a_row`).
        *   [ ] Return feedback: `{ isCorrect: boolean, correctWord: string, message: string }`.
    *   [ ] **UI Update Post-Guess:**
        *   [ ] Display "Correct!" or "Oops, the word was: [correctWord]".
        *   [ ] "Next Question" button (could reload the route or use `fetcher.load` to get new data).

---

## Phase 4: UX/UI Enhancements & Polish

*   **Styling:**
    *   [ ] Apply basic, clean styling (e.g., using Tailwind CSS).
    *   [ ] Ensure consistent look and feel.
*   **Navigation:**
    *   [ ] Main navigation bar (Header).
    *   [ ] Links to Learn, Quiz, Login/Logout, (Admin if applicable).
*   **Responsive Design:**
    *   [ ] Ensure the app is usable on different screen sizes (mobile, tablet, desktop).
*   **User Feedback:**
    *   [ ] Loading states for data fetching.
    *   [ ] Clear error messages (using Remix Error Boundaries and action data).
    *   [ ] Toasts/notifications for actions (e.g., "Word added!").
*   **Accessibility (a11y):**
    *   [ ] Use semantic HTML.
    *   [ ] Ensure images have appropriate `alt` text (from `image_alt_text` field).
    *   [ ] Keyboard navigability.

---

## Phase 5: Advanced Features (Future Scope / Optional)

*   **Spaced Repetition System (SRS)**
    *   [ ] Implement an SRS algorithm (e.g., SM-2 based) to schedule word reviews in Learning/Quiz mode.
    *   [ ] Modify `user_word_progress` to store SRS-related data (interval, ease factor).
*   **Word Categories/Tags**
    *   [ ] Add `categories` table and a join table `word_categories`.
    *   [ ] Allow admins to assign categories to words.
    *   [ ] Allow users to filter words by category in Learn/Quiz modes.
*   **User Profiles & Statistics**
    *   [ ] Dedicated user profile page.
    *   [ ] Display learning statistics (words learned, quiz accuracy, streaks).
*   **Alternative Image Sourcing (if not manual)**
    *   [ ] Integrate with Stock Photo APIs (Unsplash, Pexels) for image suggestions.
    *   [ ] (Very Advanced) Integrate with AI Image Generation APIs (DALL-E, Midjourney).
*   **User Image Submissions & Moderation**
    *   [ ] Allow users to suggest images for words.
    *   [ ] Admin moderation queue for submitted images.
*   **Gamification**
    *   [ ] Points, badges, leaderboards.

---

## Phase 6: Deployment & Maintenance

*   **Deployment**
    *   [ ] Choose a hosting platform for Remix (Vercel, Netlify, Fly.io, etc.).
    *   [ ] Configure build settings and environment variables on the platform.
    *   [ ] Set up custom domain (optional).
*   **CI/CD (Continuous Integration / Continuous Deployment)**
    *   [ ] Set up automated builds and deployments on git push (e.g., via GitHub Actions).
*   **Monitoring & Logging**
    *   [ ] Integrate an error tracking service (Sentry, LogRocket).
*   **Database Backups**
    *   [ ] Confirm Supabase automatic backup schedule. (Supabase handles this well).
*   **Regular Maintenance**
    *   [ ] Update dependencies.
    *   [ ] Monitor performance and costs.

---

**Current Status of this Plan Document:**
*   `[x]` Plan document created.
*   `[ ]` Phase 0 In Progress / Completed.
*   `[ ]` Phase 1 In Progress / Completed.
*   `[ ]` Phase 2 In Progress / Completed.
*   `[ ]` Phase 3 In Progress / Completed.
*   `[ ]` Phase 4 In Progress / Completed.
*   `[ ]` Phase 5 (Advanced) Considered / In Progress.
*   `[ ]` Phase 6 (Deployment) Considered / In Progress.

**Notes & Decisions:**
*   *(Add any specific decisions or thoughts here as you go)*
*   Initial image source: Manual uploads by admin.
*   Admin definition: For now, any authenticated user can access admin routes (simplify initial development, tighten later).
---