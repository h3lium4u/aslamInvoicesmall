import { z } from "zod";

export const StatementItemSchema = z.object({
  daNumber: z.string().optional(),
  entryDate: z.string().optional(),
  partNumber: z.string().optional(),
  despatches: z.string().optional(),
  openingStock: z.number().default(0),
  closingStock: z
    .number({ message: "Closing stock must be a number" })
    .min(0, "Closing stock cannot be negative"),
});

export const CreateStatementSchema = z.object({
  industryName: z.string().min(1, "Industry name is required"),
  vendorName: z.string().min(1, "Vendor name is required"),
  vendorCode: z.string().min(1, "Vendor code is required"),
  month: z
    .number()
    .int()
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"),
  year: z
    .number()
    .int()
    .min(2000, "Year must be 2000 or later")
    .max(2100, "Year must be 2100 or earlier"),
  statementDate: z.string().optional(),
  items: z
    .array(StatementItemSchema)
    .min(1, "At least one stock entry is required"),
});

export type CreateStatementInput = z.infer<typeof CreateStatementSchema>;
export type StatementItemInput = z.infer<typeof StatementItemSchema>;
