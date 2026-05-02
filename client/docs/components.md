# Memoriez Frontend Component Guide

This guide covers everything you need to build pages in this codebase. It assumes the project runs locally and you are writing a new screen or feature.

All components live in `components/ui/`. All styling uses NativeWind (Tailwind CSS class names on React Native components). Never use `StyleSheet.create` for new work — write `className` strings instead.

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Design Tokens](#design-tokens)
3. [Text](#text)
4. [Button](#button)
5. [Input](#input)
6. [Card](#card)
7. [Badge](#badge)
8. [Building a Page — Full Example](#building-a-page--full-example)
9. [Rules & Common Mistakes](#rules--common-mistakes)

---

## Core Concepts

### How styling works

This project uses **NativeWind v4**, which lets you write Tailwind class names directly on React Native components:

```tsx
// Do this
<View className="flex-1 bg-background px-margin" />

// Not this
<View style={{ flex: 1, backgroundColor: '#fcf9f8', paddingHorizontal: 20 }} />
```

### Import paths

All UI components are available via the `@/` alias:

```tsx
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
```

### The `className` prop

Every component accepts a `className` prop for one-off overrides. Use it to adjust layout (margin, width, flex) from the outside. Do not use it to override colors or typography — that is what `variant` is for.

```tsx
// Good — adjusting layout from outside
<Button label="Save" className="mt-lg w-full" />

// Avoid — overriding design intent
<Button label="Save" className="bg-blue-500" />
```

---

## Design Tokens

These are the values defined in `tailwind.config.js`. Use them as class names — never hardcode hex values or pixel sizes.

### Colors

Colors follow a **semantic naming pattern**: what the color is *for*, not what it looks like.

#### Backgrounds & Surfaces

| Token | Hex | Use for |
|---|---|---|
| `background` | `#fcf9f8` | Screen/page background |
| `surface-container-lowest` | `#ffffff` | Cards, modals, elevated panels |
| `surface-container-low` | `#f6f3f2` | Input fields, subtle containers |
| `surface-container` | `#f0eded` | Grouped list backgrounds |
| `surface-container-high` | `#eae7e7` | Dividers, inactive tabs |
| `surface-variant` | `#e5e2e1` | Chip backgrounds, secondary surfaces |

Usage:
```tsx
<View className="flex-1 bg-background" />
<View className="bg-surface-container-lowest rounded-xl" />
```

#### Brand & Actions

| Token | Hex | Use for |
|---|---|---|
| `primary` | `#b71422` | Primary buttons, active icons, links |
| `on-primary` | `#ffffff` | Text/icons on top of `primary` |
| `primary-container` | `#db3237` | Hover/pressed state of primary elements |
| `primary-fixed` | `#ffdad7` | Tinted chip background (primary) |
| `secondary` | `#845400` | Secondary brand actions |
| `secondary-container` | `#feb246` | Golden hour accent surfaces |
| `tertiary` | `#005bb3` | Sky blue, map markers, info |
| `tertiary-container` | `#1a73da` | Active tertiary surfaces |

#### Text

| Token | Use for |
|---|---|
| `on-surface` | Primary body text on any surface |
| `on-surface-variant` | Placeholder text, secondary labels, captions |
| `on-primary` | Text/icons placed on a primary-colored background |
| `on-secondary` | Text/icons placed on a secondary-colored background |
| `on-tertiary` | Text/icons placed on a tertiary-colored background |
| `inverse-on-surface` | Text on dark/inverse surfaces |

#### Outline & Error

| Token | Use for |
|---|---|
| `outline` | Borders on interactive elements |
| `outline-variant` | Subtle dividers, card borders |
| `error` | Validation errors, destructive actions |
| `on-error` | Text on error-colored backgrounds |
| `error-container` | Error message background |

---

### Typography Scale

Font sizes have corresponding line heights built in. Always apply the matching `font-sans-*` weight class alongside the size.

| Token | Size | Line Height | Weight Class |
|---|---|---|---|
| `text-headline-xl` | 36px | 44px | `font-sans-extrabold` |
| `text-headline-lg` | 28px | 36px | `font-sans-bold` |
| `text-headline-md` | 22px | 28px | `font-sans-bold` |
| `text-body-lg` | 18px | 26px | `font-sans-medium` |
| `text-body-md` | 16px | 24px | `font-sans` |
| `text-body-sm` | 14px | 20px | `font-sans` |
| `text-label-md` | 12px | 16px | `font-sans-semibold` |
| `text-button` | 16px | 20px | `font-sans-semibold` |

> **Always use the `<Text>` component** instead of combining these manually. It handles weight and tracking automatically.

---

### Spacing

| Token | Value | Class examples |
|---|---|---|
| `xs` | 4px | `p-xs`, `gap-xs`, `mt-xs` |
| `sm` | 8px | `p-sm`, `gap-sm`, `mb-sm` |
| `md` | 16px | `p-md`, `px-md`, `gap-md` |
| `lg` | 24px | `p-lg`, `py-lg`, `gap-lg` |
| `xl` | 32px | `p-xl`, `mt-xl` |
| `gutter` | 16px | `px-gutter` (horizontal screen padding) |
| `margin` | 20px | `px-margin` (wider horizontal screen padding) |

Use `px-gutter` or `px-margin` on screen-level containers to stay consistent with the layout grid.

---

### Border Radius

| Token | Value | Use for |
|---|---|---|
| `rounded-sm` | 4px | Small tags, fine details |
| `rounded` | 8px | Default / generic rounding |
| `rounded-md` | 12px | Medium containers |
| `rounded-lg` | 16px | Inputs, image corners inside cards |
| `rounded-xl` | 24px | Cards, modals, large surfaces |
| `rounded-full` | 9999px | Buttons, badges, avatars, chips |

---

### Shadows

| Token | Use for |
|---|---|
| `shadow-card` | Ambient shadow on elevated cards |
| `shadow-fab` | Floating action button lift effect |

---

## Text

**File:** `components/ui/text.tsx`

The `Text` component wraps React Native's `Text` with the correct font family, size, line height, and letter spacing for each design system variant. It also defaults text color to `on-surface`.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `Variant` | `'body-md'` | Typography style |
| `className` | `string` | `''` | Extra Tailwind classes (color overrides, alignment, etc.) |
| `...TextProps` | — | — | All standard RN Text props (`numberOfLines`, `onPress`, etc.) |

### Variants

```
headline-xl  →  36px / ExtraBold  / tracking tight
headline-lg  →  28px / Bold       / tracking tight
headline-md  →  22px / Bold
body-lg      →  18px / Medium
body-md      →  16px / Regular    (default)
body-sm      →  14px / Regular
label-md     →  12px / SemiBold   / tracking wide
button       →  16px / SemiBold
```

### Usage

```tsx
import { Text } from '@/components/ui/text';

// Page title
<Text variant="headline-lg">Travel Wishlist</Text>

// Section subheading
<Text variant="headline-md">Recent Memories</Text>

// Standard paragraph
<Text variant="body-md">Nothing beats the morning light here.</Text>

// Caption / metadata
<Text variant="body-sm" className="text-on-surface-variant">
  at Tulum Beach
</Text>

// Overline / category label
<Text variant="label-md" className="text-primary">
  EXPLORE
</Text>

// Override color
<Text variant="body-md" className="text-primary">
  Join the community
</Text>

// Truncate long text
<Text variant="body-md" numberOfLines={2}>
  Some very long memory description that should be cut off...
</Text>
```

---

## Button

**File:** `components/ui/button.tsx`

Pill-shaped interactive element. Handles loading and disabled states automatically.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | required | Button text |
| `variant` | `'primary' \| 'secondary' \| 'ghost'` | `'primary'` | Visual style |
| `loading` | `boolean` | `false` | Shows spinner, disables press |
| `disabled` | `boolean` | `false` | Dims and disables press |
| `className` | `string` | `''` | Layout overrides (width, margin) |
| `...TouchableOpacityProps` | — | — | `onPress`, `testID`, etc. |

### Variants

| Variant | Background | Text | Border | Use for |
|---|---|---|---|---|
| `primary` | `#b71422` (red) | White | None | Main CTA — Sign In, Save, Submit |
| `secondary` | White | Dark | `outline-variant` | Secondary actions — Cancel, Back |
| `ghost` | Transparent | `#b71422` (red) | None | Inline links — Forgot?, Manage |

### Usage

```tsx
import { Button } from '@/components/ui/button';

// Primary — full width CTA
<Button label="Sign In" onPress={handleSignIn} className="w-full" />

// Primary — loading state during async operation
<Button label="Saving..." loading={isSaving} onPress={handleSave} />

// Primary — disabled
<Button label="Continue" disabled={!isFormValid} onPress={handleContinue} />

// Secondary — alongside a primary button
<View className="flex-row gap-sm">
  <Button label="Cancel" variant="secondary" onPress={onCancel} className="flex-1" />
  <Button label="Confirm" onPress={onConfirm} className="flex-1" />
</View>

// Ghost — inline text-like action
<Button label="Forgot?" variant="ghost" onPress={handleForgot} />
```

---

## Input

**File:** `components/ui/input.tsx`

Text input with optional label and error state. Focus ring appears automatically on interaction.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | `undefined` | Label rendered above the field |
| `error` | `string` | `undefined` | Error message rendered below; also changes border to red |
| `className` | `string` | `''` | Applied to the `TextInput` element |
| `...TextInputProps` | — | — | All standard RN TextInput props |

### States

| State | Appearance |
|---|---|
| Default | `surface-container-low` background, no visible border |
| Focused | 2px `primary` (red) border |
| Error | 2px `error` (red) border + error message below |

### Usage

```tsx
import { Input } from '@/components/ui/input';

// Basic
<Input
  label="Email Address"
  placeholder="name@example.com"
  keyboardType="email-address"
  autoCapitalize="none"
/>

// Password
<Input
  label="Password"
  placeholder="••••••••"
  secureTextEntry
/>

// With validation error
<Input
  label="Email Address"
  value={email}
  onChangeText={setEmail}
  error={errors.email}
  keyboardType="email-address"
/>

// Without label (e.g. search bar)
<Input
  placeholder="Search memories, places..."
  className="rounded-full"
/>

// Controlled
const [value, setValue] = useState('');

<Input
  label="Display Name"
  value={value}
  onChangeText={setValue}
  maxLength={50}
  returnKeyType="done"
/>
```

---

## Card

**File:** `components/ui/card.tsx`

White rounded surface for grouping content. Use `elevated` (default) for floating cards and `elevated={false}` for inline/flat sections.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `elevated` | `boolean` | `true` | Toggles ambient shadow vs flat border |
| `className` | `string` | `''` | Layout overrides (margin, padding adjustments) |
| `...ViewProps` | — | — | All standard RN View props |

### Usage

```tsx
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

// Default elevated card
<Card>
  <Text variant="headline-md">Sarah Mitchell</Text>
  <Text variant="body-sm" className="text-on-surface-variant">at Tulum Beach</Text>
</Card>

// Flat card (for items in a list that already have a container)
<Card elevated={false} className="mb-sm">
  <Text variant="body-md">Elena Rodriguez</Text>
  <Text variant="body-sm" className="text-on-surface-variant">Mutual friend with Marco</Text>
</Card>

// Card with image — remove padding and clip the image
<Card className="p-0 overflow-hidden">
  <Image source={{ uri: memory.imageUrl }} className="w-full h-48 rounded-t-xl" />
  <View className="p-md">
    <Text variant="headline-md">{memory.title}</Text>
  </View>
</Card>

// Full-width card spanning screen edges
<Card className="mx-gutter mb-md">
  <Text variant="body-md">{content}</Text>
</Card>
```

---

## Badge

**File:** `components/ui/badge.tsx`

Small pill-shaped label for categories, tags, and status indicators.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | required | Text displayed inside the badge |
| `variant` | `'primary' \| 'secondary' \| 'tertiary'` | `'primary'` | Color scheme |

### Variants

| Variant | Background | Text | Use for |
|---|---|---|---|
| `primary` | Soft red tint | Dark red | Memories, primary categories |
| `secondary` | Soft amber tint | Dark amber | Places, golden hour categories |
| `tertiary` | Soft blue tint | Dark blue | Travel, sky categories |

### Usage

```tsx
import { Badge } from '@/components/ui/badge';

// Category tag on a memory card
<Badge label="Work" variant="primary" />
<Badge label="Tokyo" variant="secondary" />
<Badge label="Travel" variant="tertiary" />

// Alongside other content
<View className="flex-row items-center gap-sm">
  <Text variant="headline-md">First Coffee at Artisan</Text>
  <Badge label="1 YEAR AGO" variant="primary" />
</View>
```

---

## Building a Page — Full Example

Here is a realistic sign-in screen built entirely with the component library and design tokens.

```tsx
import { View, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useState } from 'react';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-margin py-xl"
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View className="items-center mb-xl">
        <Text variant="headline-xl" className="text-primary font-display">
          Memoriez
        </Text>
        <Text variant="body-md" className="text-on-surface-variant text-center mt-sm">
          Relive your journey through the spots that matter most.
        </Text>
      </View>

      {/* Form card */}
      <Card className="gap-md">
        <Input
          label="Email Address"
          placeholder="name@example.com"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          secureTextEntry
        />
        <Button
          label="Sign In"
          loading={loading}
          onPress={handleSignIn}
          className="mt-sm w-full"
        />
      </Card>

      {/* Footer actions */}
      <View className="items-center mt-lg gap-sm">
        <Button label="Forgot password?" variant="ghost" onPress={handleForgot} />
        <View className="flex-row gap-xs">
          <Text variant="body-sm" className="text-on-surface-variant">
            Don't have an account?
          </Text>
          <Button label="Join the community" variant="ghost" onPress={handleRegister} />
        </View>
      </View>
    </ScrollView>
  );
}
```

---

## Rules & Common Mistakes

### Do

- Use `<Text variant="...">` for all text. Never use raw RN `<Text>` in screen files.
- Use semantic color tokens (`text-on-surface`, `bg-primary`) not raw colors (`text-[#1c1b1b]`).
- Use spacing tokens (`gap-md`, `px-gutter`) rather than arbitrary values.
- Keep `className` overrides on a component to **layout only** (margin, padding, flex, width).
- Wrap screen content in `px-gutter` or `px-margin` for consistent horizontal rhythm.

### Don't

- Don't write `style={{ color: '#b71422' }}` — use `className="text-primary"`.
- Don't add a new color to the config without checking the existing palette first.
- Don't use `rounded-2xl` or other Tailwind defaults — our `rounded-*` scale overrides them with design-specific values.
- Don't put a `<Button>` inside another `<Button>` or `<TouchableOpacity>`.
- Don't pass color or typography overrides through `className` on a `<Button>` — use `variant` instead.

### Font weights require the right `font-sans-*` class

In React Native, `font-bold` does not automatically bold the text — you must use the correct font family class:

```tsx
// Wrong — has no effect on native
<Text className="font-bold">Hello</Text>

// Correct
<Text className="font-sans-bold">Hello</Text>

// Or just use the Text component which handles this automatically
<Text variant="headline-md">Hello</Text>
```
