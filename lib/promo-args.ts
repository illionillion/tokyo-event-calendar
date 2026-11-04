import { promoVariant, type PromoVariantId } from "@/lib/promo-selection";

export type PromoCliArgs = {
  date?: string;
  only?: PromoVariantId;
  prepareOnly: boolean;
};

/** `pnpm promo:render -- --date …` の `--` は区切りなので、値としては扱わない。 */
export function parseArgs(argv: readonly string[]): PromoCliArgs {
  const args: PromoCliArgs = { prepareOnly: false };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--") continue;
    if (token === "--prepare-only") {
      args.prepareOnly = true;
      continue;
    }
    if (token === "--date" || token === "--only") {
      const value = argv[index + 1];
      if (!value || value === "--") throw new Error(`${token} の値がありません`);
      index += 1;
      if (token === "--date") {
        args.date = value;
      } else {
        const variant = promoVariant(value);
        if (!variant) throw new Error(`--only は lt か mokumoku です: ${value}`);
        args.only = variant.id;
      }
      continue;
    }
    throw new Error(`不明な引数です: ${token}`);
  }

  return args;
}
