const UNIT_MAP: Record<string, string> = {
  liters: 'l',      liter: 'l',       l: 'l',
  milliliters: 'ml', milliliter: 'ml', ml: 'ml',
  kilograms: 'kg',  kilogram: 'kg',   kg: 'kg',  kilo: 'kg',  kilos: 'kg',
  grams: 'g',       gram: 'g',        g: 'g',
  pieces: 'pcs',    piece: 'pcs',     pcs: 'pcs', pc: 'pcs',
};

const SKIP = new Set(['of', 'a', 'the', 'and']);

export function parseVoiceInput(text: string): {
  name: string;
  quantity: number | null;
  unit: string | null;
} {
  const words = text.trim().split(/\s+/);
  let quantity: number | null = null;
  let unit: string | null = null;
  const nameWords: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const lower = words[i].toLowerCase();
    const num = parseFloat(lower);

    if (!isNaN(num) && isFinite(num) && num > 0) {
      quantity = num;
      // consume a following unit word if present
      const next = words[i + 1]?.toLowerCase();
      if (next !== undefined && UNIT_MAP[next] !== undefined) {
        unit = UNIT_MAP[next];
        i++;
      }
    } else if (UNIT_MAP[lower] !== undefined) {
      unit = UNIT_MAP[lower];
    } else if (!SKIP.has(lower)) {
      nameWords.push(words[i]);
    }
  }

  // "Eggs 12" — number spoken without a unit word defaults to pieces
  if (quantity !== null && unit === null) {
    unit = 'pcs';
  }

  const raw = nameWords.join(' ').trim();
  const name = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : text.trim();

  return { name, quantity, unit };
}
