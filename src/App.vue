<template>
  <div class="min-h-screen text-gray-100 bg-gray-900">
    <nav class="flex justify-between p-4 bg-gray-800 shadow">
      <a href="/" class="text-lg font-bold">{{ siteTitle }}</a>
      <div class="space-x-4">
        <router-link to="/" class="hover:underline">Home</router-link>
        <router-link to="/submit" class="hover:underline">Submit</router-link>
        <router-link to="/challenges" class="hover:underline">Challenges</router-link>
      </div>
    </nav>

    <main class="p-6">
      <router-view />
          <Footer />
    </main>
  </div>


</template>


<script>
import Footer from "./components/Footer.vue";
import { config } from "./config";

export default {
  components: { Footer },
  data() {
    return { siteTitle: config.siteTitle };
  },
};
</script>