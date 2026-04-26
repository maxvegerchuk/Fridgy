import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash } from 'phosphor-react';
import { Button, ProductNameInput } from '../components/ui';
import { useToast } from '../components/ui';
import { useRecipes } from '../hooks/useRecipes';
import { randomUUID } from '../lib/uuid';
import type { ProductSuggestion } from '../lib/productSuggestions';

const UNITS = ['pcs', 'g', 'kg', 'ml', 'l'] as const;

const INPUT_CLS = 'w-full h-[44px] px-4 border border-neutral-200 rounded-lg bg-neutral-0 text-base font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-neutral-400';
const LABEL_CLS = 'text-sm font-medium text-neutral-700';

type IngredientDraft = {
  key: string;
  name: string;
  quantity: string;
  unit: string;
  optional: boolean;
};

function emptyIngredient(): IngredientDraft {
  return { key: randomUUID(), name: '', quantity: '', unit: 'pcs', optional: false };
}

export default function CreateRecipePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { createRecipe } = useRecipes();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('2');
  const [isPublic, setIsPublic] = useState(false);
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([emptyIngredient()]);
  const [submitting, setSubmitting] = useState(false);

  const updateIngredient = (key: string, patch: Partial<IngredientDraft>) => {
    setIngredients(prev => prev.map(i => i.key === key ? { ...i, ...patch } : i));
  };

  const removeIngredient = (key: string) => {
    setIngredients(prev => prev.filter(i => i.key !== key));
  };

  const handleSuggestion = (key: string, s: ProductSuggestion) => {
    updateIngredient(key, { name: s.name, unit: s.defaultUnit });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const filledIngredients = ingredients.filter(i => i.name.trim());
    setSubmitting(true);

    const result = await createRecipe({
      title: title.trim(),
      description: description.trim() || undefined,
      prep_time_minutes: prepTime ? Number(prepTime) : undefined,
      cook_time_minutes: cookTime ? Number(cookTime) : undefined,
      servings: servings ? Number(servings) : 2,
      is_public: isPublic,
      ingredients: filledIngredients.map(i => ({
        name: i.name.trim(),
        quantity: i.quantity ? Number(i.quantity) : undefined,
        unit: i.unit !== 'pcs' ? i.unit : undefined,
        optional: i.optional,
      })),
    });

    setSubmitting(false);

    if (!result) {
      toast('Failed to save recipe', 'error');
      return;
    }

    toast('Recipe created!', 'success');
    navigate(`/recipe/${result.id}`, { replace: true });
  };

  return (
    <div className="flex flex-col h-full bg-neutral-0 pt-safe">
      {/* Header */}
      <div className="flex items-center h-[56px] px-4 border-b border-neutral-100 sticky top-0 bg-neutral-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-neutral-700">
          <ArrowLeft size={24} />
        </button>
        <h1 className="ml-3 text-lg font-semibold text-neutral-900">New Recipe</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 flex flex-col gap-5">

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>Title <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Pasta Carbonara"
              required
              autoFocus
              className={INPUT_CLS}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>Description <span className="text-neutral-400 font-normal">(optional)</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A short description of the recipe…"
              rows={3}
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg bg-neutral-0 text-base font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-neutral-400 resize-none"
            />
          </div>

          {/* Times & Servings */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={LABEL_CLS}>Prep (min)</label>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={prepTime}
                onChange={e => setPrepTime(e.target.value)}
                placeholder="0"
                onFocus={e => e.target.select()}
                className={INPUT_CLS}
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={LABEL_CLS}>Cook (min)</label>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={cookTime}
                onChange={e => setCookTime(e.target.value)}
                placeholder="0"
                onFocus={e => e.target.select()}
                className={INPUT_CLS}
              />
            </div>
            <div className="flex flex-col gap-1.5 w-20">
              <label className={LABEL_CLS}>Serves</label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={servings}
                onChange={e => setServings(e.target.value)}
                onFocus={e => e.target.select()}
                className={INPUT_CLS}
              />
            </div>
          </div>

          {/* Public toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isPublic ? 'bg-green-500' : 'bg-neutral-300'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </div>
            <span className="text-sm font-medium text-neutral-700">Share publicly</span>
          </label>

          {/* Ingredients */}
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-neutral-900">Ingredients</h2>

            {ingredients.map((ing, idx) => (
              <div
                key={ing.key}
                className="flex flex-col gap-2 p-3 border border-neutral-200 rounded-xl bg-neutral-0"
              >
                <ProductNameInput
                  value={ing.name}
                  onChange={v => updateIngredient(ing.key, { name: v })}
                  onSelect={s => handleSuggestion(ing.key, s)}
                  label=""
                  placeholder={idx === 0 ? 'e.g. Chicken breast' : 'Ingredient name'}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={ing.quantity}
                    onChange={e => updateIngredient(ing.key, { quantity: e.target.value })}
                    placeholder="Qty"
                    onFocus={e => e.target.select()}
                    className="h-[36px] w-16 px-3 border border-neutral-200 rounded-lg bg-neutral-0 text-base font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-neutral-400"
                  />
                  <select
                    value={ing.unit}
                    onChange={e => updateIngredient(ing.key, { unit: e.target.value })}
                    className="h-[36px] w-20 px-2 border border-neutral-200 rounded-lg bg-neutral-0 text-base font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <label className="flex items-center gap-1.5 text-sm text-neutral-500 font-sans cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={ing.optional}
                      onChange={e => updateIngredient(ing.key, { optional: e.target.checked })}
                      className="w-4 h-4 accent-green-500"
                    />
                    Optional
                  </label>
                  <button
                    type="button"
                    onClick={() => removeIngredient(ing.key)}
                    className="ml-auto p-1 text-neutral-400 active:text-red-400 transition-colors"
                    aria-label="Remove ingredient"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setIngredients(prev => [...prev, emptyIngredient()])}
              className="flex items-center gap-2 h-[44px] px-4 border border-dashed border-neutral-300 rounded-xl text-sm font-medium text-neutral-500 active:bg-neutral-50 transition-colors"
            >
              <Plus size={18} />
              Add ingredient
            </button>
          </div>

          <Button type="submit" size="lg" fullWidth loading={submitting} className="mt-1">
            Save Recipe
          </Button>
        </div>
      </form>
    </div>
  );
}
