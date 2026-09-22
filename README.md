# 💧 DripbyAI: Open-Source AI Fashion Stylist

> **AI outfit and makeup recommendations matched to your skin tone, undertone and body shape.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38b2ac.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ecf8e.svg?logo=supabase&logoColor=white)](https://supabase.com/)

**DripbyAI** is an open-source AI personal stylist. Upload a photo (or pick your features manually) and it works out your skin tone, undertone and body shape, then recommends outfits, colors and makeup that suit you, filtered by occasion, budget and gender.

It answers the everyday styling questions people actually search for: *what colors suit my skin tone*, *what to wear for my body shape*, *warm vs cool undertone*. Under the hood it uses color analysis theory, a fashion guidelines rulebook and vision-language models via OpenRouter.

<!-- Add a screenshot or demo GIF here: ![DripbyAI AI stylist dashboard showing outfit recommendations](docs/screenshot.png) -->

### Who it is for

- **Developers** looking for a real-world React + TypeScript + Supabase reference app with auth, RLS, storage and full-text search.
- **Builders of fashion-tech, e-commerce or recommendation systems** who want a working starting point.
- **Anyone curious** about AI color analysis and body-shape styling.

---

## ✨ Key Features

### 1. 🎨 Skin Tone & Undertone Compatibility
- **Skin Tones:** Fair, Wheatish, Brown, and Intense Dark.
- **Undertones:** Warm, Cool, and Neutral color harmony matching following professional color wheel theory.
- Visual guides and diagnostic tests (Vein test, Jewelry test) to determine tone.

### 2. 📐 Body Shape Silhouettes
- **Men's Body Shapes:** Rectangle, Triangle, Inverted Triangle, Oval, and Trapezoid.
- **Women's Body Shapes:** Hourglass, Pear/Triangle, Apple/Inverted Triangle, Rectangle, Spoon, Diamond, and Oval.
- Intelligent filtering to recommend cuts and silhouettes that flatter each unique body frame based on our integrated [Fashion Guidelines](Fashion%20Guideline.md).

### 3. 🔍 Smart Search & Discovery
- **Natural Language Querying:** Search expressions like *"I want to buy a green dress"* or *"formal navy suit"*.
- **Synonym Expansion:** Built-in dictionary expands fashion terminology (e.g., `shirt` ➔ `top`, `t-shirt`, `blouse`).
- **Granular Filters:** Occasion (`office`, `party`, `casual`, `wedding`), price range sliders, gender, and sorting by price or popularity.

### 4. 👤 Multi-Profile Management
- Unique 12-character cryptographic profile ID for each style persona.
- Multiple profile support per account (dress yourself, a friend, or a partner).
- Dual profile creation methods:
  - **Manual Profile Entry:** Fine-grained selection of features.
  - **AI Photo Analysis:** Upload face close-up and full-body images for automated attribute extraction.

### 5. 💖 Personal Wishlist
- Save favorite items to a persistent profile-linked wishlist.
- Direct affiliate product purchase links.

### 6. 🛡️ Admin Console
- **Product Catalog Management:** Add, edit, activate/deactivate, and delete items.
- **User Management & Analytics:** Track user activity and total catalog valuation.
- **Audit Logging:** Immutable audit trail for all admin actions.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build & Bundler** | [Vite 5](https://vitejs.dev/) with [Terser](https://terser.org/) optimization |
| **Styling & UI** | [Tailwind CSS 3](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/) |
| **Notifications** | [React Hot Toast](https://react-hot-toast.com/) |
| **Routing** | [React Router DOM v6](https://reactrouter.com/) |
| **Backend as a Service** | [Supabase](https://supabase.com/) |
| **Database** | PostgreSQL with Row Level Security (RLS) & Trigram Search (`pg_trgm`) |
| **Authentication** | Supabase Auth (Email & Password, Session management) |
| **Object Storage** | Supabase Storage (`profile-images` bucket) |

---

## 🚀 Easiest Setup Guide (Under 3 Minutes)

Follow these steps to connect your own free Supabase database and run the project locally.

### Prerequisites
- **Node.js** `>= 18.0.0` (Tested on Node 18, 20, 22, 26)
- **npm** `>= 9.0.0`
- A free account at [Supabase.com](https://supabase.com)

---

### Step 1: Clone the Repository & Install Dependencies

```bash
# Clone repository
git clone https://github.com/projectsbynik/dripbyai.git
cd dripbyai

# Install packages
npm install
```

---

### Step 2: Configure Supabase Database (Single-Click Setup)

1. Create a new project at [database.new](https://database.new).
2. In the Supabase dashboard, navigate to the **SQL Editor** (left sidebar).
3. Open [`supabase/schema.sql`](supabase/schema.sql), copy its entire contents, paste it into the SQL Editor, and click **Run**.
   - *This creates all tables (`profiles`, `products`, `wishlists`, `admin_audit_logs`, `search_synonyms`), indexes, search RPC functions, and the `profile-images` storage bucket with proper RLS policies.*
4. *(Optional but Recommended)* Open [`supabase/seed.sql`](supabase/seed.sql), copy and run it in the SQL Editor.
   - *This instantly seeds your database with fashion search synonyms and 10+ curated sample clothing items with realistic images, prices, and body shape tags.*

---

### Step 3: Configure Environment Variables

Create your local `.env` file from the provided template:

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```
> **Where to find them:** In your Supabase Dashboard, go to **Project Settings** (gear icon) ➔ **API** ➔ Copy **Project URL** and **`anon` `public` key**.

---

### Step 4: Run the Application

```bash
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

### Step 5: (Optional) Promote an Admin Account

To access the `/admin` console:
1. Sign up for an account in your running application at [http://localhost:5173/auth](http://localhost:5173/auth).
2. Head to the **Supabase SQL Editor** and run:
   ```sql
   UPDATE auth.users
   SET is_admin = true
   WHERE email = 'your-email@example.com';
   ```
3. Refresh your app, and an **Admin** link will appear in your top navigation header!

---

### Step 6: (Optional) Connect OpenRouter AI (On the Go or via Code)

For educational experimentation, research, or real-time AI styling, you can connect an [OpenRouter](https://openrouter.ai/) API key to power photo-based skin tone, undertone, and body shape extraction. You can do this in two flexible ways:

#### Option A: On-the-Go via Admin Console (Easiest)
1. Log in with your Admin account and go to the **Admin Console** ([http://localhost:5173/admin](http://localhost:5173/admin)).
2. Scroll to the **AI Styling Engine (OpenRouter API)** section.
3. Paste your OpenRouter API Key (obtain from [openrouter.ai/keys](https://openrouter.ai/keys)) and specify any vision-capable model:
   - `meta-llama/llama-3.2-11b-vision-instruct:free` (Free)
   - `google/gemini-2.0-flash-exp:free` (Free & fast)
   - `anthropic/claude-3.5-sonnet` (High fidelity)
4. Click **Save AI Configuration**. It is saved instantly to your browser session on the fly without needing a server restart!

#### Option B: Environment / Backend Code Configuration (`.env`)
You can configure global OpenRouter credentials in your `.env` file:
```env
VITE_OPENROUTER_API_KEY=sk-or-v1-your-key-here
VITE_OPENROUTER_MODEL=meta-llama/llama-3.2-11b-vision-instruct:free
```
The codebase in [`src/lib/ai.ts`](src/lib/ai.ts) parses uploaded user images, queries the model with structured fashion theory criteria from [`Fashion Guideline.md`](Fashion%20Guideline.md), and extracts skin tones, undertones, and flattering silhouette cuts.

> **💡 Zero Configuration Required:** If no OpenRouter key is provided, DripbyAI automatically uses its built-in realistic simulation engine, allowing anyone to test and explore the full platform completely free out-of-the-box!

---

## 📁 Project Structure

```
dripbyai/
├── public/                      # Static assets & favicon
├── src/
│   ├── components/
│   │   ├── layout/              # Header, Footer, Layout, PageTransition
│   │   ├── sections/            # Landing page sections (Hero, Features, HowItWorks)
│   │   ├── ui/                  # Reusable UI primitives (Button, Card, Input, Alert, Badge)
│   │   └── AuthForm.tsx         # Sign-in & Sign-up component
│   ├── context/
│   │   └── AuthContext.tsx      # Supabase authentication provider
│   ├── lib/
│   │   ├── ai.ts                # AI analysis triggers & simulation
│   │   ├── database.types.ts    # Generated Supabase database TypeScript definitions
│   │   ├── supabase.ts          # Supabase client singleton
│   │   ├── types.ts             # Domain application interfaces
│   │   └── utils.ts             # Styling helpers, ID generator, constants
│   ├── pages/
│   │   ├── admin/               # Admin pages (ManageProducts, AddEditProduct, ManageUsers, AuditLogs)
│   │   ├── AccountSettings.tsx  # User account & password reset
│   │   ├── AdminConsole.tsx     # Admin dashboard & metrics
│   │   ├── Auth.tsx             # Authentication page
│   │   ├── CreateProfile.tsx    # Manual & AI profile wizard
│   │   ├── Dashboard.tsx        # Profile switcher & overview
│   │   ├── Landing.tsx          # Public marketing landing page
│   │   ├── ProductDetail.tsx    # Individual product view
│   │   ├── ProfileOptions.tsx   # Profile action selector
│   │   └── Search.tsx           # Smart product search & filter engine
│   ├── App.tsx                  # Main routes & lazy-loaded view definitions
│   └── main.tsx                 # React DOM entrypoint
├── supabase/
│   ├── migrations/              # Historical chronological migration scripts
│   ├── schema.sql               # Single all-in-one reproducible database schema
│   └── seed.sql                 # Sample products & search synonyms dataset
├── .env.example                 # Environment variables template
├── Fashion Guideline.md         # Comprehensive styling & color theory reference
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🧪 Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **Start Dev Server** | `npm run dev` | Runs local dev server with HMR on port 5173 |
| **Typecheck** | `npm run typecheck` | Validates TypeScript with `tsc --noEmit` |
| **Build** | `npm run build` | Compiles and minifies bundle into `dist/` |
| **Preview** | `npm run preview` | Locally serves the built production bundle |
| **Format** | `npm run format` | Runs Prettier on all source files |

---

## 🗺️ Roadmap

- [x] **Multimodal AI Integration:** Photo-based skin tone, undertone and body shape extraction via any OpenRouter vision model (simulation fallback when no key is set).
- [ ] **AI Stylist Chat:** Interactive conversational styling assistant for outfit curation.
- [ ] **Expanded Region Support:** Currency localization and regional brand feeds.
- [ ] **Virtual Wardrobe Try-On:** Generative AI preview of garments onto user profile photos.

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.
