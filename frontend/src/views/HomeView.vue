<template>
  <BaseContainer class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6">
        <v-card>
          <v-card-title class="text-h5 text-center">
            {{ $t('app.welcome') }}
          </v-card-title>
          <v-card-text class="text-center card-gap">
            <p class="mb-4">{{ $t('app.title') }}</p>
            <v-btn color="primary" to="/book" size="large" class="mr-2">
              {{ $t('appointments.book') }}
            </v-btn>
            <v-btn variant="outlined" to="/login" size="large">
              {{ $t('nav.login') }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </BaseContainer>
</template>

<script setup lang="ts">
</script>
