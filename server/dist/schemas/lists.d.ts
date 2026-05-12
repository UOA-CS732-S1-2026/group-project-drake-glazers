import { z } from 'zod';
export declare const createListBodySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createListItemBodySchema: z.ZodObject<{
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    placeName: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    imagePath: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateListItemBodySchema: z.ZodObject<{
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    placeName: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    imagePath: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateListBodySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=lists.d.ts.map