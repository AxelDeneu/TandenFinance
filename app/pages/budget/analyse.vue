<template>
  <div class="flex flex-col gap-6 p-4">
    <BudgetAnalyticsSummary />

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BudgetCategoryTrends />
      <BudgetCategoryBreakdown />
    </div>
  </div>
</template>
