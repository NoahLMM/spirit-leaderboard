<template>
  <div class="min-h-screen p-6 text-gray-100 bg-gray-900">
    <div class="max-w-5xl mx-auto">
      <h1 class="mb-8 text-4xl font-extrabold text-center text-white">
        {{ siteTitle }}
      </h1>

      <!-- Individual Leaderboard -->
      <section class="mb-10">
        <h2 class="mb-4 text-2xl font-semibold text-gray-100">Individual Leaderboard</h2>
        <div class="space-y-3">
          <div
            v-for="(player, i) in topPlayers"
            :key="player.id"
            class="flex items-center justify-between p-4 transition bg-gray-800 rounded-lg shadow hover:shadow-lg"
          >
            <div class="flex items-center space-x-4">
              <div
                class="flex items-center justify-center w-8 h-8 font-bold rounded-full"
                :class="{
                  'bg-yellow-500 text-black': i === 0,
                  'bg-gray-400 text-black': i === 1,
                  'bg-orange-400 text-black': i === 2,
                  'bg-gray-700 text-white': i > 2
                }"
              >
                {{ i + 1 }}
              </div>
              <div>
                <p class="text-lg font-bold">{{ player.fields?.Name }}</p>
                <p class="text-sm italic text-gray-400">
                  {{ player.fields?.['Team Name']?.[0] || `No ${groupLabel}` }}
                </p>
              </div>
            </div>

            <div class="flex space-x-8 text-right">
              <div>
                <p class="text-sm text-gray-400">Challenges Completed</p>
                <p class="text-lg font-semibold">
                  {{ player.fields?.['NSubmissions'] || 0 }}
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-400">Total Points</p>
                <p class="text-lg font-semibold text-blue-400">
                  {{ intPoints(player.fields?.['Total Points']) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Team Leaderboard -->
      <section class="mb-10">
        <h2 class="mb-4 text-2xl font-semibold text-gray-100">{{ groupLabel }} Leaderboard</h2>
        <div class="space-y-3">
          <div
            v-for="(team, i) in teamLeaderboard"
            :key="team.name"
            class="flex items-center justify-between p-4 transition bg-gray-800 rounded-lg shadow hover:shadow-lg"
          >
            <div class="flex items-center space-x-4">
              <div
                class="flex items-center justify-center w-8 h-8 font-bold rounded-full"
                :class="{
                  'bg-yellow-500 text-black': i === 0,
                  'bg-gray-400 text-black': i === 1,
                  'bg-orange-400 text-black': i === 2,
                  'bg-gray-700 text-white': i > 2
                }"
              >
                {{ i + 1 }}
              </div>
              <p class="text-lg font-bold">{{ team.name }}</p>
            </div>

            <div class="flex space-x-8 text-right">
              <div>
                <p class="text-sm text-gray-400">Challenges</p>
                <p class="text-lg font-semibold">{{ team.challenges }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-400">Points</p>
                <p class="text-lg font-semibold text-blue-400">
                  {{ team.points }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Activity -->
      <section>
        <h2 class="mb-4 text-2xl font-semibold text-gray-100">Recent Activity</h2>
        <div class="space-y-3">
          <div
            v-for="entry in recActivity"
            :key="entry.id"
            class="p-4 transition bg-gray-800 rounded-lg shadow hover:shadow-lg"
          >
            <div class="flex items-center justify-between mb-2">
              <p class="text-lg font-bold">{{ entry.fields?.['Member Names'] || 'Unknown' }}</p>
              <span class="text-sm text-gray-400">
                {{ formatDate(entry.fields?.Created) }}
              </span>
            </div>

            <p class="mb-2 text-sm text-gray-300">
              <span class="font-semibold text-blue-400">
                {{ entry.fields?.['Challenge Name'] || 'Unknown Challenge' }}
              </span>
              <template v-if="shouldShowReflection(entry) && entry.fields?.Notes">
                — {{ entry.fields.Notes }}
              </template>
            </p>

            <div class="flex items-center justify-between mb-2 text-sm text-gray-400">
              <span>{{ groupLabel }}: {{ entry.fields?.['Team Name'] || `No ${groupLabel}` }}</span>
              <span class="font-semibold text-blue-400">
                {{ intPoints(entry.fields?.Points) }} pts
              </span>
            </div>

            <div v-if="entry.fields?.Proof && entry.fields.Proof[0]" class="mt-2">
              <img
                :src="entry.fields.Proof[0].url"
                alt="submission"
                class="object-cover border border-gray-700 rounded-lg max-h-48"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { fetchTable } from "../api/fetchTables";
import { config } from "../config";

// Robust truthy check for Airtable fields (Yes/No single select, checkbox, number)
function toBool(v) {
  if (Array.isArray(v)) v = v[0];
  if (v == null) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  const s = String(v).trim().toLowerCase();
  return ["yes", "y", "true", "1", "checked"].includes(s);
}

// Safely coerce Airtable numbers (or arrays) to whole integers
function intPoints(val) {
  const raw = Array.isArray(val) ? val[0] : val;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  // Round to nearest whole to avoid 105.0099999999 artifacts
  return Math.round(n);
}

export default {
  data() {
    return {
      leaderboard: [],
      feed: [],
      loading: false,
      siteTitle: config.siteTitle,
      groupLabel: config.groupLabel,
    };
  },
  computed: {
    topPlayers() {
      return [...this.leaderboard]
        .sort(
          (a, b) =>
            intPoints(b.fields?.["Total Points"]) - intPoints(a.fields?.["Total Points"])
        )
        .slice(0, 10);
    },
    teamLeaderboard() {
      const teamMap = {};
      this.leaderboard.forEach(player => {
        const team = player.fields?.['Team Name']?.[0] || `No ${this.groupLabel}`;
        const points = intPoints(player.fields?.['Total Points']);
        const challenges = player.fields?.['NSubmissions'] || 0;
        if (!teamMap[team]) {
          teamMap[team] = { name: team, points: 0, challenges: 0 };
        }
        teamMap[team].points += points;
        teamMap[team].challenges += challenges;
      });
      // Make sure team points are integers for display
      const list = Object.values(teamMap).map(t => ({ ...t, points: intPoints(t.points) }));
      return list.sort((a, b) => b.points - a.points).slice(0, 10);
    },
    recActivity() {
      return [...this.feed].slice(0, 100);
    },
  },
  methods: {
    async loadData() {
      try {
        this.loading = true;
        // Leaderboard from Members
        this.leaderboard = await fetchTable("Members");

        // Recent Activity: only Approved submissions
        this.feed = await fetchTable("Submissions", {
          filterByFormula: "Approved = 1",
          sort: [{ field: "Created", direction: "desc" }],
          maxRecords: 100
        });
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        this.loading = false;
      }
    },
    shouldShowReflection(entry) {
      const share = entry?.fields?.["Share Reflection?"];
      return toBool(share);
    },
    formatDate(isoString) {
      if (!isoString) return "No date";
      const date = new Date(isoString);
      return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    // expose helper to template
    intPoints,
  },
  mounted() {
    this.loadData();
    setInterval(this.loadData, 60000);
  },
};
</script>
