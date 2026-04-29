import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash, Camera, X } from 'phosphor-react';
import { Button, ProductNameInput } from '../components/ui';
import { useToast } from '../components/ui';
import { useRecipes, fetchRecipeById } from '../hooks/useRecipes';
import { randomUUID } from '../lib/uuid';
import type { ProductSuggestion } from '../lib/productSuggestions';

const UNITS = ['pcs', 'g', 'kg', 'ml', 'l'] as const;

const INPUT_CLS = 'w-full h-[44px] px-4 border border-neutral-200 rounded-md bg-neutral-0 text-base font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-neutral-400';
const LABEL_CLS = 'text-sm font-medium text-neutral-700';

type IngredientDraft = {
  key: string;
  name: string;
  quantity: string;
  unit: string;
  optional: boolean;
};

type StepDraft = {
  key: string;
  instruction: string;
  imageFile: File | null;
  imagePreview: string | null;
  existingImageUrl: string | null;
};

function emptyIngredient(): IngredientDraft {
  return { key: randomUUID(), name: '', quantity: '', unit: 'pcs', optional: false };
}

function emptyStep(): StepDraft {
  return { key: randomUUID(), instruction: '', imageFile: null, imagePreview: null, existingImageUrl: null };
}

export default function CreateRecipePage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;

  const navigate = useNavigate();
  const toast = useToast();
  const { createRecipe, updateRecipe } = useRecipes();

  const [loading, setLoading] = useState(isEdit);
  const [title, setTitle] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('2');
  const [isPublic, setIsPublic] = useState(false);
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([emptyIngredient()]);
  const [steps, setSteps] = useState<StepDraft[]>([emptyStep()]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const qtyRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());
  const coverInputRef = useRef<HTMLInputElement>(null);
  const stepFileInputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());

  // Load existing recipe for edit mode
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      const recipe = await fetchRecipeById(id!);
      if (cancelled || !recipe) return;

      setTitle(recipe.title);
      setCookTime(recipe.cook_time_minutes ? String(recipe.cook_time_minutes) : '');
      setServings(String(recipe.servings));
      setIsPublic(recipe.is_public);

      if (recipe.image_url) {
        setCoverPreview(recipe.image_url);
        setExistingCoverUrl(recipe.image_url);
      }

      const sortedIngs = [...recipe.ingredients].sort((a, b) => a.sort_order - b.sort_order);
      setIngredients(
        sortedIngs.length > 0
          ? sortedIngs.map(ing => ({
              key: randomUUID(),
              name: ing.name,
              quantity: ing.quantity != null ? String(ing.quantity) : '',
              unit: ing.unit ?? 'pcs',
              optional: ing.optional,
            }))
          : [emptyIngredient()],
      );

      setSteps(
        recipe.steps.length > 0
          ? recipe.steps.map(s => ({
              key: randomUUID(),
              instruction: s.instruction,
              imageFile: null,
              imagePreview: s.image_url ?? null,
              existingImageUrl: s.image_url ?? null,
            }))
          : [emptyStep()],
      );

      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  const focusQuantity = (key: string) => {
    requestAnimationFrame(() => {
      const el = qtyRefs.current.get(key);
      el?.focus();
      el?.select();
    });
  };

  // ─── Ingredient helpers ──────────────────────────────────

  const updateIngredient = (key: string, patch: Partial<IngredientDraft>) => {
    setIngredients(prev => prev.map(i => i.key === key ? { ...i, ...patch } : i));
  };

  const removeIngredient = (key: string) => {
    setIngredients(prev => prev.filter(i => i.key !== key));
    qtyRefs.current.delete(key);
  };

  const handleSuggestion = (key: string, s: ProductSuggestion) => {
    updateIngredient(key, { name: s.name, unit: s.defaultUnit });
    focusQuantity(key);
  };

  // ─── Step helpers ────────────────────────────────────────

  const updateStep = (key: string, patch: Partial<StepDraft>) => {
    setSteps(prev => prev.map(s => s.key === key ? { ...s, ...patch } : s));
  };

  const removeStep = (key: string) => {
    setSteps(prev => prev.filter(s => s.key !== key));
    stepFileInputRefs.current.delete(key);
  };

  const handleStepPhotoSelect = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateStep(key, { imageFile: file, imagePreview: URL.createObjectURL(file), existingImageUrl: null });
  };

  // ─── Cover photo ─────────────────────────────────────────

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setExistingCoverUrl(null);
  };

  const handleRemoveCover = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCoverFile(null);
    setCoverPreview(null);
    setExistingCoverUrl(null);
  };

  // ─── Submit ──────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);

    const payload = {
      title: title.trim(),
      cook_time_minutes: cookTime ? Number(cookTime) : undefined,
      servings: servings ? Number(servings) : 2,
      is_public: isPublic,
      ingredients: ingredients
        .filter(i => i.name.trim())
        .map(i => ({
          name: i.name.trim(),
          quantity: i.quantity ? Number(i.quantity) : undefined,
          unit: i.unit !== 'pcs' ? i.unit : undefined,
          optional: i.optional,
        })),
      steps: steps
        .filter(s => s.instruction.trim())
        .map(s => ({
          instruction: s.instruction.trim(),
          imageFile: s.imageFile ?? undefined,
          existingImageUrl: s.existingImageUrl ?? undefined,
        })),
      coverImageFile: coverFile ?? undefined,
      existingCoverUrl: existingCoverUrl ?? undefined,
    };

    let result: { id: string } | null;

    if (isEdit && id) {
      result = await updateRecipe(id, payload);
    } else {
      result = await createRecipe(payload);
    }

    setSubmitting(false);

    if (!result) {
      toast(isEdit ? 'Failed to save changes' : 'Failed to save recipe', 'error');
      return;
    }

    toast(isEdit ? 'Recipe updated!' : 'Recipe created!', 'success');
    navigate(`/recipe/${result.id}`, { replace: true });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-neutral-0 pt-safe">
        <div className="flex items-center h-[56px] px-4 border-b border-neutral-100">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-neutral-700">
            <ArrowLeft size={24} />
          </button>
        </div>
        <div className="flex items-center justify-center flex-1">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-0 pt-safe">
      {/* Header */}
      <div className="flex items-center h-[56px] px-4 border-b border-neutral-100 sticky top-0 bg-neutral-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-neutral-700">
          <ArrowLeft size={24} />
        </button>
        <h1 className="ml-3 text-lg font-semibold text-neutral-900">
          {isEdit ? 'Edit Recipe' : 'New Recipe'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 flex flex-col gap-5">

          {/* Cover photo */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>
              Cover photo <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className={`relative w-full h-[160px] rounded-xl overflow-hidden transition-colors ${
                coverPreview
                  ? 'border-0'
                  : 'border-2 border-dashed border-neutral-200 active:bg-neutral-50'
              }`}
            >
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <span className="absolute bottom-2 right-2 text-xs text-white/80 font-sans">
                    Tap to change
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white active:bg-black/70"
                    aria-label="Remove cover photo"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-neutral-400">
                  <Camera size={32} weight="light" />
                  <span className="text-sm font-medium font-sans">Add cover photo</span>
                </div>
              )}
            </button>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Pasta Carbonara"
              required
              style={{ fontSize: '16px' }}
              className={INPUT_CLS}
            />
          </div>

          {/* Cook time + Servings */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={LABEL_CLS}>Cook time (min)</label>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={cookTime}
                onChange={e => setCookTime(e.target.value)}
                placeholder="0"
                onFocus={e => e.target.select()}
                style={{ fontSize: '16px' }}
                className={INPUT_CLS}
              />
            </div>
            <div className="flex flex-col gap-1.5 w-24">
              <label className={LABEL_CLS}>Serves</label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={servings}
                onChange={e => setServings(e.target.value)}
                onFocus={e => e.target.select()}
                style={{ fontSize: '16px' }}
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
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-900">Ingredients</h2>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setIngredients(prev => [...prev, emptyIngredient()])}
                className="gap-1.5"
              >
                <Plus size={14} weight="bold" />
                Add
              </Button>
            </div>

            {ingredients.map((ing, idx) => (
              <div
                key={ing.key}
                className="flex flex-col gap-2 p-3 border border-neutral-200 rounded-xl"
              >
                <ProductNameInput
                  value={ing.name}
                  onChange={v => updateIngredient(ing.key, { name: v })}
                  onSelect={s => handleSuggestion(ing.key, s)}
                  onCommit={() => focusQuantity(ing.key)}
                  label=""
                  placeholder={idx === 0 ? 'e.g. Chicken breast' : 'Ingredient name'}
                />
                <div className="flex items-center gap-2">
                  <input
                    ref={el => { qtyRefs.current.set(ing.key, el); }}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={ing.quantity}
                    onChange={e => updateIngredient(ing.key, { quantity: e.target.value })}
                    placeholder="Qty"
                    onFocus={e => e.target.select()}
                    style={{ fontSize: '16px' }}
                    className="h-[36px] w-16 px-3 border border-neutral-200 rounded-md bg-neutral-0 text-base font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-neutral-400"
                  />
                  <select
                    value={ing.unit}
                    onChange={e => updateIngredient(ing.key, { unit: e.target.value })}
                    className="h-[36px] w-20 px-2 border border-neutral-200 rounded-md bg-neutral-0 text-base font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

          </div>

          {/* Steps */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-900">Instructions</h2>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setSteps(prev => [...prev, emptyStep()])}
                className="gap-1.5"
              >
                <Plus size={14} weight="bold" />
                Add
              </Button>
            </div>

            {steps.map((step, idx) => (
              <div key={step.key} className="flex flex-col gap-2 p-3 border border-neutral-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0 font-sans">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-neutral-600 font-sans">Step {idx + 1}</span>
                  </div>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(step.key)}
                      className="p-1 text-neutral-400 active:text-red-400 transition-colors"
                      aria-label="Remove step"
                    >
                      <Trash size={16} />
                    </button>
                  )}
                </div>

                <textarea
                  value={step.instruction}
                  onChange={e => updateStep(step.key, { instruction: e.target.value })}
                  placeholder="Describe this step…"
                  rows={3}
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-md bg-neutral-0 text-base font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-neutral-400 resize-none"
                />

                {/* Step photo */}
                <input
                  type="file"
                  accept="image/*"
                  ref={el => { stepFileInputRefs.current.set(step.key, el); }}
                  onChange={e => handleStepPhotoSelect(step.key, e)}
                  className="hidden"
                />
                {step.imagePreview ? (
                  <div className="relative">
                    <img
                      src={step.imagePreview}
                      alt={`Step ${idx + 1}`}
                      className="w-full rounded-md object-cover max-h-[180px]"
                    />
                    <button
                      type="button"
                      onClick={() => updateStep(step.key, { imageFile: null, imagePreview: null, existingImageUrl: null })}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white active:bg-black/70"
                      aria-label="Remove photo"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => stepFileInputRefs.current.get(step.key)?.click()}
                    className="self-start flex items-center gap-1.5 h-[34px] px-3 text-sm text-neutral-400 hover:text-neutral-600 active:bg-neutral-50 rounded-md transition-colors font-sans"
                  >
                    <Camera size={17} />
                    Add photo
                  </button>
                )}
              </div>
            ))}

          </div>

          <Button type="submit" size="lg" fullWidth loading={submitting} className="mt-1">
            {isEdit ? 'Save Changes' : 'Save Recipe'}
          </Button>
        </div>
      </form>
    </div>
  );
}
