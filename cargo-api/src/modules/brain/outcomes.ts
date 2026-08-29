import { BrainDecisionCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function n(value: unknown) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

export async function evaluateExecutedDecisions(input: { now?: Date; limit?: number } = {}) {
  const now = input.now ?? new Date();
  const decisions = await prisma.brainDecision.findMany({
    where: {
      status: "EXECUTED",
      category: { in: [BrainDecisionCategory.DISPATCH, BrainDecisionCategory.CASH, BrainDecisionCategory.SALES] },
      outcomes: { none: {} },
      resolvedAt: { lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
    },
    take: input.limit ?? 50,
  });

  let created = 0;
  for (const decision of decisions) {
    const expectedImpact = n(decision.impactAmount);

    await prisma.brainDecisionOutcome.create({
      data: {
        decisionId: decision.id,
        measuredAt: now,
        outcomeType: "INITIAL_REVIEW",
        expectedImpact,
        actualImpact: null,
        successScore: 50,
        notes: "Evaluacion inicial automatica con datos disponibles.",
        metadataJson: {
          evaluator: "brain-outcomes",
          category: decision.category,
          branchId: decision.branchId,
        },
      },
    });
    created += 1;
  }

  return { scanned: decisions.length, created };
}
