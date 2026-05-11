import { z } from 'zod';
export declare const createMemoryBodySchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    relativeArea: z.ZodOptional<z.ZodString>;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    visibility: z.ZodEnum<{
        public: "public";
        friends_only: "friends_only";
        private: "private";
    }>;
}, z.core.$strip>;
export declare const updateMemoryBodySchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    relativeArea: z.ZodOptional<z.ZodString>;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    visibility: z.ZodOptional<z.ZodEnum<{
        public: "public";
        friends_only: "friends_only";
        private: "private";
    }>>;
}, z.core.$strip>;
//# sourceMappingURL=memories.d.ts.map