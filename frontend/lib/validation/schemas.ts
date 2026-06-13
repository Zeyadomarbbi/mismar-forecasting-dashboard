import { z } from "zod";

export const forecastSchema = z.object({
  series: z.string().min(1),
  date: z.string().min(1),
  dayNameAr: z.string().min(1),
  forecastOrders: z.number().nullable(),
  forecastType: z.string().nullish(),
  forecastStart: z.string().nullish(),
  forecastEnd: z.string().nullish(),
  weeklyForecastTotal: z.number().nullable().optional(),
});

export const weeklySummarySchema = z.object({
  series: z.string().min(1),
  forecastStart: z.string().nullish(),
  forecastEnd: z.string().nullish(),
  weeklyForecastTotal: z.number().nullable(),
  dailyAverage: z.number().nullable(),
  dailyMax: z.number().nullable(),
  dailyMin: z.number().nullable(),
});

export const resultSchema = z.object({
  series: z.string().min(1),
  datasetType: z.string().min(1),
  date: z.string().min(1),
  dayNameAr: z.string().min(1),
  actualOrders: z.number().nullable(),
  forecastOrders: z.number().nullable(),
  error: z.number().nullable(),
  absoluteError: z.number().nullable(),
});

export const metricsSchema = z.object({
  series: z.string().min(1),
  firstDate: z.string().nullish(),
  lastActualDate: z.string().nullish(),
  daysCount: z.number().nullable().optional(),
  historicalTotalOrders: z.number().nullable().optional(),
  historicalDailyAverage: z.number().nullable().optional(),
  bestEpoch: z.number().nullable().optional(),
  validationMae: z.number().nullable().optional(),
  validationRmse: z.number().nullable().optional(),
  validationWape: z.number().nullable().optional(),
  testMae: z.number().nullable().optional(),
  testRmse: z.number().nullable().optional(),
  testWape: z.number().nullable().optional(),
  testBias: z.number().nullable().optional(),
  baselineMae: z.number().nullable().optional(),
  baselineRmse: z.number().nullable().optional(),
  baselineWape: z.number().nullable().optional(),
  betterThanBaseline: z.string().nullish(),
});

export const trainingSummarySchema = z.object({
  series: z.string().min(1),
  trainingStatus: z.string().nullish(),
  lastActualDate: z.string().nullish(),
  forecastStart: z.string().nullish(),
  forecastEnd: z.string().nullish(),
  weeklyForecastTotal: z.number().nullable().optional(),
  finalEpochs: z.number().nullable().optional(),
});
