# Svelte FireKit Starter

A comprehensive starter template for building full-stack Svelte applications with Firebase integration. This template includes authentication, blog functionality, marketing pages, and a basic app setup with sidebar navigation.

## Features

- 🔥 Firebase Authentication
- 📝 Blog system using MDsveX

- 🎨 Styling with Shadcn/Svelte
- 🛡️ Protected routes with auth guards
- 📱 Responsive design
- 📄 Pre-built marketing pages (Home, Features, Pricing, Contact)
- 🔒 Authentication flows (Sign in, Sign up, Forgot password)

## Tech Stack

- **Svelte**: 5.39.9
- **Tailwind CSS**: 4.1.14
- **Shadcn/Svelte** (bits-ui): 1.8.0
- **SvelteKit**: 2.44.0
- **Firebase**: 12.3.0
- **TypeScript**: 5.9.3

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or npm
- Firebase project

### Installation

1. Use this template by clicking "Use this template" on GitHub or fork the repository:

   ```bash
   git clone https://github.com/talha7k/svelte-firebase-starter-kit.git
   cd svelte-firebase-starter-kit
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication service and select your preferred providers
   - Create a `.env` file in the root directory:

   ```env
   PUBLIC_FIREBASE_API_KEY=your_api_key
   PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server:
   ```bash
   npm dev
   ```

## Project Structure

```
├── src/
│   ├── lib/
│   │   ├── components/     # Reusable components
│   │   ├── firebase/      # Firebase configuration
│   │   └── utils/         # Utility functions
│   ├── routes/
│   │   ├── app/          # Protected application routes
│   │   ├── auth/         # Authentication pages
│   │   ├── blog/         # Blog pages
│   │   └── +page.svelte  # Landing page
│   └── posts/            # MDsveX blog posts
├── static/               # Static assets
└── svelte.config.js      # Svelte configuration
```

## Authentication

The template includes pre-built authentication flows:

- Sign In (`/auth/signin`)
- Sign Up (`/auth/signup`)
- Forgot Password (`/auth/forgot-password`)

Protected routes are handled by the auth guard in `src/routes/app/+layout.ts`.

### Using Protected Routes

```typescript
// src/routes/app/+layout.ts
import { redirect } from "@sveltejs/kit";
import type { LayoutLoad } from "./$types";
import { getUser } from "$lib/firebase/auth";

export const load: LayoutLoad = async ({ url }) => {
  const user = await getUser();

  if (!user) {
    throw redirect(307, `/auth/signin?redirect=${url.pathname}`);
  }

  return { user };
};
```

## Blog System

The blog system uses MDsveX for Markdown processing.

### Creating a New Blog Post

1. Create a new `.md` file in `src/posts/`
2. Add frontmatter:

   ```markdown
   ---
   title: "Your Post Title"
   publishedAt: "2024-01-19"
   author: "Your Name"
   tags: ["svelte", "firebase", "typescript"]
   excerpt: "Brief description of your post"
   categories: ["Tutorial"]
   featuredImage:
     {
       url: "https://placehold.co/1200x630",
       alt: "Featured Image Alt Text",
       caption: "Image caption",
     }
   seo:
     {
       title: "SEO-optimized title",
       description: "SEO description for better search engine visibility",
       keywords: ["keyword1", "keyword2", "keyword3"],
       ogImage: "https://placehold.co/1200x630",
     }
   published: true
   ---

   Your content here...
   ```

### Code Blocks

Code blocks are supported in markdown posts:

```svelte
 <script>
   let count = 0;
 </script>

  <button onclick={() => count++}>
   Count is {count}
 </button>
```

## ShadcN Components

The template uses ShadcN for UI components. Import components from `$lib/components/ui`:

```svelte
<script>
  import { Button } from '$lib/components/ui/button';
</script>

<Button variant="default">Click me</Button>
```

## Svelte FireKit Integration

The template uses Svelte FireKit for Firebase integration. Common operations:

### Authentication

```typescript
import { firekitAuth } from "svelte-firekit";

// Sign in
await firekitAuth.signInWithEmail(email, password);

// Register
await firekitAuth.registerWithEmail(email, password, displayName);

// Sign out
await firekitAuth.logOut();

// Send password reset
await firekitAuth.sendPasswordReset(email);
```

## Deployment

1. Build the application:
   ```bash
   npm build
   ```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
# dijicrm
