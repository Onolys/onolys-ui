export const requiredStoryTitles = [
  ...["Button", "Input", "Label", "Textarea", "Select", "Checkbox", "Tabs", "Card", "Badge", "Alert", "Table", "Dialog", "AlertDialog", "DropdownMenu", "Separator", "Skeleton", "Spinner", "Progress", "Tooltip"].map((name) => `UI/${name}`),
  ...["AppHeader", "Footer", "ScoreBadge", "UsageMeter", "SkipLink", "Page", "Section", "Field", "Notice", "StatusChip", "SlowStartNotice", "ErrorRecovery", "AccountMenu", "ThemeToggle"].map((name) => `Onolys/${name}`),
];

export function assertStoryCoverage(index) {
  const stories = Object.values(index.entries).filter((entry) => entry.type === "story");
  if (stories.some((entry) => entry.title.startsWith("Validation/"))) {
    throw new Error("Negative accessibility fixtures must not appear in the public catalogue");
  }
  const titles = new Set(stories.map((entry) => entry.title));
  const missing = requiredStoryTitles.filter((title) => !titles.has(title));
  if (missing.length) throw new Error(`Missing Storybook families: ${missing.join(", ")}`);
  return stories;
}
