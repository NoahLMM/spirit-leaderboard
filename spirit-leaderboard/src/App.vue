<template>
  <div class="min-h-screen p-6 text-gray-100 bg-gray-900">
    <div class="max-w-5xl mx-auto">
      <h1 class="mb-8 text-4xl font-extrabold text-center text-white">
        RHA Spirit Challenge!
      </h1>
    

      <!-- Leaderboard -->
      <section class="mb-10">
        <h2 class="mb-4 text-2xl font-semibold text-gray-100">🏆 Leaderboard</h2>
        <div class="space-y-3">
          <div
            v-for="(player, i) in topPlayers"
            :key="player.id"
            class="flex items-center justify-between p-4 transition bg-gray-800 rounded-lg shadow hover:shadow-lg"
          >
            <!-- Rank, Name, Team -->
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
                <p class="text-lg font-bold">{{ player.Name }}</p>
                <p class="text-sm italic text-gray-400">
                  {{ player['Team Name']?.[0] || 'No Team' }}
                </p>
              </div>
            </div>

            <!-- Stats -->
            <div class="flex space-x-8 text-right">
              <div>
                <p class="text-sm text-gray-400">Challenges Completed</p>
                <p class="text-lg font-semibold">
                  {{ player['NSubmissions'] || 0 }}
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-400">Total Points</p>
                <p class="text-lg font-semibold text-blue-400">
                  {{ player['Total Points'] || 0 }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Activity Feed -->
      <section>
        <h2 class="mb-4 text-2xl font-semibold text-gray-100"> Recent Activity</h2>
        <div class="space-y-3">
          <div
            v-for="entry in recActivity"
            :key="entry.id"
            class="p-4 transition bg-gray-800 rounded-lg shadow hover:shadow-lg"
          >
            <!-- Name and Timestamp -->
            <div class="flex items-center justify-between mb-2">
              <p class="text-lg font-bold">{{ entry['Member Names'] || 'Unknown' }}</p>
              <span class="text-sm text-gray-400">
                {{ formatDate(entry.Created) }}
              </span>
            </div>

            <!-- Challenge info -->
            <p class="mb-2 text-sm text-gray-300">
              <span class="font-semibold text-blue-400">{{ entry['Challenge Name'] || 'Unknown Challenge' }}</span>
              — {{ entry.Notes || '' }}
            </p>

            <!-- Team and Points -->
            <div class="flex items-center justify-between mb-2 text-sm text-gray-400">
              <span>Team: {{ entry['Team Name'] || 'No Team' }}</span>
              <span class="font-semibold text-blue-400">{{ entry['Points'] || 0 }} pts</span>
            </div>

            <!-- Submission Image -->
            <div v-if="entry.Proof && entry.Proof[0]" class="mt-2">
              <img
                :src="entry.Proof[0].url"
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
import { fetchTable } from "./api/airtable";

export default {
  data() {
    return {
      leaderboard: [],
      feed: [],
    };
  },
  computed: {
    // Sort and get top 10 players
    topPlayers() {
      return [...this.leaderboard]
        .sort((a, b) => (b["Total Points"] || 0) - (a["Total Points"] || 0))
        .slice(0, 10);
    },
    recActivity() {
      return [...this.feed]
        .slice(0, 10);
    },
  },
  methods: {
    async loadData() {
      try {
        // Fetch leaderboard (Members)
        this.leaderboard = await fetchTable("Members");

        // Fetch feed (Submissions)
        this.feed = await fetchTable(
          "Submissions",
          "sort[0][field]=Created&sort[0][direction]=desc&maxRecords=10"
        );

        console.log("Leaderboard:", this.leaderboard);
        console.log("Feed:", this.feed);
      } catch (err) {
        console.error("Error loading data:", err);
      }
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
  },
  mounted() {
    this.loadData();
    // Refresh every minute
    setInterval(this.loadData, 60000);
  },
};
</script>

<style>
/* Optional: custom scrollbar for dark theme */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #1f2937;
}
::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>
