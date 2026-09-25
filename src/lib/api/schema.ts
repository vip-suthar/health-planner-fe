import z from "zod";
// import { ACTIVITIES, CALORIE_FLOOR, PACES } from "../data";

export const preferencesSchema = z
  .object({
    goal: z.object({
      type: z.enum(["lose", "maintain", "muscle", "healthier", "custom"], {
        message: "Pick a goal to continue.",
      }),
      targetWeight: z
        .number()
        .min(30, "Enter weight in kg.")
        .max(300, "Enter weight in kg.")
        .optional(),
      customGoal: z.string().trim().optional(),
    }),
    activity: z.enum(["sitting", "light", "active"], {
      message: "Select one.",
    }),
    pace: z.enum(["gentle", "steady", "ambitious"]),
    mealPrefs: z.object({
      diet: z.string(),
      cuisines: z.array(z.string()),
      dislikes: z.array(z.string()),
      meals: z.number(),
      snacks: z.number(),
      cooking: z.enum(["quick", "some_time", "i_cook"]),
    }),
    metrices: z.object({
      gender: z.enum(["female", "male", "other"], { message: "Select one." }),
      age: z
        .number({ message: "Needed to calculate your plan." })
        .min(13, "Must be 13 or older.")
        .max(100, "Enter a valid age."),
      height: z
        .number({ message: "Needed to calculate your plan." })
        .min(100, "Enter height in cm.")
        .max(230, "Enter height in cm."),
      weight: z
        .number()
        .min(30, "Enter weight in kg.")
        .max(300, "Enter weight in kg.")
        .optional(),
    }),
  })
  .superRefine((v, ctx) => {
    if (v.goal.type === "custom" && !v.goal?.customGoal) {
      ctx.addIssue({
        code: "custom",
        path: ["goal"],
        message: "Tell us your goal.",
      });
    }
    if (v.goal.type !== "lose") return;
    const currentWeight = v.metrices.weight;
    const targetWeight = v.goal?.targetWeight;
    if (currentWeight == null) {
      ctx.addIssue({
        code: "custom",
        path: ["metrices", "weight"],
        message: "Needed to calculate your plan.",
      });
    }
    if (targetWeight == null) {
      ctx.addIssue({
        code: "custom",
        path: ["goal", "targetWeight"],
        message: "Needed to calculate your plan.",
      });
    } else if (currentWeight != null && targetWeight >= currentWeight) {
      ctx.addIssue({
        code: "custom",
        path: ["goal", "targetWeight"],
        message: "Target must be below your current weight.",
      });
    }
    // Mifflin-St Jeor estimate: block a pace whose daily deficit dips below the floor.
    if (currentWeight != null) {
      // const bmr =
      //   10 * currentWeight +
      //   6.25 * v.metrices.height -
      //   5 * v.metrices.age +
      //   (v.metrices.gender === "male"
      //     ? 5
      //     : v.metrices.gender === "female"
      //       ? -161
      //       : -78);
      // const tdee = bmr * ACTIVITIES.find((a) => a.key === v.activity)!.factor;
      // const deficit =
      //   (PACES.find((p) => p.key === v.pace)!.kgPerWeek * 7700) / 7;
      // if (tdee - deficit < CALORIE_FLOOR) {
      //   ctx.addIssue({
      //     code: "custom",
      //     path: ["pace"],
      //     message: `This pace dips below your ${CALORIE_FLOOR.toLocaleString()} kcal floor. Pick a gentler pace to continue.`,
      //   });
      // }
    }
  });
