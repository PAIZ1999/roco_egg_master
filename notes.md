# Egg Nest Card Optimization Notes

## 1. Avatar & Layout Restructuring
- Move the `Autocomplete` name input from the right-hand column (`col-span-8`) to the left-hand column (`col-span-4`), positioning it directly under the sprite avatar.
- Center-align the text and input border inside the sprite name Autocomplete.
- Convert the type labels from text badges to circular image badges using the PNG images in `images/attributes/*.png`, and place them directly under the sprite name in the left column.
- Left column layout:
  - Row 1: Drag handle (left) and delete button (right).
  - Row 2: Large avatar container (takes up the bulk of width).
  - Row 3: Sprite name input (centered, bold).
  - Row 4: Type icon images (centered, horizontal flow).
- Right column layout:
  - Takes up `col-span-8`.
  - Removes the sprite name input from its header (so the parents config grid starts immediately, saving vertical space).

## 2. Parent Configurations & Gender Badges
- Add male and female icons/badges next to the "父方配置" and "母方配置" headers:
  - Father: "父方配置 ♂" (Mars icon in blue)
  - Mother: "母方配置 ♀" (Venus icon in pink)

## 3. Stat Icons & PNG Images Integration
Instead of custom React SVGs or Lucide icons, all six main stats (except "无") will be rendered using local PNG images located in `images/6围/`.
- **生命**: `images/6围/生命.png`
- **物攻**: `images/6围/物攻.png`
- **魔攻**: `images/6围/魔攻.png`
- **物防**: `images/6围/物防.png`
- **魔防**: `images/6围/魔防.png`
- **速度**: `images/6围/速度.png`
- **无**: Renders Lucide `Minus` component (as a gray horizontal line representing no stat).

The path is resolved through `getImagePath('images/6围/[StatName].png')` to support both Electon file:// protocol and normal web dev environments.

## 4. Parent Configuration Grid Enlargement
To make the parents config area stand out and be easier to read/edit:
- **Font size**: Increase text inside nature input and headers from `text-[10px]` to `text-xs` (or `text-[11px]`).
- **Input Padding**: Increase size of inputs and autocompletes.
- **Button Icons**: Keep `PlusCircle` and `MinusCircle` readable at `w-3.5 h-3.5`.
- **Stat Badges Size**: Resize stat circle container from `w-7 h-7` to `w-8.5 h-8.5`. Make the inner `<img>` size `w-5.5 h-5.5` to show details clearly.
- **Color styling**: Ensure gender icons `Mars` and `Venus` have vibrant, high-contrast colors matching their respective genders.
- **Grid Layout**: Maintain the responsive structure but expand the inner padding and flex gaps of the parent configuration forms.

## 5. Further Card Styling & Usability Refinement
- **Removed Nature Plus Button**: Removed the "+" button next to parents' natures (since adding multiple natures is rarely used and makes the card cluttered), leaving only the minus button if multiple natures exist.
- **Enhanced Stat Icon Contrast**: Shifted the 6-stat badge backgrounds from solid semi-transparent colors (which made PNG icons muddy) to clean white (`bg-white`) with slightly deeper colored borders and subtle shadow (`shadow-2xs`), making the color-coded PNG images highly vibrant and readable.
- **Font & Text Scaling**: Upgraded font-sizes across the card to ensure high legibility.
  - Sprite name: Enlarged to `text-sm font-black text-slate-900`.
  - Natures: Upgraded autocomplete input size to `text-sm font-bold text-slate-800` with wider padding (`py-2 px-2.5`) and larger dropdowns.
  - Selects (status, brand, limit): Changed to `text-xs font-black` with increased padding.
  - Egg Group and Nest count: Changed to `text-xs font-bold` with enlarged input sizes.
- **Export Image Nested Title**: Introduced a "我的精灵蛋窝中心" header above the grid in real-time DOM. In `handleExportLongImage`, the title text in clone DOM is dynamically replaced with "我的窝点" (similar to "我想换的蛋"), matching the requirements.

