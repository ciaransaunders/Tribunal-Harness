// Schema Index — provides access to all 10 claim type schemas

import type { ClaimSchema } from "./types";
import { unfairDismissalSchema } from "./unfair-dismissal";
import { directDiscriminationSchema } from "./direct-discrimination";
import { indirectDiscriminationSchema } from "./indirect-discrimination";
import { victimisationSchema } from "./victimisation";
import { harassmentSchema } from "./harassment";
import { reasonableAdjustmentsSchema } from "./reasonable-adjustments";
import { wrongfulDismissalSchema } from "./wrongful-dismissal";
import { whistleblowingSchema } from "./whistleblowing";
import { fireAndRehireSchema } from "./fire-and-rehire";
import { zeroHoursRightsSchema } from "./zero-hours-rights";

export const SCHEMAS: Record<string, ClaimSchema> = {
    unfair_dismissal: unfairDismissalSchema,
    direct_discrimination: directDiscriminationSchema,
    indirect_discrimination: indirectDiscriminationSchema,
    harassment: harassmentSchema,
    victimisation: victimisationSchema,
    reasonable_adjustments: reasonableAdjustmentsSchema,
    whistleblowing: whistleblowingSchema,
    wrongful_dismissal: wrongfulDismissalSchema,
    fire_and_rehire: fireAndRehireSchema,
    zero_hours_rights: zeroHoursRightsSchema,
};

export function getSchema(claimTypeId: string): ClaimSchema | null {
    return SCHEMAS[claimTypeId] || null;
}

export function getAllSchemas(): ClaimSchema[] {
    return Object.values(SCHEMAS);
}

export { type ClaimSchema, type SchemaField, type ERA2025Annotation } from "./types";
