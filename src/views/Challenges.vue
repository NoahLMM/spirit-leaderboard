<!-- src/views/Challenges.vue -->
<template>
  <div class="min-h-screen p-6 text-gray-100 bg-gray-900">
    <div class="max-w-6xl mx-auto">
      <div class="flex flex-col items-start justify-between gap-4 mb-8 sm:flex-row sm:items-center">
        <h1 class="text-3xl font-extrabold">Challenges</h1>

        <div class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <input
            v-model.trim="q"
            type="search"
            placeholder="Search challenges…"
            class="w-full sm:w-72 p-2.5 rounded-md bg-gray-800 border border-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="loading"
          />
          <select
            v-model="sortKey"
            class="p-2.5 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="loading"
          >
            <option value="pointsDesc">Sort: Points (high → low)</option>
            <option value="pointsAsc">Sort: Points (low → high)</option>
            <option value="nameAsc">Sort: Name (A → Z)</option>
            <option value="nameDesc">Sort: Name (Z → A)</option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center gap-3 text-gray-300">
        <svg class="w-5 h-5 text-blue-400 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
        Loading challenges…
      </div>

      <!-- Error -->
      <div v-if="error && !loading" class="p-4 mt-4 text-red-300 border border-red-700 rounded-lg bg-red-900/30">
        {{ error }}
      </div>

      <!-- Empty -->
      <div v-if="!loading && !error && filtered.length === 0" class="p-4 mt-6 text-gray-300 border border-gray-700 rounded-lg bg-gray-800/60">
        No challenges found.
      </div>

      <!-- Table (desktop) -->
      <div v-if="!loading && !error && filtered.length > 0" class="hidden md:block">
        <div class="overflow-hidden bg-gray-800 border border-gray-700 rounded-xl">
          <table class="w-full text-left">
            <thead class="text-sm text-gray-300 bg-gray-800/80">
              <tr>
                <th class="px-4 py-3">Name</th>
                <th class="px-4 py-3">Description</th>
                <th class="px-4 py-3">Points</th>
                <th class="px-4 py-3">End Date</th> <!-- NEW -->
                <th class="px-4 py-3">Picture?</th>
                <th class="px-4 py-3">Reflection?</th>
                <th class="px-4 py-3">Council-wide?</th>
                <th class="px-4 py-3">Repeatable?</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700">
              <tr v-for="c in filtered" :key="c.id" class="hover:bg-gray-700/40">
                <td class="px-4 py-3 font-semibold text-gray-100">
                  {{ c['Challenge Name'] || 'Unnamed Challenge' }}
                </td>
                <td class="px-4 py-3 text-gray-200 whitespace-pre-wrap">
                  {{ c.Description || '—' }}
                </td>
                <td class="px-4 py-3 text-blue-300">
                  {{ pointsValue(c) }}
                </td>
                <td class="px-4 py-3 text-gray-300"> <!-- NEW -->
                  {{ endDateDisplay(c) }}
                </td>
                <td class="px-4 py-3">
                  <span :class="badgeClass(c['Picture Required?'])" class="inline-flex items-center px-2 py-0.5 rounded border text-xs">
                    {{ yesNo(c['Picture Required?']) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span :class="badgeClass(c['Reflection Required?'])" class="inline-flex items-center px-2 py-0.5 rounded border text-xs">
                    {{ yesNo(c['Reflection Required?']) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span :class="badgeClass(c['Team?'])" class="inline-flex items-center px-2 py-0.5 rounded border text-xs">
                    {{ yesNo(c['Team?']) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span :class="badgeClass(c['Repeatable?'])" class="inline-flex items-center px-2 py-0.5 rounded border text-xs">
                    {{ yesNo(c['Repeatable?']) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Cards (mobile) -->
      <div v-if="!loading && !error && filtered.length > 0" class="grid gap-4 md:hidden">
        <div v-for="c in filtered" :key="c.id" class="p-4 bg-gray-800 border border-gray-700 rounded-xl">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-lg font-bold text-gray-100">
              {{ c['Challenge Name'] || 'Unnamed Challenge' }}
            </h2>
            <span class="px-2 py-0.5 text-sm rounded bg-gray-700 border border-gray-600 text-blue-300">
              {{ pointsValue(c) }} pts
            </span>
          </div>
          <p class="mt-1 text-sm text-gray-400"> <!-- NEW -->
            Due: <span class="text-gray-200">{{ endDateDisplay(c) }}</span>
          </p>
          <p class="mt-2 text-gray-200 whitespace-pre-wrap">
            {{ c.Description || '—' }}
          </p>

          <div class="grid grid-cols-2 gap-2 mt-4 text-sm">
            <div :class="cardTagClass(c['Picture Required?'])" class="flex items-center justify-between px-2 py-1 border rounded">
              <span class="font-medium">Picture</span>
              <span class="text-xs">{{ yesNo(c['Picture Required?']) }}</span>
            </div>
            <div :class="cardTagClass(c['Reflection Required?'])" class="flex items-center justify-between px-2 py-1 border rounded">
              <span class="font-medium">Reflection</span>
              <span class="text-xs">{{ yesNo(c['Reflection Required?']) }}</span>
            </div>
            <div :class="cardTagClass(c['Team?'])" class="flex items-center justify-between px-2 py-1 border rounded">
              <span class="font-medium">Team</span>
              <span class="text-xs">{{ yesNo(c['Team?']) }}</span>
            </div>
            <div :class="cardTagClass(c['Repeatable?'])" class="flex items-center justify-between px-2 py-1 border rounded">
              <span class="font-medium">Repeatable</span>
              <span class="text-xs">{{ yesNo(c['Repeatable?']) }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { fetchTable } from "../api/fetchTables";

// Normalize CSV/Airtable shapes: "Yes"/"No", true/false, 1/0, arrays, etc.
function toBool(v) {
  if (Array.isArray(v)) v = v[0];
  if (v == null) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  const s = String(v).trim().toLowerCase();
  return ["yes", "y", "true", "1"].includes(s);
}

export default {
  name: "ChallengesView",

  data() {
    return {
      raw: [],
      loading: false,
      error: "",
      q: "",
      sortKey: "pointsDesc",
    };
  },

  computed: {
    challenges() {
      if (!Array.isArray(this.raw)) return [];
      return this.raw.map((r) => (r?.fields ? { id: r.id, ...r.fields } : r));
    },

    filtered() {
      const needle = this.q.toLowerCase();

      let list = this.challenges.filter((c) => {
        // Accept a variety of possible field spellings for active flag
        const rawActive =
          c["Is Active"] ?? c.IsActive ?? c["IsActive"] ?? c["Active"];
        const isActive = toBool(rawActive);

        if (!isActive) return false;

        const name = String(c["Challenge Name"] || "").toLowerCase();
        const desc = String(c.Description || "").toLowerCase();
        return !needle || name.includes(needle) || desc.includes(needle);
      });

      const getPts = (c) => {
        const v = c.Points;
        return Array.isArray(v) ? Number(v[0]) || 0 : Number(v) || 0;
      };

      if (this.sortKey === "pointsDesc") {
        list = list.sort(
          (a, b) =>
            getPts(b) - getPts(a) ||
            String(a["Challenge Name"] || "").localeCompare(String(b["Challenge Name"] || ""))
        );
      } else if (this.sortKey === "pointsAsc") {
        list = list.sort(
          (a, b) =>
            getPts(a) - getPts(b) ||
            String(a["Challenge Name"] || "").localeCompare(String(b["Challenge Name"] || ""))
        );
      } else if (this.sortKey === "nameAsc") {
        list = list.sort((a, b) =>
          String(a["Challenge Name"] || "").localeCompare(String(b["Challenge Name"] || ""))
        );
      } else if (this.sortKey === "nameDesc") {
        list = list.sort((a, b) =>
          String(b["Challenge Name"] || "").localeCompare(String(a["Challenge Name"] || ""))
        );
      }

      return list;
    },
  },

  methods: {
    yesNo(v) {
      return toBool(v) ? "Yes" : "No";
    },
    badgeClass(v) {
      return toBool(v)
        ? "bg-emerald-900/40 text-emerald-300 border-emerald-700"
        : "bg-gray-700/40 text-gray-300 border-gray-600";
    },
    cardTagClass(v) {
      return toBool(v)
        ? "bg-emerald-900/30 border-emerald-700 text-emerald-300"
        : "bg-gray-700/30 border-gray-600 text-gray-300";
    },
    pointsValue(c) {
      const v = c.Points;
      if (Array.isArray(v)) return Number(v[0]) || 0;
      return Number(v) || 0;
    },

    // --- NEW: End Date helpers ---
    endDateRaw(c) {
      // Prefer "End Date", but be resilient to alternative field spellings
      return c["End Date"] ?? c.EndDate ?? c["EndDate"] ?? null;
    },
    endDateDisplay(c) {
      const raw = this.endDateRaw(c);
      if (!raw) return "—";
      // Airtable may send ISO strings or user-entered strings; format both nicely
      const d = this.parseDateLoose(raw);
      return d ? this.formatDate(d) : String(raw);
    },
    parseDateLoose(v) {
      // v may be ISO, or something like "9/24/2025 1:44pm"
      try {
        // If array, use first
        if (Array.isArray(v)) v = v[0];
        if (typeof v === "number") return new Date(v);
        const d = new Date(String(v));
        if (!isNaN(d.getTime())) return d;
      } catch (_) {}
      return null;
    },
    formatDate(d) {
      // Friendly format: Sep 24, 2025, 1:44 PM
      try {
        return d.toLocaleString([], {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      } catch {
        return d.toString();
      }
    },
    // --- /End Date helpers ---

    async load() {
      this.loading = true;
      this.error = "";
      try {
        const records = await fetchTable("Challenges");
        this.raw = Array.isArray(records) ? records : [];
      } catch (e) {
        console.error(e);
        this.error = "Could not load challenges.";
      } finally {
        this.loading = false;
      }
    },
  },

  mounted() {
    this.load();
  },
};
</script>
