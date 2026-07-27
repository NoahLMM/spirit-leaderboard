<!-- src/components/Footer.vue -->
<template>
  <footer class="pt-4 mt-12 text-sm text-center text-gray-400 border-t border-gray-700">
    <p v-if="footerText">{{ footerText }}</p>
    <p>
      Powered by
      <a
        href="https://github.com/NoahLMM/spirit-leaderboard"
        target="_blank"
        rel="noopener noreferrer"
        class="underline hover:text-gray-200"
      >Spirit Challenge</a>, an open-source project.
    </p>
  </footer>
</template>

<script>
import { config } from "../config";

export default {
  name: "Footer",
  data() {
    return { footerText: config.footerText };
  },
};
</script>
