import type { ActivityType } from "@prisma/client";

export type EmissionInput = {
  quantity: { toString(): string };
  factor: { value: { toString(): string } };
};

export type TypedEmissionInput = EmissionInput & {
  activityType: ActivityType;
};

export function emissionsOf(input: EmissionInput): number {
  return (
    Number(input.quantity.toString()) * Number(input.factor.value.toString())
  );
}

export function sumEmissions(inputs: readonly EmissionInput[]): number {
  return inputs.reduce((sum, a) => sum + emissionsOf(a), 0);
}
