# Fridgy — Project Specification v4.0
> Stack: Vite + React + TypeScript + Tailwind CSS + Supabase → Vercel
> Code: VS Code + Claude Code / Cursor
> Testing: iPhone via Safari (PWA) + Vercel preview
> Last updated: April 2026

---

## 1. Core Concept

Fridgy connects three things: **Shopping List → Pantry → Recipes**

**No Household concept.** Lists and Pantry are independent entities,
each with their own access control. User decides separately:
- Who can edit their shopping list
- Who can see their pantry

This means a user can share a list with a colleague without giving
them access to their home pantry.

---

## 2. Data Model — Simple Version

```
User
  ├── owns Shopping Lists (many)
  │     └── each list has its own members
  │     └── any member can add/edit/check items
  │     └── only owner can delete the list or remove members
  │
  ├── owns one Pantry
  │     └── pantry has its own members (separate from lists)
  │     └── members can view + add + delete pantry items
  │     └── only owner can invite/remove members
  │
  └── owns Recipes (many)
        └── private (only owner) or public (visible in Explore)
```

---

## 3. User Flows

### Flow 1 — Shopping List

```
Create list → add items (name + qty + category)
  ↓
Share list → copy invite link → send via iMessage/WhatsApp
  ↓
Partner opens link → joins as editor → sees list in real-time
  ↓
At store → tap checkbox "bought" → item auto-moves to owner's Pantry
  ↓
Auto-saved to Purchase History
```

**Key rule:** When item is checked off:
- Moves to the PANTRY OWNER's pantry (the person who created the pantry)
- Everyone who has pantry access sees the update
- Saved to Purchase History linked to pantry

### Flow 2 — Pantry

```
Pantry tab → see all items grouped by category
  ↓
Items came from: checked list items (auto) OR manual add
  ↓
On each pantry item:
  [+ Add to list] → pick which list → item added
  [Delete] → item removed (ran out)
  ↓
Share pantry → copy invite link → partner joins
  ↓
Now partner sees your pantry in their Pantry tab
```

### Flow 3 — Recipes (My Recipes)

```
Recipes tab → "My Recipes" segment
  ↓
Filter tabs: [Can cook ✓] [Need 1-3 🟡] [All]
  ↓
Recipe match engine compares recipe ingredients vs pantry
  ↓
Tap recipe → see ingredient list
  green = in pantry ✓
  red = missing ✗
  ↓
[Add missing to list] → 1 tap → missing items → active shopping list
  ↓
[Create Recipe] → title + ingredients + private/public toggle
```

### Flow 4 — Recipes (Explore)

```
Recipes tab → "Explore" segment
  ↓
See all public recipes from all users
Search bar: filter by title
  ↓
Tap recipe → view full recipe
  [Save to my recipes] → copy saved to your collection
  [Add missing to list] → works same as your own recipes
```

### Flow 5 — Purchase History

```
Shopping List → tap [+] → tab "Recent"
  ↓
See list of recently bought items (sorted by last_purchased_at)
  ↓
Tap any item → instantly added to current list
```

---

## 4. Screens & Navigation

### Tab Bar
```
🛒 List    🥫 Pantry    📖 Recipes    👤 Profile
```

### Screen Map
```
(auth)
├── /login
└── /register

(tabs — protected)
├── / → Shopping List
│     Bottom sheets:
│       → Add Item (name + qty + unit + category)
│       → Purchase History picker (recent items)
│       → Share List (copy invite link)
│
├── /pantry → Pantry
│     Bottom sheets:
│       → Add Item manually
│       → Share Pantry (copy invite link)
│
├── /recipes → Recipes
│     Segment: [My Recipes] [Explore]
│     My Recipes → FilterTabs: Can cook / Need 1-3 / All
│     Explore → Search bar + public recipe grid
│
└── /profile → Profile
      → My lists (manage, delete)
      → My pantry members
      → Account settings

(full screens)
├── /recipe/:id → Recipe Detail
├── /recipe/new → Create Recipe
├── /list/join/:token → Join List
└── /pantry/join/:token → Join Pantry
```

---

## 5. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Vite + React 18 | Fast, minimal config |
| Language | TypeScript strict | Type safety |
| Styling | Tailwind CSS v3 | Utility-first, mobile-first |
| Routing | React Router v6 | SPA routing |
| State | Zustand | Simple global state |
| Server state | TanStack Query v5 | Caching + sync |
| Backend | Supabase | Postgres + Auth + Realtime |
| Real-time | Supabase Realtime | Live sync |
| Auth | Supabase Auth | Email + Google OAuth |
| PWA | vite-plugin-pwa | iPhone installable |
| Deploy | Vercel ← GitHub | Push = deploy |
| Icons | Phosphor Icons | Consistent style |
| Font | Inter | Design system |

---

## 6. TypeScript Types

```typescript
// src/types/index.ts

// ─── Users ──────────────────────────────────────────────

export type Profile = {
  id: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
};

// ─── Shopping List ──────────────────────────────────────

export type ShoppingList = {
  id: string;
  owner_id: string;
  name: string;
  invite_token: string;
  created_at: string;
  updated_at: string;
};

export type ListMember = {
  id: string;
  list_id: string;
  user_id: string;
  role: 'owner' | 'editor';
  joined_at: string;
  profile?: Profile;
};

export type ListItem = {
  id: string;
  list_id: string;
  name: string;
  quantity?: number;
  unit?: string;
  category: ItemCategory;
  is_checked: boolean;
  checked_at?: string;
  added_by: string;
  created_at: string;
  updated_at: string;
};

// ─── Categories ─────────────────────────────────────────

export type ItemCategory =
  | 'vegetables' | 'fruits' | 'dairy' | 'meat'
  | 'fish' | 'bakery' | 'frozen' | 'canned'
  | 'drinks' | 'snacks' | 'household' | 'other';

export const CATEGORIES: Record<ItemCategory, { label: string; emoji: string }> = {
  vegetables: { label: 'Vegetables',   emoji: '🥦' },
  fruits:     { label: 'Fruits',       emoji: '🍎' },
  dairy:      { label: 'Dairy & Eggs', emoji: '🥛' },
  meat:       { label: 'Meat',         emoji: '🥩' },
  fish:       { label: 'Fish',         emoji: '🐟' },
  bakery:     { label: 'Bakery',       emoji: '🍞' },
  frozen:     { label: 'Frozen',       emoji: '🧊' },
  canned:     { label: 'Canned',       emoji: '🥫' },
  drinks:     { label: 'Drinks',       emoji: '🧃' },
  snacks:     { label: 'Snacks',       emoji: '🍿' },
  household:  { label: 'Household',    emoji: '🧹' },
  other:      { label: 'Other',        emoji: '📦' },
};

// ─── Pantry ─────────────────────────────────────────────

export type Pantry = {
  id: string;
  owner_id: string;             // The person who created it
  invite_token: string;
  created_at: string;
};

export type PantryMember = {
  id: string;
  pantry_id: string;
  user_id: string;
  role: 'owner' | 'editor';
  joined_at: string;
  profile?: Profile;
};

export type PantryItem = {
  id: string;
  pantry_id: string;
  name: string;
  quantity?: number;
  unit?: string;
  category: ItemCategory;
  source: 'shopping_list' | 'manual';
  added_by: string;
  created_at: string;
  updated_at: string;
};

// ─── Purchase History ───────────────────────────────────

export type PurchaseHistoryItem = {
  id: string;
  pantry_id: string;            // Linked to pantry, not list
  name: string;
  quantity?: number;
  unit?: string;
  category: ItemCategory;
  last_purchased_at: string;
  purchase_count: number;
};

// ─── Recipes ────────────────────────────────────────────

export type Recipe = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  image_url?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings: number;
  is_public: boolean;
  ingredients: RecipeIngredient[];
  created_at: string;
  author?: Pick<Profile, 'id' | 'display_name' | 'avatar_url'>;
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string;
  name: string;
  quantity?: number;
  unit?: string;
  optional: boolean;
  sort_order: number;
};

export type SavedRecipe = {
  id: string;
  user_id: string;
  original_recipe_id: string;
  recipe: Recipe;
  saved_at: string;
};

// ─── Recipe Engine ──────────────────────────────────────

export type RecipeStatus = 'ready' | 'need_few' | 'missing_many';
export type RecipeFilter = 'ready' | 'need_few' | 'all';

export type RecipeWithAvailability = Recipe & {
  status: RecipeStatus;
  missing_ingredients: RecipeIngredient[];
  available_count: number;
  total_count: number;
};
```

---

## 7. Database Schema

```sql
-- supabase/migrations/001_initial.sql

create extension if not exists "uuid-ossp";

-- ─── Profiles ───────────────────────────────────────────

create table public.profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  display_name text not null default 'User',
  avatar_url   text,
  created_at   timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'User')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Shopping Lists ─────────────────────────────────────

create table public.shopping_lists (
  id           uuid default uuid_generate_v4() primary key,
  owner_id     uuid references public.profiles(id) on delete cascade not null,
  name         text not null default 'Shopping List',
  invite_token text unique default encode(gen_random_bytes(16), 'hex') not null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table public.list_members (
  id        uuid default uuid_generate_v4() primary key,
  list_id   uuid references public.shopping_lists(id) on delete cascade,
  user_id   uuid references public.profiles(id) on delete cascade,
  role      text default 'editor' check (role in ('owner', 'editor')),
  joined_at timestamptz default now(),
  unique(list_id, user_id)
);

create table public.list_items (
  id           uuid default uuid_generate_v4() primary key,
  list_id      uuid references public.shopping_lists(id) on delete cascade,
  name         text not null,
  quantity     numeric,
  unit         text,
  category     text default 'other',
  is_checked   boolean default false,
  checked_at   timestamptz,
  added_by     uuid references public.profiles(id) on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─── Pantry ─────────────────────────────────────────────

create table public.pantries (
  id           uuid default uuid_generate_v4() primary key,
  owner_id     uuid references public.profiles(id) on delete cascade not null unique,
  invite_token text unique default encode(gen_random_bytes(16), 'hex') not null,
  created_at   timestamptz default now()
);

-- Auto-create pantry for every new user
create or replace function public.handle_new_pantry()
returns trigger as $$
begin
  insert into public.pantries (owner_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_pantry();

create table public.pantry_members (
  id         uuid default uuid_generate_v4() primary key,
  pantry_id  uuid references public.pantries(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  role       text default 'editor' check (role in ('owner', 'editor')),
  joined_at  timestamptz default now(),
  unique(pantry_id, user_id)
);

create table public.pantry_items (
  id         uuid default uuid_generate_v4() primary key,
  pantry_id  uuid references public.pantries(id) on delete cascade,
  name       text not null,
  quantity   numeric,
  unit       text,
  category   text default 'other',
  source     text default 'manual' check (source in ('shopping_list', 'manual')),
  added_by   uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Purchase History ───────────────────────────────────

create table public.purchase_history (
  id                uuid default uuid_generate_v4() primary key,
  pantry_id         uuid references public.pantries(id) on delete cascade,
  name              text not null,
  quantity          numeric,
  unit              text,
  category          text default 'other',
  last_purchased_at timestamptz default now(),
  purchase_count    integer default 1,
  unique(pantry_id, name)
);

-- ─── Auto-move checked item → Pantry + History ──────────

create or replace function public.handle_item_checked()
returns trigger as $$
declare
  v_pantry_id uuid;
  v_list_owner_id uuid;
begin
  if new.is_checked = true and old.is_checked = false then

    -- Get list owner
    select owner_id into v_list_owner_id
    from public.shopping_lists
    where id = new.list_id;

    -- Get their pantry
    select id into v_pantry_id
    from public.pantries
    where owner_id = v_list_owner_id;

    if v_pantry_id is null then
      return new;
    end if;

    -- Add to pantry (skip if already exists)
    insert into public.pantry_items
      (pantry_id, name, quantity, unit, category, source, added_by)
    values
      (v_pantry_id, new.name, new.quantity, new.unit,
       new.category, 'shopping_list', new.added_by)
    on conflict do nothing;

    -- Upsert purchase history
    insert into public.purchase_history
      (pantry_id, name, quantity, unit, category, last_purchased_at, purchase_count)
    values
      (v_pantry_id, new.name, new.quantity, new.unit, new.category, now(), 1)
    on conflict (pantry_id, name) do update set
      last_purchased_at = now(),
      purchase_count    = purchase_history.purchase_count + 1,
      quantity          = excluded.quantity,
      unit              = excluded.unit;

    -- Set checked_at timestamp
    new.checked_at = now();

  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_item_checked
  before update on public.list_items
  for each row execute procedure public.handle_item_checked();

-- ─── Recipes ────────────────────────────────────────────

create table public.recipes (
  id                uuid default uuid_generate_v4() primary key,
  user_id           uuid references public.profiles(id) on delete cascade,
  title             text not null,
  description       text,
  image_url         text,
  prep_time_minutes integer,
  cook_time_minutes integer,
  servings          integer default 2,
  is_public         boolean default false,
  created_at        timestamptz default now()
);

create table public.recipe_ingredients (
  id         uuid default uuid_generate_v4() primary key,
  recipe_id  uuid references public.recipes(id) on delete cascade,
  name       text not null,
  quantity   numeric,
  unit       text,
  optional   boolean default false,
  sort_order integer default 0
);

create table public.saved_recipes (
  id                 uuid default uuid_generate_v4() primary key,
  user_id            uuid references public.profiles(id) on delete cascade,
  original_recipe_id uuid references public.recipes(id) on delete set null,
  title              text not null,
  description        text,
  prep_time_minutes  integer,
  cook_time_minutes  integer,
  servings           integer default 2,
  is_public          boolean default false,
  saved_at           timestamptz default now(),
  unique(user_id, original_recipe_id)
);

create table public.saved_recipe_ingredients (
  id              uuid default uuid_generate_v4() primary key,
  saved_recipe_id uuid references public.saved_recipes(id) on delete cascade,
  name            text not null,
  quantity        numeric,
  unit            text,
  optional        boolean default false,
  sort_order      integer default 0
);

-- ─── Indexes ────────────────────────────────────────────

create index on public.shopping_lists(owner_id);
create index on public.list_members(list_id);
create index on public.list_members(user_id);
create index on public.list_items(list_id);
create index on public.list_items(is_checked);
create index on public.pantry_items(pantry_id);
create index on public.purchase_history(pantry_id);
create index on public.purchase_history(last_purchased_at desc);
create index on public.recipes(user_id);
create index on public.recipes(is_public) where is_public = true;
create index on public.recipe_ingredients(recipe_id);
create index on public.saved_recipes(user_id);
```

---

## 8. Row Level Security

```sql
-- Enable RLS
alter table public.profiles              enable row level security;
alter table public.shopping_lists        enable row level security;
alter table public.list_members          enable row level security;
alter table public.list_items            enable row level security;
alter table public.pantries              enable row level security;
alter table public.pantry_members        enable row level security;
alter table public.pantry_items          enable row level security;
alter table public.purchase_history      enable row level security;
alter table public.recipes               enable row level security;
alter table public.recipe_ingredients    enable row level security;
alter table public.saved_recipes         enable row level security;
alter table public.saved_recipe_ingredients enable row level security;

-- ─── Helper functions ───────────────────────────────────

create or replace function public.is_list_member(p_list_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.list_members
    where list_id = p_list_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

create or replace function public.is_pantry_member(p_pantry_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.pantry_members
    where pantry_id = p_pantry_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

create or replace function public.my_pantry_id()
returns uuid as $$
  select id from public.pantries where owner_id = auth.uid();
$$ language sql security definer stable;

-- ─── Profiles ───────────────────────────────────────────

create policy "Own profile"
  on public.profiles for all using (auth.uid() = id);

create policy "View profiles of list/pantry members"
  on public.profiles for select using (
    id in (
      select user_id from public.list_members
      where list_id in (
        select list_id from public.list_members where user_id = auth.uid()
      )
      union
      select user_id from public.pantry_members
      where pantry_id in (
        select pantry_id from public.pantry_members where user_id = auth.uid()
      )
    )
  );

-- ─── Shopping Lists ─────────────────────────────────────

create policy "View lists you are member of"
  on public.shopping_lists for select
  using (public.is_list_member(id));

create policy "Create own lists"
  on public.shopping_lists for insert
  with check (owner_id = auth.uid());

create policy "Owner can update list"
  on public.shopping_lists for update
  using (owner_id = auth.uid());

create policy "Owner can delete list"
  on public.shopping_lists for delete
  using (owner_id = auth.uid());

-- ─── List Members ───────────────────────────────────────

create policy "View members of your lists"
  on public.list_members for select
  using (public.is_list_member(list_id));

create policy "Join a list (insert self)"
  on public.list_members for insert
  with check (user_id = auth.uid());

create policy "Owner can remove members"
  on public.list_members for delete
  using (
    user_id = auth.uid() or
    list_id in (
      select id from public.shopping_lists where owner_id = auth.uid()
    )
  );

-- ─── List Items ─────────────────────────────────────────

create policy "Members access list items"
  on public.list_items for all
  using (public.is_list_member(list_id));

-- ─── Pantries ───────────────────────────────────────────

create policy "View pantry if member"
  on public.pantries for select
  using (public.is_pantry_member(id));

create policy "System creates pantry (via trigger)"
  on public.pantries for insert
  with check (owner_id = auth.uid());

-- ─── Pantry Members ─────────────────────────────────────

create policy "View members of your pantry"
  on public.pantry_members for select
  using (public.is_pantry_member(pantry_id));

create policy "Join pantry (insert self)"
  on public.pantry_members for insert
  with check (user_id = auth.uid());

create policy "Owner can remove pantry members"
  on public.pantry_members for delete
  using (
    user_id = auth.uid() or
    pantry_id in (
      select id from public.pantries where owner_id = auth.uid()
    )
  );

-- ─── Pantry Items ───────────────────────────────────────

create policy "Pantry members access items"
  on public.pantry_items for all
  using (public.is_pantry_member(pantry_id));

-- ─── Purchase History ───────────────────────────────────

create policy "Pantry members access history"
  on public.purchase_history for all
  using (public.is_pantry_member(pantry_id));

-- ─── Recipes ────────────────────────────────────────────

create policy "Own recipes full access"
  on public.recipes for all using (user_id = auth.uid());

create policy "Anyone sees public recipes"
  on public.recipes for select using (is_public = true);

create policy "Own recipe ingredients"
  on public.recipe_ingredients for all
  using (recipe_id in (
    select id from public.recipes where user_id = auth.uid()
  ));

create policy "View public recipe ingredients"
  on public.recipe_ingredients for select
  using (recipe_id in (
    select id from public.recipes where is_public = true
  ));

-- ─── Saved Recipes ──────────────────────────────────────

create policy "Own saved recipes"
  on public.saved_recipes for all using (user_id = auth.uid());

create policy "Own saved recipe ingredients"
  on public.saved_recipe_ingredients for all
  using (saved_recipe_id in (
    select id from public.saved_recipes where user_id = auth.uid()
  ));
```

---

## 9. Invite Flows

### Join Shopping List
```
1. List owner → Share button → copy link:
   https://fridgy.vercel.app/list/join/{invite_token}

2. Recipient opens link
   → if not logged in → /login?redirect=/list/join/{token}
   → after login → insert into list_members (user_id, list_id, role='editor')
   → redirect to list view
   → toast: "You joined the list! 🛒"

3. Now both see the same list in real-time
```

### Join Pantry
```
1. Pantry owner → Profile → Share Pantry → copy link:
   https://fridgy.vercel.app/pantry/join/{invite_token}

2. Recipient opens link
   → same auth flow
   → insert into pantry_members
   → redirect to Pantry tab
   → toast: "You can now see their pantry 🥫"

3. Both see the same pantry items
   Note: purchase history also visible to pantry members
```

---

## 10. Recipe Match Engine

```typescript
// src/lib/recipeEngine.ts

function normalize(name: string): string {
  return name.toLowerCase().trim().replace(/s$/, '').replace(/\s+/g, ' ');
}

export function matchRecipeToPantry(
  recipe: Recipe,
  pantryItems: PantryItem[]
): RecipeWithAvailability {
  const pantrySet = new Set(pantryItems.map(p => normalize(p.name)));
  const required = recipe.ingredients.filter(i => !i.optional);
  const missing = required.filter(i => !pantrySet.has(normalize(i.name)));

  let status: RecipeStatus;
  if (missing.length === 0) status = 'ready';
  else if (missing.length <= 3) status = 'need_few';
  else status = 'missing_many';

  return {
    ...recipe,
    status,
    missing_ingredients: missing,
    available_count: required.length - missing.length,
    total_count: required.length,
  };
}

export function getFilteredRecipes(
  recipes: Recipe[],
  pantryItems: PantryItem[],
  filter: RecipeFilter
): RecipeWithAvailability[] {
  const enriched = recipes.map(r => matchRecipeToPantry(r, pantryItems));
  if (filter === 'all') return enriched;
  if (filter === 'ready') return enriched.filter(r => r.status === 'ready');
  return enriched.filter(r => r.status === 'need_few');
}

export function getFilterCounts(
  recipes: Recipe[],
  pantryItems: PantryItem[]
): Record<RecipeFilter, number> {
  const enriched = recipes.map(r => matchRecipeToPantry(r, pantryItems));
  return {
    ready:    enriched.filter(r => r.status === 'ready').length,
    need_few: enriched.filter(r => r.status === 'need_few').length,
    all:      enriched.length,
  };
}
```

---

## 11. Realtime Sync

```typescript
// List items sync — in useShoppingList.ts
useEffect(() => {
  if (!listId) return;
  const channel = supabase
    .channel(`list-${listId}`)
    .on('postgres_changes', {
      event: '*', schema: 'public',
      table: 'list_items',
      filter: `list_id=eq.${listId}`,
    }, (payload) => {
      if (payload.eventType === 'INSERT') addItem(payload.new as ListItem);
      if (payload.eventType === 'UPDATE') updateItem(payload.new as ListItem);
      if (payload.eventType === 'DELETE') removeItem(payload.old.id);
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [listId]);

// Pantry sync — in usePantry.ts
// Same pattern: table: 'pantry_items', filter: `pantry_id=eq.${pantryId}`
```

---

## 12. Design Tokens

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          50: '#F0FAF4', 100: '#D6F2E0', 200: '#A8E0BB',
          400: '#4CAF78', 500: '#2E9E5B', 600: '#1F7D44', 700: '#145C30',
        },
        neutral: {
          0: '#FFFFFF', 50: '#F8F8F6', 100: '#F0EFEC', 200: '#E2E1DC',
          300: '#C8C7C0', 400: '#9E9D96', 500: '#6E6D68',
          700: '#3A3A36', 900: '#181816',
        },
        danger:  { 50: '#FEF2F2', 400: '#F87171', 600: '#DC2626' },
        warning: { 50: '#FFFBEB', 400: '#FBBF24', 600: '#D97706' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { sm: '8px', md: '12px', lg: '16px', xl: '20px' },
      boxShadow: {
        xs: '0 1px 2px rgba(0,0,0,0.05)',
        sm: '0 2px 8px rgba(0,0,0,0.06)',
        md: '0 4px 16px rgba(0,0,0,0.08)',
        lg: '0 8px 32px rgba(0,0,0,0.10)',
      },
    },
  },
};
```

---

## 13. iOS PWA CSS

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body { height: 100%; overflow: hidden; overscroll-behavior: none; -webkit-font-smoothing: antialiased; }
  #root { height: 100dvh; display: flex; flex-direction: column; overflow: hidden; }
  .scroll-area { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain; }
  .pt-safe { padding-top: env(safe-area-inset-top); }
  .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
}
```

---

## 14. Development Phases

### Phase 0 — Setup (Day 1)
- [ ] `npm create vite@latest fridgy -- --template react-ts`
- [ ] Install all packages
- [ ] tailwind.config.js with tokens
- [ ] globals.css with iOS rules
- [ ] All UI components: Button, Input, Badge, Checkbox, BottomSheet, SegmentControl, FilterTabs, EmptyState, Toast, Skeleton
- [ ] AppShell + TabBar (4 tabs)
- [ ] Placeholder pages for all tabs
- [ ] GitHub repo → Vercel connected → **first deploy live** ← screenshot

### Phase 1 — Auth (Day 2)
- [ ] Login / Register pages
- [ ] Supabase Auth integration
- [ ] Protected routes
- [ ] Auto-create pantry via DB trigger
- [ ] Profile page (basic)

### Phase 2 — Shopping List (Days 3–5)
- [ ] Shopping List page: items by category
- [ ] Add Item sheet: name + qty + unit + category
- [ ] Check item → auto-moves to pantry (DB trigger)
- [ ] Realtime sync: verify on two devices ← **video for case study**
- [ ] Share list: invite link → copy to clipboard
- [ ] Join List page (/list/join/:token)
- [ ] Purchase History picker in Add Item sheet

### Phase 3 — Pantry (Days 6–7)
- [ ] Pantry page: items by category
- [ ] Manual add item
- [ ] [+ Add to list] on each item
- [ ] [Delete] on each item
- [ ] Share pantry: invite link
- [ ] Join Pantry page (/pantry/join/:token)

### Phase 4 — Recipes (Days 8–11)
- [ ] Recipes tab: My Recipes + Explore segment
- [ ] My Recipes: FilterTabs + recipe cards
- [ ] Recipe match engine wired to pantry ← **key feature screenshot**
- [ ] Recipe Detail: green/red ingredient status
- [ ] [Add missing to list] → 1 tap
- [ ] Create Recipe form
- [ ] Public/private toggle
- [ ] Explore: public recipes grid
- [ ] Search by title in Explore
- [ ] [Save to my recipes] button

### Phase 5 — Polish (Days 12–14)
- [ ] Empty states for all screens
- [ ] Loading skeletons
- [ ] Toast notifications
- [ ] App icon + PWA manifest
- [ ] "Add to Home Screen" prompt
- [ ] Full flow test on real iPhone ← **final demo video**

---

## 15. Claude Code Rules

1. Tailwind only — no inline styles
2. Colors from tailwind.config only — never hardcode hex
3. Mobile-first — design for 390px (iPhone 14)
4. Touch targets minimum 44px
5. Optimistic updates — UI first, Supabase after
6. Hooks for all Supabase logic — pages stay thin
7. Clean up realtime — every subscribe() → removeChannel() on unmount
8. TypeScript strict — no `any`
9. Inter font — font-sans everywhere
10. Active states — active:scale-95 on all tappable elements
11. Safe areas — pt-safe top, pb-safe bottom
12. Phosphor icons — `import { ShoppingCart } from 'phosphor-react'`

---

## 16. Environment & Deploy

```bash
# .env.local — never commit
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

```json
// vercel.json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

**GitHub → Vercel workflow:**
```
git add . && git commit -m "feat: ..." && git push
→ Vercel detects push → deploys in ~30s → fridgy.vercel.app updated
```

---

## 17. Case Study Screenshots to Capture

| Phase | What to capture |
|---|---|
| Phase 0 | App running on iPhone Safari first time |
| Phase 0 | fridgy.vercel.app live URL |
| Phase 2 | Two phones showing same list in real-time |
| Phase 2 | Check item → appears in Pantry |
| Phase 4 | Recipe filter: "Can cook: 3, Need 1-3: 5" |
| Phase 4 | Recipe detail with green/red ingredients |
| Phase 4 | [Add missing] → items appear in list |
| Phase 5 | Fridgy icon on iPhone home screen |

---

*Fridgy v4 · Max Vegerchuk · maxvegerchuk.com · April 2026*
