"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowRight,
  BarChart3,
  Dumbbell,
  Info,
  Leaf,
  Loader2,
  Minus,
  Plus,
  Shield,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { OnboardingShell } from "@/components/chrome/onboarding-shell";
import {
  ChoicePill,
  OptionTile,
  SegmentTile,
} from "@/components/np/selectable";
import { Eyebrow } from "@/components/np/typography";
import { Stepper } from "@/components/np/stepper";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { data as dataApi, ApiError } from "@/lib/api";
import type { Preferences } from "@/lib/api/data";
import { cn } from "@/lib/utils";
import {
  ACTIVITIES,
  CALORIE_FLOOR,
  COOKING,
  CUISINES,
  DIETS,
  GENDERS,
  PACES,
} from "@/lib/data";
import { preferencesSchema } from "@/lib/api/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ---------- choices ---------- */

const GOALS = [
  {
    key: "lose",
    label: "Lose weight",
    icon: <BarChart3 className="size-5" strokeWidth={1.9} />,
  },
  {
    key: "maintain",
    label: "Maintain",
    icon: <Minus className="size-5" strokeWidth={1.9} />,
  },
  {
    key: "muscle",
    label: "Gain muscle",
    icon: <Dumbbell className="size-5" strokeWidth={1.9} />,
  },
  {
    key: "healthier",
    label: "Eat healthier",
    icon: <Leaf className="size-5" strokeWidth={1.9} />,
  },
] as const;

/* ---------- small pieces ---------- */

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Eyebrow className={cn("mb-2.5 block tracking-wider", className)}>
      {children}
    </Eyebrow>
  );
}

function NumberField({
  label,
  unit,
  placeholder,
  error,
  ...input
}: {
  label: string;
  unit: string;
  placeholder: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex-1">
      <div
        className={cn(
          "mb-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider",
          error ? "text-danger" : "text-text-muted",
        )}
      >
        {label}
        {error ? " · required" : ""}
      </div>
      <label
        className={cn(
          "flex h-11.5 items-center gap-2 rounded-xl border bg-surface px-3.5 transition-colors",
          error
            ? "border-danger"
            : "border-control-border focus-within:border-brand",
        )}
      >
        <input
          type="number"
          inputMode="decimal"
          placeholder={placeholder}
          className="w-full min-w-0 bg-transparent font-sans text-[15px] font-bold text-ink outline-none placeholder:font-medium placeholder:text-text-inactive [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          {...input}
        />
        <span className="flex-none font-sans text-[12px] font-medium text-text-muted">
          {unit}
        </span>
      </label>
      {error && (
        <p className="mt-1.5 font-sans text-[10.5px] font-medium leading-[1.3] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function DislikesField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (_: string[]) => void;
}): React.ReactNode {
  const [inp, setInp] = useState("");
  const addDislike = () => {
    if (inp.length === 0) return;
    if (inp.trim() !== "") onChange([...value, inp.trim()]);
    setInp("");
  };
  return (
    <div className="px-2">
      <div className="flex flex-wrap items-center gap-2">
        {value.map((d) => (
          <div
            key={d}
            className="flex items-center gap-1.5 pl-4 pr-px py-px rounded-full border border-control-border bg-surface font-sans text-[12px] font-semibold text-text-strong"
          >
            {d}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (value.includes(d)) onChange(value.filter((v) => v !== d));
                else onChange([...value, d]);
              }}
              aria-label={`Remove ${d}`}
              className="rounded-full"
            >
              <X className="size-3 text-text-inactive" strokeWidth={2.4} />
            </Button>
          </div>
        ))}
        <div className="flex flex-nowrap gap-2">
          <Input
            value={inp}
            onChange={(e) => setInp(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDislike();
              }
            }}
            onBlur={() => {
              addDislike();
            }}
            placeholder="+ Add"
            className="w-24 rounded-full border border-dashed border-[#c2cac5] bg-transparent px-3 py-2.5 font-sans text-[12px] font-semibold text-text-strong outline-none placeholder:text-text-inactive focus:border-brand"
          />
          {inp.trim() !== "" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={addDislike}
              aria-label={`Add ${inp}`}
              className="rounded-full bg-brand text-white"
            >
              <Plus className="size-3" strokeWidth={2.4} />
            </Button>
          )}
        </div>
      </div>
      <p className="mt-2 font-sans text-[11px] font-medium leading-[1.4] text-text-inactive">
        Type anything — we&rsquo;ll keep it out of your plan.
      </p>
    </div>
  );
}

// function FieldError({ message }: { message?: string }) {
//   if (!message) return null;
//   return (
//     <p className="mt-1.5 font-sans text-[10.5px] font-medium text-danger">
//       {message}
//     </p>
//   );
// }

/* ---------- page ---------- */

export default function PreferencesStep() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<Preferences>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      goal: {
        type: "healthier",
      },
      activity: "light",
      pace:"steady",
      mealPrefs: {
        diet: "Vegetarian",
        cuisines: ["Indian"],
        dislikes: [],
        meals: 3,
        snacks: 2,
        cooking: "some_time",
      },
    },
  });
  const { register, handleSubmit, formState, watch } = form;
  const goalType = watch("goal.type");
  const errors = formState.errors;
  const errorCount = Object.keys(errors).length;

  async function onSubmit(values: Preferences) {
    setSubmitting(true);
    try {
      await dataApi.updatePreferences(values);
      router.push("/onboarding/safety");
    } catch (e) {
      setSubmitting(false);
      toast.error(
        e instanceof ApiError ? e.message : "Could not save your preferences.",
      );
    }
  }

  return (
    <OnboardingShell
      step={1}
      cta={
        <Button
          disabled={!form.formState.isValid || submitting}
          onClick={handleSubmit(onSubmit)}
          className="w-full gap-2 rounded-[15px] bg-brand py-6 font-bold"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Saving…
            </>
          ) : !goalType ? (
            "Pick a goal to continue"
          ) : errorCount > 0 ? (
            `Fix ${errorCount} item${errorCount > 1 ? "s" : ""} to continue`
          ) : (
            <>
              Continue <ArrowRight className="size-4 stroke-[2.5]" />
            </>
          )}
        </Button>
      }
    >
      <div className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-brand">
        Step 1 · Goal &amp; basics
      </div>
      <h1 className="mt-2 font-sans text-2xl font-extrabold leading-[1.2] tracking-[-0.01em] text-ink">
        Let&rsquo;s start with your goal
      </h1>
      <Form {...form}>
        {!goalType && (
          <div className="mt-4 flex items-center gap-2 rounded-[11px] border border-hairline bg-surface-muted px-3 py-2.5">
            <Info
              className="size-3.5 flex-none text-text-muted"
              strokeWidth={2}
            />
            <span className="font-sans text-[11.5px] font-medium leading-[1.35] text-text-body">
              Pick a goal above and we&rsquo;ll reveal your target &amp; pace.
            </span>
          </div>
        )}
        <FormField
          control={form.control}
          name="goal.type"
          render={({ field: { value, onChange } }) => (
            <FormItem>
              <FormControl>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {GOALS.map((g) => (
                    <OptionTile
                      key={g.key}
                      icon={g.icon}
                      label={g.label}
                      selected={value === g.key}
                      onClick={() => onChange(g.key)}
                    />
                  ))}
                  {value === "custom" ? (
                    <div className="rounded-lg bg-brand">
                      <Textarea
                        autoFocus
                        placeholder="Type your goal…"
                        className="w-full h-19 bg-transparent font-sans text-[14px] font-bold leading-[1.2] text-white outline-none placeholder:font-medium placeholder:text-white/60"
                        {...register("goal.customGoal")}
                      />
                    </div>
                  ) : (
                    <OptionTile
                      icon={<Plus className="size-5" strokeWidth={2} />}
                      label="Something else"
                      onClick={() => onChange("custom")}
                      className="border-dashed border-[#c2cac5] text-text-inactive"
                    />
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
          <FormField
            control={form.control}
            name="metrices.height"
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormControl>
                  <NumberField
                    label="Height"
                    unit="cm"
                    placeholder="e.g. 168"
                    value={value}
                    onChange={(e) => onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="metrices.weight"
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormControl>
                  <NumberField
                    label="Weight"
                    unit="kg"
                    placeholder="e.g. 55"
                    value={value}
                    onChange={(e) => onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="metrices.age"
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormControl>
                  <NumberField
                    label="Age"
                    unit="yrs"
                    placeholder="e.g. 34"
                    value={value}
                    onChange={(e) => onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="metrices.gender"
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <SectionLabel className="mb-1.5">Gender</SectionLabel>
                <FormControl>
                  <Select value={value} onValueChange={onChange}>
                    <SelectTrigger className="w-full px-3.5 py-5.5 mb-0 bg-surface rounded-xl">
                      <SelectValue
                        placeholder="Select Gender"
                        // className="h-11.5"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => (
                        <SelectItem
                          key={g.key}
                          value={g.key}
                          className="px-2 py-1"
                        >
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* target & pace — revealed by a weight goal */}
        {goalType === "lose" && (
          <FormField
            control={form.control}
            name="goal.targetWeight"
            render={({ field: { value, onChange } }) => (
              <FormItem className="mt-2">
                <FormControl>
                  <NumberField
                    label="Target weight"
                    unit="kg"
                    placeholder="e.g. 73"
                    value={value}
                    onChange={(e) => onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
                {/* <div className="mt-2.5 flex items-start gap-2 rounded-[11px] border border-danger/30 bg-danger-surface px-3 py-2.5">
                <Info
                  className="mt-px size-3.5 flex-none text-danger"
                  strokeWidth={2}
                />
                <span className="font-sans text-[11.5px] font-medium leading-[1.35] text-danger">
                  {errors.pace.message}
                </span>
                </div> */}
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="pace"
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <FormItem>
              <SectionLabel className="mt-4">Pace</SectionLabel>
              <FormControl>
                <div>
                  <div className="flex gap-1.5">
                    {PACES.map((p) => (
                      <SegmentTile
                        key={p.key}
                        label={p.label}
                        hint={p.hint}
                        selected={value === p.key}
                        onClick={() => onChange(p.key)}
                        className={
                          error && value === p.key
                            ? "border-danger bg-danger-surface"
                            : undefined
                        }
                      />
                    ))}
                  </div>
                  {!error && (
                    <div className="mt-2.5 flex items-center gap-2 rounded-[11px] border border-brand-border bg-brand-surface px-3 py-2.5">
                      <Shield
                        className="size-3.5 flex-none text-brand"
                        strokeWidth={2}
                      />
                      <span className="font-sans text-[11.5px] font-medium leading-[1.35] text-brand-deep">
                        We won&rsquo;t go below your calorie floor of{" "}
                        {CALORIE_FLOOR.toLocaleString()} kcal/day.
                      </span>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* activity */}
        <FormField
          control={form.control}
          name="activity"
          render={({ field: { value, onChange } }) => (
            <FormItem>
              <SectionLabel className="mt-5">Activity</SectionLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITIES.map((a) => (
                    <ChoicePill
                      key={a.key}
                      label={a.label}
                      selected={value === a.key}
                      onClick={() => onChange(a.key)}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* optional fine-tune */}
        <Accordion className="mt-5 rounded-2xl border border-hairline bg-surface px-3.5">
          <AccordionItem value="fine-tune" className="border-0">
            <AccordionTrigger className="py-3.5 hover:no-underline">
              <div className="flex items-start gap-2">
                <SlidersHorizontal className="text-gray-500 size-9 p-1.5 my-auto bg-gray-100 rounded-md"/>
                <div>
                <div className="font-sans text-[14px] font-bold text-ink">
                  Fine-tune your plan{" "}
                  <span className="font-mono text-[10px] font-semibold text-text-inactive">
                    · OPTIONAL
                  </span>
                </div>
                <div className="mt-0.5 font-sans text-[11.5px] font-medium text-text-muted">
                  Diet, cuisines, meals, cooking time
                </div>
              </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <FormField
                control={form.control}
                name="mealPrefs.diet"
                render={({ field: { value, onChange } }) => (
                  <FormItem>
                    <SectionLabel>Diet style</SectionLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {DIETS.map((d) => (
                          <ChoicePill
                            key={d}
                            label={d}
                            selected={value === d}
                            onClick={() => onChange(value === d ? "" : d)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mealPrefs.cuisines"
                render={({ field: { value, onChange } }) => (
                  <FormItem>
                    <SectionLabel className="mt-4">
                      Cuisines you love
                    </SectionLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {CUISINES.map((c) => (
                          <ChoicePill
                            key={c}
                            label={c}
                            selected={value.includes(c)}
                            onClick={() => {
                              if (value.includes(c))
                                onChange(value.filter((v) => v !== c));
                              else onChange([...value, c]);
                            }}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mealPrefs.dislikes"
                render={({ field }) => (
                  <FormItem>
                    <SectionLabel className="mt-4">
                      Anything to avoid?
                    </SectionLabel>
                    <FormControl>
                      <DislikesField {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SectionLabel className="mt-4">Meals per day</SectionLabel>

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="mealPrefs.meals"
                  render={({ field: { value, onChange } }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex flex-1 items-center justify-between rounded-[13px] border border-hairline bg-surface px-3 py-2.5">
                          <span className="font-sans text-[12px] font-semibold text-text-strong">
                            Meals
                          </span>
                          <Stepper
                            size="sm"
                            value={value}
                            className="gap-0"
                            onChange={(d) => onChange(Math.max(1, value + d))}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mealPrefs.snacks"
                  render={({ field: { value, onChange } }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <div className="w-full flex flex-1 items-center justify-between rounded-[13px] border border-hairline bg-surface px-3 py-2.5">
                          <span className="font-sans text-[12px] font-semibold text-text-strong">
                            Snacks
                          </span>
                          <Stepper
                            size="sm"
                            value={value}
                            className="gap-0"
                            onChange={(d) => onChange(Math.max(0, value + d))}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="mealPrefs.cooking"
                render={({ field: { value, onChange } }) => (
                  <FormItem>
                    <SectionLabel className="mt-4">Cooking time</SectionLabel>
                    <FormControl>
                      <div className="flex gap-1.5">
                        {COOKING.map((c) => (
                          <SegmentTile
                            key={c.key}
                            label={c.label}
                            hint={c.hint}
                            selected={value === c.key}
                            onClick={() => onChange(c.key)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Form>
    </OnboardingShell>
  );
}
