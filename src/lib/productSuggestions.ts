import type { ItemCategory } from '../types';

export type ProductSuggestion = {
  name: string;
  category: ItemCategory;
  defaultUnit: string;
  alternativeUnits?: string[];
};

const PRODUCTS: ProductSuggestion[] = [
  // ─── Vegetables ──────────────────────────────────────────
  { name: 'Tomato',        category: 'vegetables', defaultUnit: 'pcs', alternativeUnits: ['g', 'kg'] },
  { name: 'Carrot',        category: 'vegetables', defaultUnit: 'pcs', alternativeUnits: ['g', 'kg'] },
  { name: 'Potato',        category: 'vegetables', defaultUnit: 'kg',  alternativeUnits: ['pcs', 'g'] },
  { name: 'Onion',         category: 'vegetables', defaultUnit: 'pcs', alternativeUnits: ['kg', 'g'] },
  { name: 'Garlic',        category: 'vegetables', defaultUnit: 'pcs' },
  { name: 'Broccoli',      category: 'vegetables', defaultUnit: 'pcs', alternativeUnits: ['g'] },
  { name: 'Spinach',       category: 'vegetables', defaultUnit: 'g',   alternativeUnits: ['kg'] },
  { name: 'Cucumber',      category: 'vegetables', defaultUnit: 'pcs', alternativeUnits: ['g'] },
  { name: 'Bell pepper',   category: 'vegetables', defaultUnit: 'pcs', alternativeUnits: ['g'] },
  { name: 'Lettuce',       category: 'vegetables', defaultUnit: 'pcs' },
  { name: 'Zucchini',      category: 'vegetables', defaultUnit: 'pcs', alternativeUnits: ['g'] },
  { name: 'Mushrooms',     category: 'vegetables', defaultUnit: 'g',   alternativeUnits: ['kg'] },

  // ─── Fruits ──────────────────────────────────────────────
  { name: 'Apple',         category: 'fruits', defaultUnit: 'pcs', alternativeUnits: ['kg', 'g'] },
  { name: 'Banana',        category: 'fruits', defaultUnit: 'pcs', alternativeUnits: ['kg'] },
  { name: 'Orange',        category: 'fruits', defaultUnit: 'pcs', alternativeUnits: ['kg'] },
  { name: 'Lemon',         category: 'fruits', defaultUnit: 'pcs' },
  { name: 'Strawberry',    category: 'fruits', defaultUnit: 'g',   alternativeUnits: ['kg'] },
  { name: 'Grape',         category: 'fruits', defaultUnit: 'g',   alternativeUnits: ['kg'] },
  { name: 'Mango',         category: 'fruits', defaultUnit: 'pcs' },
  { name: 'Avocado',       category: 'fruits', defaultUnit: 'pcs' },
  { name: 'Blueberry',     category: 'fruits', defaultUnit: 'g',   alternativeUnits: ['kg'] },
  { name: 'Pear',          category: 'fruits', defaultUnit: 'pcs', alternativeUnits: ['kg'] },
  { name: 'Watermelon',    category: 'fruits', defaultUnit: 'pcs', alternativeUnits: ['kg'] },

  // ─── Dairy & Eggs ────────────────────────────────────────
  { name: 'Milk',          category: 'dairy', defaultUnit: 'l',  alternativeUnits: ['ml'] },
  { name: 'Eggs',          category: 'dairy', defaultUnit: 'pcs' },
  { name: 'Butter',        category: 'dairy', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Cheese',        category: 'dairy', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Yogurt',        category: 'dairy', defaultUnit: 'g',  alternativeUnits: ['ml'] },
  { name: 'Cream',         category: 'dairy', defaultUnit: 'ml', alternativeUnits: ['l'] },
  { name: 'Sour cream',    category: 'dairy', defaultUnit: 'g',  alternativeUnits: ['ml'] },
  { name: 'Cottage cheese',category: 'dairy', defaultUnit: 'g' },
  { name: 'Oat milk',      category: 'dairy', defaultUnit: 'l',  alternativeUnits: ['ml'] },

  // ─── Meat ────────────────────────────────────────────────
  { name: 'Chicken breast',category: 'meat', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Beef',          category: 'meat', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Pork',          category: 'meat', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Bacon',         category: 'meat', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Sausage',       category: 'meat', defaultUnit: 'pcs', alternativeUnits: ['g'] },
  { name: 'Ground beef',   category: 'meat', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Turkey',        category: 'meat', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Ham',           category: 'meat', defaultUnit: 'g',  alternativeUnits: ['kg'] },

  // ─── Fish ────────────────────────────────────────────────
  { name: 'Salmon',        category: 'fish', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Tuna',          category: 'fish', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Shrimp',        category: 'fish', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Cod',           category: 'fish', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Sardines',      category: 'fish', defaultUnit: 'pcs', alternativeUnits: ['g'] },
  { name: 'Tilapia',       category: 'fish', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Sea bass',      category: 'fish', defaultUnit: 'g',  alternativeUnits: ['kg'] },

  // ─── Bakery ──────────────────────────────────────────────
  { name: 'Bread',         category: 'bakery', defaultUnit: 'pcs' },
  { name: 'Sourdough bread', category: 'bakery', defaultUnit: 'pcs' },
  { name: 'Baguette',      category: 'bakery', defaultUnit: 'pcs' },
  { name: 'Croissant',     category: 'bakery', defaultUnit: 'pcs' },
  { name: 'Tortilla',      category: 'bakery', defaultUnit: 'pcs' },
  { name: 'Pita bread',    category: 'bakery', defaultUnit: 'pcs' },
  { name: 'Bagel',         category: 'bakery', defaultUnit: 'pcs' },

  // ─── Frozen ──────────────────────────────────────────────
  { name: 'Frozen peas',   category: 'frozen', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Frozen corn',   category: 'frozen', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Frozen pizza',  category: 'frozen', defaultUnit: 'pcs' },
  { name: 'Ice cream',     category: 'frozen', defaultUnit: 'ml', alternativeUnits: ['l'] },
  { name: 'Frozen fries',  category: 'frozen', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Frozen berries',category: 'frozen', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Frozen fish',   category: 'frozen', defaultUnit: 'g',  alternativeUnits: ['kg'] },

  // ─── Canned ──────────────────────────────────────────────
  { name: 'Tomato paste',  category: 'canned', defaultUnit: 'g',  alternativeUnits: ['ml'] },
  { name: 'Coconut milk',  category: 'canned', defaultUnit: 'ml', alternativeUnits: ['l'] },
  { name: 'Chickpeas',     category: 'canned', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Black beans',   category: 'canned', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Canned tuna',   category: 'canned', defaultUnit: 'pcs', alternativeUnits: ['g'] },
  { name: 'Canned corn',   category: 'canned', defaultUnit: 'pcs', alternativeUnits: ['g'] },
  { name: 'Olive oil',     category: 'canned', defaultUnit: 'ml', alternativeUnits: ['l'] },

  // ─── Drinks ──────────────────────────────────────────────
  { name: 'Water',          category: 'drinks', defaultUnit: 'l',  alternativeUnits: ['ml'] },
  { name: 'Orange juice',   category: 'drinks', defaultUnit: 'l',  alternativeUnits: ['ml'] },
  { name: 'Apple juice',    category: 'drinks', defaultUnit: 'l',  alternativeUnits: ['ml'] },
  { name: 'Coffee',         category: 'drinks', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Tea',            category: 'drinks', defaultUnit: 'pcs', alternativeUnits: ['g'] },
  { name: 'Sparkling water',category: 'drinks', defaultUnit: 'l',  alternativeUnits: ['ml'] },
  { name: 'Lemonade',       category: 'drinks', defaultUnit: 'l',  alternativeUnits: ['ml'] },

  // ─── Snacks ──────────────────────────────────────────────
  { name: 'Chips',          category: 'snacks', defaultUnit: 'g' },
  { name: 'Chocolate',      category: 'snacks', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Crackers',       category: 'snacks', defaultUnit: 'g',  alternativeUnits: ['pcs'] },
  { name: 'Nuts',           category: 'snacks', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Granola bar',    category: 'snacks', defaultUnit: 'pcs' },
  { name: 'Cookies',        category: 'snacks', defaultUnit: 'pcs', alternativeUnits: ['g'] },
  { name: 'Peanut butter',  category: 'snacks', defaultUnit: 'g' },
  { name: 'Popcorn',        category: 'snacks', defaultUnit: 'g' },

  // ─── Household ───────────────────────────────────────────
  { name: 'Dish soap',         category: 'household', defaultUnit: 'ml', alternativeUnits: ['l'] },
  { name: 'Laundry detergent', category: 'household', defaultUnit: 'ml', alternativeUnits: ['l', 'g'] },
  { name: 'Paper towels',      category: 'household', defaultUnit: 'pcs' },
  { name: 'Toilet paper',      category: 'household', defaultUnit: 'pcs' },
  { name: 'Trash bags',        category: 'household', defaultUnit: 'pcs' },
  { name: 'Sponge',            category: 'household', defaultUnit: 'pcs' },
  { name: 'Shampoo',           category: 'household', defaultUnit: 'ml', alternativeUnits: ['l'] },
  { name: 'Toothpaste',        category: 'household', defaultUnit: 'pcs', alternativeUnits: ['g'] },

  // ─── Other ───────────────────────────────────────────────
  { name: 'Salt',           category: 'other', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Black pepper',   category: 'other', defaultUnit: 'g' },
  { name: 'Sugar',          category: 'other', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Flour',          category: 'other', defaultUnit: 'g',  alternativeUnits: ['kg'] },
  { name: 'Honey',          category: 'other', defaultUnit: 'g',  alternativeUnits: ['ml'] },
  { name: 'Baking powder',  category: 'other', defaultUnit: 'g' },
  { name: 'Soy sauce',      category: 'other', defaultUnit: 'ml', alternativeUnits: ['l'] },
  { name: 'Vinegar',        category: 'other', defaultUnit: 'ml', alternativeUnits: ['l'] },
];

// Pre-build a lowercase index to avoid re-lowercasing on every search
const INDEX = PRODUCTS.map(p => ({ product: p, lower: p.name.toLowerCase() }));

/**
 * Returns up to 5 suggestions for a query.
 * Word-start matches (name or any inner word starts with query) rank above
 * mid-word matches, so "ch" surfaces "Chicken breast" before "Cottage cheese".
 */
export function searchProducts(query: string): ProductSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const wordStart: ProductSuggestion[] = [];
  const midWord: ProductSuggestion[] = [];

  for (const { product, lower } of INDEX) {
    if (!lower.includes(q)) continue;
    // Starts at position 0, or immediately after a space → word-start match
    const idx = lower.indexOf(q);
    if (idx === 0 || lower[idx - 1] === ' ') {
      wordStart.push(product);
    } else {
      midWord.push(product);
    }
  }

  return [...wordStart, ...midWord].slice(0, 5);
}

/** Case-insensitive exact-name lookup. */
export function getProductSuggestion(name: string): ProductSuggestion | null {
  const lower = name.trim().toLowerCase();
  return INDEX.find(({ lower: l }) => l === lower)?.product ?? null;
}
