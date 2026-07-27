<!-- src/components/SubmitForm.vue -->
<template>
  <div class="max-w-2xl p-6 mx-auto bg-gray-800 rounded-lg shadow-lg">
    <h2 class="mb-6 text-3xl font-extrabold text-white">Submit a Challenge</h2>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Email -->
      <div>
        <label class="block mb-1 text-gray-200">Your Email</label>
        <div class="relative">
          <input
            v-model.trim="form.email"
            type="email"
            required
            :placeholder="emailPlaceholder"
            class="w-full p-3 pr-12 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            @blur="loadMemberSubmissions"
            :disabled="loadingMember || submitting"
          />
          <div
            v-if="loadingMember"
            class="absolute inset-y-0 flex items-center right-3"
            aria-live="polite"
          >
            <svg class="w-5 h-5 text-blue-400 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
          </div>
        </div>
        <p v-if="emailChecked && !validMember" class="mt-1 text-sm text-red-300">
          Please enter a valid, known email address.
        </p>
      </div>

      <!-- Greeting -->
      <p v-if="emailChecked && validMember && memberName"
         class="mt-2 text-lg font-semibold text-blue-300">
        Hello, {{ memberName }}. Ready to submit some challenges?
      </p>

      <!-- Challenge dropdown OR empty-state -->
      <div v-if="showDropdown">
        <div class="flex items-center gap-2 mb-1">
          <label class="block text-gray-200">Select Challenge</label>
          <svg
            v-if="loadingChallenges"
            class="w-4 h-4 text-blue-400 animate-spin"
            viewBox="0 0 24 24" fill="none" aria-hidden="true"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a 8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
        </div>
        <select
          v-model="form.challengeId"
          required
          @change="onChallengeChange"
          class="w-full p-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="loadingChallenges || submitting"
        >
          <option value="">-- Select a Challenge --</option>
          <option v-for="c in filteredChallenges" :key="c.id" :value="c.id">
            {{ c['Challenge Name'] || 'Unnamed Challenge' }}<span v-if="isTeamChallenge(c)"> (Team)</span>
          </option>
        </select>
      </div>
      <p v-else-if="emailChecked && validMember" class="text-sm text-gray-300">
        You’ve completed all available challenges. Check back later for new ones!
      </p>

      <!-- Selected challenge Description -->
      <div
        v-if="currentChallenge && currentChallenge.Description"
        class="p-4 text-sm border border-gray-600 rounded-lg bg-gray-700/60"
      >
        <div class="mb-1 font-semibold text-gray-300">Description</div>
        <p class="text-gray-200 whitespace-pre-wrap">
          {{ currentChallenge.Description }}
        </p>
      </div>

      <!-- Notes / Reflection -->
      <div v-if="currentChallenge && currentChallenge['Reflection Required?'] === 'Yes'">
        <label class="block mb-1 text-gray-200">Notes / Reflection</label>
        <textarea
          v-model="form.notes"
          placeholder="Write your reflection or any notes..."
          class="w-full p-3 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="4"
        ></textarea>

        <!-- NEW: Ask if they want to share reflection -->
        <div class="flex items-center mt-2 space-x-2">
          <input
            id="share-reflection"
            type="checkbox"
            v-model="form.shareReflection"
            class="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
          />
          <label for="share-reflection" class="text-sm text-gray-300">
            Share my reflection on the public board
          </label>
        </div>
      </div>

      <!-- Proof Upload -->
      <div v-if="currentChallenge && currentChallenge['Picture Required?'] === 'Yes'">
        <label class="block mb-2 text-gray-200">Upload Proof (Image)</label>
        <label
          for="file-upload"
          class="inline-flex items-center px-4 py-2 font-semibold text-white bg-blue-600 rounded-md cursor-pointer hover:bg-blue-700"
        >
          Choose File
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileChange"
          :disabled="submitting"
        />
        <span v-if="form.file" class="ml-3 text-gray-300 truncate">{{ form.file.name }}</span>
      </div>

      <!-- Submit -->
      <button
        type="submit"
        class="inline-flex items-center gap-2 px-5 py-2.5 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-60"
        :disabled="submitting || disableSubmit"
      >
        <svg
          v-if="submitting"
          class="w-5 h-5 text-white animate-spin"
          viewBox="0 0 24 24" fill="none" aria-hidden="true"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
        <span>{{ submitting ? 'Submitting…' : 'Submit Challenge' }}</span>
      </button>

      <!-- Status / Error -->
      <p v-if="status" class="text-green-400">{{ status }}</p>
      <p v-if="error" class="text-red-400">{{ error }}</p>
    </form>

    <!-- Success Modal -->
    <transition name="fade">
      <div
        v-if="showSuccessModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @keyup.esc="closeSuccessModal"
        tabindex="0"
        role="dialog"
        aria-modal="true"
      >
        <div class="absolute inset-0 bg-black/60" @click="closeSuccessModal" />
        <div class="relative z-10 w-full max-w-md p-6 bg-gray-800 shadow-2xl rounded-2xl ring-1 ring-white/10">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-2xl font-bold text-white">Success!</h3>
              <p class="mt-1 text-gray-300">An admin will review your submission.</p>
            </div>
            <button
              type="button"
              class="p-2 -mr-2 text-gray-300 rounded-md hover:bg-gray-700/60 hover:text-white"
              @click="closeSuccessModal"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="mt-6">
            <button
              type="button"
              class="inline-flex items-center justify-center w-full px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              @click="closeSuccessModal"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { fetchTable } from "../api/fetchTables";
import { config } from "../config";

const DEBUG = false;

function toBool(v) {
  if (Array.isArray(v)) v = v[0];
  if (v == null) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  const s = String(v).trim().toLowerCase();
  return ["yes", "y", "true", "1"].includes(s);
}

export default {
  data() {
    return {
      rawChallenges: [],
      memberSubmissions: [],
      teamSubmissions: [],
      memberTeamNames: [],
      validMember: false,
      emailChecked: false,
      memberName: "",

      loadingMember: false,
      loadingChallenges: false,

      showSuccessModal: false,

      form: {
        email: "",
        challengeId: "",
        notes: "",
        file: null,
        fileDataUrl: "",
        shareReflection: false,
      },
      currentChallenge: null,
      submitting: false,
      status: "",
      error: "",
    };
  },

  computed: {
    emailPlaceholder() {
      return config.emailDomain ? `you@${config.emailDomain}` : "you@example.org";
    },
    emailDomainHint() {
      return config.emailDomain ? ` Use your ${config.emailDomain} email.` : "";
    },
    normalizedChallenges() {
      if (!Array.isArray(this.rawChallenges)) return [];
      return this.rawChallenges.map((r) => (r?.fields ? { id: r.id, ...r.fields } : r));
    },

    activeChallenges() {
      return this.normalizedChallenges.filter((c) => this.isActive(c));
    },

    selectedChallenge() {
      return this.activeChallenges.find((c) => c.id === this.form.challengeId);
    },

    disableSubmit() {
      const c = this.selectedChallenge;
      if (!c) return true;
      if (c["Reflection Required?"] === "Yes" && !this.form.notes.trim()) return true;
      if (c["Picture Required?"] === "Yes" && !this.form.file) return true;
      return false;
    },

    filteredChallenges() {
      if (!this.emailChecked || !this.validMember) return [];

      // If fetches failed and came back empty, do NOT auto-show everything.
      // Only show all when the member truly has zero submissions *and* we successfully looked them up.
      // We assume lookup success when emailChecked && validMember are true.
      const hasAnySubs = this.memberSubmissions.length > 0 || this.teamSubmissions.length > 0;

      const completedByMember = new Set();
      this.memberSubmissions.forEach((s) => this.extractChallengeIds(s).forEach((id) => completedByMember.add(id)));

      const completedByTeam = new Set();
      this.teamSubmissions.forEach((s) => this.extractChallengeIds(s).forEach((id) => completedByTeam.add(id)));

      if (DEBUG) {
        console.log("[DBG] hasAnySubs:", hasAnySubs);
        console.log("[DBG] memberSubmissions:", this.memberSubmissions);
        console.log("[DBG] teamSubmissions:", this.teamSubmissions);
        console.log("[DBG] completedByMember:", Array.from(completedByMember));
        console.log("[DBG] completedByTeam:", Array.from(completedByTeam));
      }

      return this.activeChallenges.filter((c) => {
        const repeatable = toBool(c["Repeatable?"]);
        const isTeam = this.isTeamChallenge(c);
        const done = isTeam ? completedByTeam.has(c.id) : completedByMember.has(c.id);
        return !done || repeatable;
      });
    },

    showDropdown() {
      return this.emailChecked && this.validMember && this.filteredChallenges.length > 0;
    },
  },

  watch: {
    "form.email"() {
      this.emailChecked = false;
      this.validMember = false;
      this.memberSubmissions = [];
      this.teamSubmissions = [];
      this.memberTeamNames = [];
      this.form.challengeId = "";
      this.currentChallenge = null;
      this.status = "";
      this.error = "";
    },
  },

  methods: {
    isActive(challenge) {
      const raw = challenge?.["Is Active"];
      return toBool(raw);
    },

    isTeamChallenge(challenge) {
      const v = challenge?.["Team?"];
      return toBool(v);
    },

    extractChallengeIds(submission) {
      const f = submission?.fields || {};
      const raw = f.Challenge;
      if (Array.isArray(raw)) return raw.filter((id) => typeof id === "string");
      if (typeof raw === "string") return [raw];
      return [];
    },

    async loadChallenges() {
      try {
        this.loadingChallenges = true;
        const filterByFormula = [
          "OR(",
          " {Is Active} = TRUE(),",
          " {Is Active} = 1,",
          ' LOWER({Is Active} & "") = "yes"',
          ")",
        ].join("");
        const records = await fetchTable("Challenges", { filterByFormula });
        this.rawChallenges = Array.isArray(records) ? records : [];
      } catch (err) {
        console.error("Error fetching challenges:", err);
        this.error = "Could not load challenges.";
      } finally {
        this.loadingChallenges = false;
      }
    },

    // Batch-fetch submissions by record IDs from the Member row
    async fetchSubmissionsByIds(ids = []) {
      if (!ids.length) return [];
      const chunks = (arr, size) => {
        const out = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
      };
      const groups = chunks(ids, 50);
      const acc = [];
      for (const group of groups) {
        const orParts = group.map((id) => `RECORD_ID() = "${String(id).replace(/"/g, '\\"')}"`);
        const formula = `OR(${orParts.join(",")})`;
        const res = await fetchTable("Submissions", { filterByFormula: formula, maxRecords: 50 });
        if (Array.isArray(res)) acc.push(...res);
      }
      return acc;
    },

    async loadMemberSubmissions() {
      this.loadingMember = true;
      this.emailChecked = false;
      this.validMember = false;
      this.memberName = "";
      this.memberSubmissions = [];
      this.teamSubmissions = [];
      this.memberTeamNames = [];

      const raw = (this.form.email || "").trim();
      if (!raw) {
        this.loadingMember = false;
        return;
      }

      const email = raw.toLowerCase();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!isEmail) {
        this.emailChecked = true;
        this.validMember = false;
        this.error = "Please enter a valid email address.";
        this.loadingMember = false;
        return;
      }

      try {
        // 1) Member lookup (case-insensitive)
        const members = await fetchTable("Members", {
          filterByFormula: `LOWER({Email}) = LOWER("${email.replace(/"/g, '\\"')}")`,
          maxRecords: 1,
        });

        if (!Array.isArray(members) || members.length === 0) {
          this.emailChecked = true;
          this.validMember = false;
          return;
        }

        const member = members[0];
        const memberId = member.id;
        this.memberName = member.fields?.Name || "";
        this.validMember = true;

        // 2) Get the member's linked submission IDs directly from the Member row
        const linkedIds =
          Array.isArray(member.fields?.Submissions) ? member.fields.Submissions : [];
        // 3) Fetch those submissions by ID
        this.memberSubmissions = await this.fetchSubmissionsByIds(linkedIds);

        // 4) Team submissions: by team name(s)
        const teamNames =
          Array.isArray(member.fields?.["Team Name"])
            ? member.fields["Team Name"].filter(Boolean)
            : (member.fields?.["Team Name"] ? [member.fields["Team Name"]] : []);

        this.memberTeamNames = teamNames;

        if (teamNames.length > 0) {
          const parts = teamNames.map(
            (tn) => `LOWER({Team Name} & "") = LOWER("${String(tn).replace(/"/g, '\\"')}")`
          );
          const teamFormula = `OR(${parts.join(",")})`;

          const teamRes = await fetchTable("Submissions", {
            filterByFormula: teamFormula,
            maxRecords: 500,
          });
          this.teamSubmissions = Array.isArray(teamRes) ? teamRes : [];
        }

        this.emailChecked = true;
      } catch (err) {
        console.error("Error fetching submissions:", err);
        this.memberSubmissions = [];
        this.teamSubmissions = [];
        this.memberTeamNames = [];
        this.emailChecked = true;
        this.validMember = false;
        this.error = "Something went wrong validating your email. Please try again.";
      } finally {
        this.loadingMember = false;
      }
    },

    onChallengeChange() {
      this.currentChallenge = this.selectedChallenge || null;
      if (!this.currentChallenge || this.currentChallenge["Reflection Required?"] !== "Yes") {
        this.form.notes = "";
      }
      if (!this.currentChallenge || this.currentChallenge["Picture Required?"] !== "Yes") {
        this.form.file = null;
        this.form.fileDataUrl = "";
      }
    },

    handleFileChange(e) {
      const f = e.target.files?.[0] || null;
      this.form.file = f;
      this.form.fileDataUrl = "";
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => { this.form.fileDataUrl = reader.result; };
      reader.readAsDataURL(f);
    },

    closeSuccessModal() {
      this.showSuccessModal = false;
    },

    async handleSubmit() {
      try {
        this.status = "";
        this.error = "";
        this.submitting = true;

        let proofUrl = "";

        if (this.form.fileDataUrl) {
          const uploadRes = await fetch("/.netlify/functions/upload-proof", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file: this.form.fileDataUrl,
              member: this.form.email,
              challenge: this.form.challengeId,
            }),
          });

          const uploadJson = await uploadRes.json();
          if (!uploadRes.ok || !uploadJson.url) {
            throw new Error(uploadJson.error || "Proof upload failed");
          }
          proofUrl = uploadJson.url;
        }

        const res = await fetch("/.netlify/functions/submit-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: this.form.email,
            challengeId: this.form.challengeId,
            notes: this.form.notes,
            proofUrl,
            shareReflection: this.form.shareReflection ? "Yes" : "No",
          }),
        });

        const json = await res.json();

        if (!res.ok) {
          if (res.status === 404 && json?.error?.toLowerCase().includes("member not found")) {
            throw new Error(`Your email doesn't match our records.${this.emailDomainHint}`);
          }
          throw new Error(json.error || "Submission failed");
        }

        this.showSuccessModal = true;
        this.status = "Challenge submitted successfully! Pending approval.";

        // Reset form + state
        this.form = { email: "", challengeId: "", notes: "", file: null, fileDataUrl: "" };
        this.currentChallenge = null;
        this.memberSubmissions = [];
        this.teamSubmissions = [];
        this.memberTeamNames = [];
        this.emailChecked = false;
        this.validMember = false;
      } catch (err) {
        console.error("Submit error:", err);
        this.error = err.message || "Error submitting challenge. Contact an admin if the issue persists.";
      } finally {
        this.submitting = false;
      }
    },
  },

  mounted() {
    this.loadChallenges();
  },
};
</script>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
