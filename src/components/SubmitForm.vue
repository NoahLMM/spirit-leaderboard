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
            placeholder="abc123@case.edu"
            class="w-full p-3 pr-12 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            @blur="loadMemberSubmissions"
            :disabled="loadingMember || submitting"
          />
          <!-- Inline spinner while validating email / fetching submissions -->
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
          Please enter a valid, known Case email.
        </p>
      </div>

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
            {{ c['Challenge Name'] || 'Unnamed Challenge' }}
            <span v-if="isTeamChallenge(c)"> (Team)</span>
          </option>
        </select>
      </div>
      <p v-else-if="emailChecked && validMember" class="text-sm text-gray-300">
        You’ve completed all available challenges 🎉 Check back later for new ones!
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
  </div>
</template>

<script>
import { fetchTable } from "../api/fetchTables";

const DEBUG = false; // set true to see logs

export default {
  data() {
    return {
      rawChallenges: [],
      memberSubmissions: [],   // this member's submissions
      teamSubmissions: [],     // submissions by anyone on the member's team
      memberTeamNames: [],     // team names from Members row (lookup)
      validMember: false,
      emailChecked: false,
      loadingChallenges: false,
      loadingMember: false,
      form: {
        email: "",
        challengeId: "",
        notes: "",
        file: null,
        fileDataUrl: "",
      },
      currentChallenge: null,
      submitting: false,
      status: "",
      error: "",
    };
  },

  computed: {
    normalizedChallenges() {
      if (!Array.isArray(this.rawChallenges)) return [];
      return this.rawChallenges.map((r) =>
        r?.fields ? { id: r.id, ...r.fields } : r
      );
    },

    selectedChallenge() {
      return this.normalizedChallenges.find((c) => c.id === this.form.challengeId);
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

      const completedByMember = new Set();
      this.memberSubmissions.forEach((s) => {
        this.extractChallengeIds(s).forEach((id) => completedByMember.add(id));
      });

      const completedByTeam = new Set();
      this.teamSubmissions.forEach((s) => {
        this.extractChallengeIds(s).forEach((id) => completedByTeam.add(id));
      });

      if (DEBUG) {
        console.log("[DBG] completedByMember:", Array.from(completedByMember));
        console.log("[DBG] completedByTeam:", Array.from(completedByTeam));
      }

      return this.normalizedChallenges.filter((c) => {
        const repeatable = c["Repeatable?"] === "Yes" || c["Repeatable?"] === true;
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
    isTeamChallenge(challenge) {
      const v = challenge?.["Team?"];
      return v === "Yes" || v === true || v === 1;
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
        const records = await fetchTable("Challenges");
        this.rawChallenges = Array.isArray(records) ? records : [];
      } catch (err) {
        console.error("Error fetching challenges:", err);
        this.error = "Could not load challenges.";
      } finally {
        this.loadingChallenges = false;
      }
    },

    // Utility: fetch Submission records by record IDs (batched)
    async fetchSubmissionsByIds(ids = []) {
      if (!ids.length) return [];

      const chunk = (arr, size) => {
        const out = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
      };

      const batches = chunk(ids, 50);
      const results = [];

      for (const group of batches) {
        const orParts = group.map((id) => `RECORD_ID() = "${id.replace(/"/g, '\\"')}"`);
        const formula = `OR(${orParts.join(",")})`;
        const res = await fetchTable("Submissions", { filterByFormula: formula });
        if (Array.isArray(res)) results.push(...res);
      }

      return results;
    },

    /**
     * Flow:
     *  - Find Member by email (case-insensitive)
     *  - Read that member row's linked "Submissions" (IDs)
     *  - Read that member row's "Team Name" (lookup text, usually array)
     *  - Fetch those Submission records by ID (memberSubmissions)
     *  - Fetch all submissions for the member's Team by MATCHING TEAM NAME (not ID)
     */
    async loadMemberSubmissions() {
      this.emailChecked = false;
      this.validMember = false;

      const raw = (this.form.email || "").trim();
      if (!raw) return;

      const email = raw.toLowerCase();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!isEmail) {
        this.memberSubmissions = [];
        this.teamSubmissions = [];
        this.memberTeamNames = [];
        this.emailChecked = true;
        this.validMember = false;
        this.error = "Please enter a valid email address.";
        return;
      }

      this.loadingMember = true;
      try {
        // 1) Member lookup by email
        const members = await fetchTable("Members", {
          filterByFormula: `LOWER({Email}) = LOWER("${email.replace(/"/g, '\\"')}")`,
          maxRecords: 1,
        });

        if (!Array.isArray(members) || members.length === 0) {
          this.memberSubmissions = [];
          this.teamSubmissions = [];
          this.memberTeamNames = [];
          this.emailChecked = true;
          this.validMember = false;
          return;
        }

        const member = members[0]; // { id, fields }
        const linkedSubmissionIds = Array.isArray(member.fields?.Submissions)
          ? member.fields.Submissions
          : [];
        // Team names from Members (lookup). Samples showed ["Mistletoe"] etc.
        const teamNamesRaw = member.fields?.["Team Name"];
        this.memberTeamNames = Array.isArray(teamNamesRaw)
          ? teamNamesRaw.filter(Boolean)
          : (teamNamesRaw ? [teamNamesRaw] : []);

        this.validMember = true;

        // 2) Fetch the member's Submission records by ID
        const submissions = await this.fetchSubmissionsByIds(linkedSubmissionIds);
        this.memberSubmissions = Array.isArray(submissions) ? submissions : [];

        // 3) Fetch all submissions for the member's Team(s) by NAME
        //    NOTE: in Airtable, ARRAYJOIN({Team Name}) contains the names, not IDs.
        //    We'll build an OR() of LOWER({Team Name}) = LOWER("name") to be robust.
        let teamSubs = [];
        if (this.memberTeamNames.length) {
          const orParts = this.memberTeamNames.map((n) =>
            `LOWER({Team Name}) = LOWER("${String(n).replace(/"/g, '\\"')}")`
          );
          const formula =
            orParts.length === 1 ? orParts[0] : `OR(${orParts.join(",")})`;

          if (DEBUG) console.log("[DBG] team formula:", formula);

          const res = await fetchTable("Submissions", { filterByFormula: formula });
          teamSubs = Array.isArray(res) ? res : [];
        }
        this.teamSubmissions = teamSubs;

        if (DEBUG) {
          console.log("[DBG] memberSubmissions:", this.memberSubmissions.length);
          console.log("[DBG] teamSubmissions:", this.teamSubmissions.length);
          console.log("[DBG] teamNames:", this.memberTeamNames);
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
      reader.onload = () => {
        this.form.fileDataUrl = reader.result;
      };
      reader.readAsDataURL(f);
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
          }),
        });

        const json = await res.json();

        if (!res.ok) {
          if (res.status === 404 && json?.error?.toLowerCase().includes("member not found")) {
            throw new Error("Your email doesn't match our records. Use your Case email (abc123@case.edu).");
          }
          throw new Error(json.error || "Submission failed");
        }

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
        this.error = err.message || "Error submitting challenge. Contact NCC if issue persists.";
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
