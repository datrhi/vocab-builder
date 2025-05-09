n English-to-Image Vocabulary Builder - Project Plan

**App Name:** Vocabulary Quiz

**Tech Stack:** Remix.js, Supabase, Tailwind CSS (recommended)

**Progress Key:**
*   `[ ]` - Not Started / In Progress
*   `[x]` - Completed

---

## Phase 0: Project Setup & Foundation

*   **Supabase Setup**
    *   [x] Create a new Supabase project.
    *   [ ] **Database Schema:**
        *   [x] Design and create `words` table:
            *   `id` (uuid, pk)
            *   `word` (text, unique, not null)
            *   `definition` (text)
            *   `example_sentence` (text)
            *   `image_storage_path` (text, not null)
            *   `image_alt_text` (text)
            *   `created_at` (timestamptz)
            *   `uploader_id` (uuid, fk to `auth.users`, optional)
        *   [x] Design and create `user_word_progress` table:
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
        *   [x] Create a storage bucket (e.g., `word-images`).
        *   [x] Set up Row Level Security (RLS) for public read access to images.
        *   [x] Set up RLS for restricted uploads (e.g., authenticated users or admin role).
    *   [ ] **Supabase Auth:**
        *   [x] Enable Email/Password authentication.
        *   [ ] (Optional) Consider social logins (Google, GitHub).
    *   [ ] **RLS Policies:**
        *   [x] Implement RLS for `words` table (e.g., all authenticated users can read, specific role to write).
        *   [x] Implement RLS for `user_word_progress` (users can only access/modify their own progress).

*   **Remix.js Project Setup**
    *   [x] Initialize Remix project: `npx create-remix@latest my-vocab-app`.
    *   [x] Install Supabase client: `npm install @supabase/supabase-js @supabase/ssr`.
    *   [x] Set up environment variables (`.env`) for Supabase URL and Anon Key.
    *   [x] Create Supabase server client utility (`app/services/supabase.server.ts` or similar using `@supabase/ssr`).
    *   [x] (Optional) Install Tailwind CSS: `npm install -D tailwindcss postcss autoprefixer concurrently` and configure.
    *   [x] Generate Supabase types: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > types/supabase.ts`.

*   **Basic Authentication Flow**
    *   [x] Create `app/routes/login.tsx`:
        *   [ ] Login form UI.
        *   [ ] Action to handle Supabase `signInWithPassword`.
        *   [ ] Loader to redirect if already logged in.
    *   [x] Create `app/routes/signup.tsx`:
        *   [ ] Signup form UI.
        *   [ ] Action to handle Supabase `signUp`.
        *   [ ] Loader to redirect if already logged in.
    *   [x] Create `app/routes/logout.tsx`:
        *   [ ] Action to handle Supabase `signOut`.
    *   [x] Implement session management using cookies (handled by `@supabase/ssr`).
    *   [x] Create a root loader (`app/root.tsx`) to make user session available globally.

---

## Phase 1: Admin - Word & Image Management

*   **Admin Section Setup**
    *   [x] Define an "admin" role or mechanism (e.g., custom claim, specific user ID list). (Note: Currently, any authenticated user is considered admin for simplicity)
    *   [x] Create protected route(s) for admin functionalities.

*   **Add New Word Feature (`app/routes/admin.add-word.tsx` or similar)**
    *   [x] **UI:**
        *   [x] Form with fields: `word`, `definition`, `example_sentence`.
        *   [x] File input for image upload.
    *   [ ] **Remix Action:**
        *   [x] Handle form submission (use `unstable_parseMultipartFormData` for file).
        *   [x] Validate inputs.
        *   [x] Upload image to Supabase Storage (ensure unique file names).
        *   [x] Get the `image_storage_path` from the upload response.
        *   [x] Insert word data (including `image_storage_path`) into the `words` table in Supabase.
        *   [x] Provide success/error feedback to the admin.

*   **(Optional) List/Edit/Delete Words**
    *   [ ] Route to display all words for admin.
    *   [ ] Functionality to edit existing word details.
    *   [ ] Functionality to delete words (and their associated images from storage).

---

## Phase 2: Core Feature - Learning Mode

*   **Word Display Route (`app/routes/learn.tsx` or `app/routes/words.$wordId.tsx`)**
    *   [x] **Remix Loader:**
        *   [x] Fetch a word for the user (e.g., random, next unlearned).
        *   [x] Get the public URL for the word's image from Supabase Storage.
        *   [x] (If logged in) Fetch `user_word_progress` for this word.
    *   [x] **UI:**
        *   [x] Prominently display the image.
        *   [x] Initially hide word/details.
        *   [x] On user interaction (e.g., click, hover, button press), reveal:
            *   [x] The word.
            *   [x] Definition.
            *   [x] Example sentence.
    *   [x] **Interactions:**
        *   [x] "Next Word" button/navigation. (Reloads page, triggering new random word fetch)
        *   [x] "Mark as Learned" button:
            *   [x] **Remix Action:** Update `user_word_progress` status for the current user and word.

---

## Phase 3: Core Feature - Quiz Mode (Image to Word Guessing)

*   **Quiz Route (`app/routes/quiz.tsx`)**
    *   [x] **Remix Loader:**
        *   [x] Fetch a random word ID for the quiz (ensure user hasn't "mastered" it if tracking). (Basic random implemented)
        *   [x] Get the public URL for the word's image from Supabase Storage.
        *   [x] **Crucially: DO NOT send the actual word string to the client in the loader data for the current question.**
        *   [x] Return `{ imagePublicUrl, wordId }`.
    *   [x] **UI (`QuizCard.tsx` component recommended):** (Implemented directly in route for now)
        *   [x] Display the image.
        *   [x] Text input field for the user's guess.
        *   [x] Submit button.
        *   [x] Display 15-second timer.
    *   [x] **Client-Side Timer Logic:**
        *   [x] `useEffect` hook to manage `setInterval`/`setTimeout`.
        *   [x] Countdown from 15 seconds.
        *   [x] On timeout:
            *   [x] Disable input.
            *   [x] Auto-submit the form (or trigger action with a special "timeout" guess).
    *   [x] **Remix Action (handles guess submission):**
        *   [x] Receive `wordId` and `userGuess` from form data.
        *   [x] Fetch the correct word details (especially `word.word`) from Supabase using `wordId`.
        *   [x] Compare `userGuess` (case-insensitive, trimmed) with the correct word.
        *   [x] Update `user_word_progress` (increment `total_correct`/`total_incorrect`, `correct_in_a_row`). (Simplified update implemented)
        *   [x] Return feedback: `{ isCorrect: boolean, correctWord: string, message: string }`.
    *   [x] **UI Update Post-Guess:**
        *   [x] Display "Correct!" or "Oops, the word was: [correctWord]".
        *   [x] "Next Question" button (could reload the route or use `fetcher.load` to get new data). (Reloads page)

---

## Phase 4: UX/UI Enhancements & Polish

*   **Styling:**
    *   [x] Apply basic, clean styling (e.g., using Tailwind CSS).
    *   [x] Ensure consistent look and feel. (Applied to login, signup, admin, learn, quiz routes)
*   **Navigation:**
    *   [x] Main navigation bar (Header).
    *   [x] Links to Learn, Quiz, Login/Logout, (Admin if applicable).
*   **Responsive Design:**
    *   [x] Ensure the app is usable on different screen sizes (mobile, tablet, desktop). (Basic responsiveness via Tailwind classes and Header mobile menu)
*   **User Feedback:**
    *   [x] Loading states for data fetching. (Basic button disabling and header loading bar implemented)
    *   [x] Clear error messages (using Remix Error Boundaries and action data). (Action data used for errors; Error Boundaries not implemented yet)
    *   [ ] Toasts/notifications for actions (e.g., "Word added!").
*   **Accessibility (a11y):**
    *   [x] Use semantic HTML. (Code review indicates generally good usage)
    *   [x] Ensure images have appropriate `alt` text (from `image_alt_text` field). (Implemented with fallbacks)
    *   [x] Keyboard navigability. (Basic navigability via semantic elements and focus styles)

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
*   [x] Phase 0 In Progress / Completed.
*   [x] Phase 1 In Progress / Completed. (Core "Add Word" feature done; List/Edit/Delete is optional)
*   [x] Phase 2 Completed. (Learn route with random word fetching, image display, details reveal, and mark as learned functionality implemented)
*   [x] Phase 3 Completed. (Quiz route with loader, UI, timer, and action implemented)
*   [x] Phase 4 In Progress. (Basic styling and navigation header complete)
*   `[ ]` Phase 5 (Advanced) Considered / In Progress.
*   `[ ]` Phase 6 (Deployment) Considered / In Progress.

**Notes & Decisions:**
*   *(Add any specific decisions or thoughts here as you go)*
*   Initial image source: Manual uploads by admin.
*   Admin definition: For now, any authenticated user can access admin routes (simplify initial development, tighten later).
---