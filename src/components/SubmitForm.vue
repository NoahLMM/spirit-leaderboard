<!-- src/components/SubmitForm.vue -->
<template>
  <div class="max-w-2xl p-6 mx-auto bg-gray-800 rounded-lg shadow-lg">
    <h2 class="mb-6 text-3xl font-extrabold text-white">Submit a Challenge</h2>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Email -->
      <div>
        <label class="block mb-1 text-gray-200">Your Email</label>
        <input
          v-model="form.email"
          type="email"
          required
          placeholder="example@school.edu"
          class="w-full p-3 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Challenge -->
      <div>
        <label class="block mb-1 text-gray-200">Select Challenge</label>
        <select
          v-model="form.challengeId"
          required
          @change="onChallengeChange"
          class="w-full p-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select a Challenge --</option>
          <option
            v-for="c in normalizedChallenges"
            :key="c.id"
            :value="c.id"
          >
            {{ c['Challenge Name'] || 'Unnamed Challenge' }}
          </option>
        </select>
      </div>

      <!-- Notes / Reflection (only if required) -->
      <div v-if="currentChallenge && currentChallenge['Reflection Required?'] === 'Yes'">
        <label class="block mb-1 text-gray-200">Notes / Reflection</label>
        <textarea
          v-model="form.notes"
          placeholder="Write your reflection or any notes..."
          class="w-full p-3 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="4"
        ></textarea>
      </div>

      <!-- Proof upload (only if required) -->
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
        />
        <span v-if="form.file" class="ml-3 text-gray-300 truncate">{{ form.file.name }}</span>
      </div>

      <!-- Submit -->
      <button
        type="submit"
        class="px-5 py-2.5 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-60"
        :disabled="submitting || disableSubmit"
      >
        {{ submitting ? 'Submitting…' : 'Submit Challenge' }}
      </button>

      <!-- Status / Error -->
      <p v-if="status" class="text-green-400">{{ status }}</p>
      <p v-if="error" class="text-red-400">{{ error }}</p>
    </form>
  </div>
</template>

<script>
import { fetchTable } from "../api/fetchTables";

export default {
  data() {
    return {
      rawChallenges: [],
      form: {
        email: "",
        challengeId: "",
        notes: "",
        file: null,
      },
      currentChallenge: null,
      submitting: false,
      status: "",
      error: "",
    };
  },

  computed: {
    // Works whether each record is { id, fields } or { id, ...fields }
    normalizedChallenges() {
      if (!Array.isArray(this.rawChallenges)) return [];
      return this.rawChallenges.map((r) =>
        r?.fields ? { id: r.id, ...r.fields } : r
      );
    },

    // Selected challenge (normalized)
    selectedChallenge() {
      return this.normalizedChallenges.find((c) => c.id === this.form.challengeId);
    },

    // Alias we can rely on in the template
    currentChallengeSafe() {
      return this.selectedChallenge || null;
    },

    // Disable submit if required fields for this challenge aren’t satisfied
    disableSubmit() {
      const c = this.selectedChallenge;
      if (!c) return true;
      if (c["Reflection Required?"] === "Yes" && !this.form.notes.trim()) return true;
      if (c["Picture Required?"] === "Yes" && !this.form.file) return true;
      return false;
    },
  },

  methods: {
    async loadChallenges() {
      try {
        const records = await fetchTable("Challenges");
        // Expecting array; keep raw so we can normalize in computed
        this.rawChallenges = Array.isArray(records) ? records : [];
      } catch (err) {
        console.error("Error fetching challenges:", err);
        this.error = "Could not load challenges.";
      }
    },

    onChallengeChange() {
      this.currentChallenge = this.selectedChallenge || null;
      // Reset conditional fields when changing challenge
      if (!this.currentChallenge || this.currentChallenge["Reflection Required?"] !== "Yes") {
        this.form.notes = "";
      }
      if (!this.currentChallenge || this.currentChallenge["Picture Required?"] !== "Yes") {
        this.form.file = null;
      }
    },

    // Convert selected file -> base64 data URL
    handleFileChange(e) {
      const f = e.target.files?.[0] || null;
      this.form.file = f;
      this.form.fileDataUrl = "";

      if (!f) return;

      const reader = new FileReader();
      reader.onload = () => {
        // result is like "data:image/png;base64,iVBORw0KGgo..."
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
       member: this.form.email, // optional if you want to keep it
       challenge: this.form.challengeId, // optional
     }),
   });

   const uploadJson = await uploadRes.json();
   if (!uploadRes.ok || !uploadJson.url) {
     throw new Error(uploadJson.error || "Proof upload failed");
   }
   proofUrl = uploadJson.url;
 }

        // 2) Submit record to Airtable (backend links email -> Member)
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
          // Friendlier error if the backend couldn't find the member by email
          if (res.status === 404 && json?.error?.toLowerCase().includes("member not found")) {
            throw new Error("We couldn’t find your email in Members. Please check spelling or contact an admin.");
          }
          throw new Error(json.error || "Submission failed");
        }

        this.status = "Challenge submitted successfully! Pending approval.";
        this.form = { email: "", challengeId: "", notes: "", file: null };
        this.currentChallenge = null;
      } catch (err) {
        console.error("Submit error:", err);
        this.error = err.message || "Error submitting challenge.";
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
