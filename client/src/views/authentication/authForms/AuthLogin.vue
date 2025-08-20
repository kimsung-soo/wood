<script setup lang="ts">
import { ref } from 'vue';
// import Google from '@/assets/images/auth/social-google.svg';
import { useAuthStore } from '@/stores/auth';
import { Form } from 'vee-validate';

const valid = ref(false);
const show1 = ref(false);
// const logform = ref();
const password = ref('');
const email = ref('');

/* eslint-disable @typescript-eslint/no-explicit-any */
function validate(values: any, { setErrors }: any) {
  const authStore = useAuthStore();
  return authStore.login(email.value, password.value).catch((error) => setErrors({ apiError: error }));
}
</script>

<template>
  <v-row>
    <v-divider class="custom-devider" />
  </v-row>
  <img src="../../../assets/images/logos/gg.svg" alt="" style="width: 20rem; margin: 0.5rem 0 0.5rem 2.4rem" />
  <Form @submit="validate" class="mt-7 loginForm" v-slot="{ errors, isSubmitting }">
    <v-text-field
      v-model="email"
      label="이메일을 입력하세요."
      class="mt-4 mb-8"
      required
      density="comfortable"
      hide-details="auto"
      variant="outlined"
      color="primary"
    ></v-text-field>
    <v-text-field
      v-model="password"
      label="비밀번호를 입력하세요."
      :rules="[(v) => !!v || '비밀번호를 입력해주세요.', (v) => v.length >= 6 || '6자 이상 입력해주세요.']"
      required
      density="comfortable"
      variant="outlined"
      color="primary"
      hide-details="auto"
      :append-icon="show1 ? '$eye' : '$eyeOff'"
      :type="show1 ? 'text' : 'password'"
      @click:append="show1 = !show1"
      class="pwdInput"
    ></v-text-field>

    <div class="d-sm-flex align-center mt-2 mb-7 mb-sm-0">
      <div class="ml-auto"></div>
    </div>
    <v-btn color="secondary" :loading="isSubmitting" block class="mt-2" variant="flat" size="large" :disabled="valid" type="submit">
      로그인</v-btn
    >
    <div v-if="errors.apiError" class="mt-2">
      <v-alert color="error">사원번호 및 비밀번호가 일치하지 않습니다.</v-alert>
    </div>
  </Form>
</template>

<style lang="scss">
.custom-devider {
  border-color: rgba(0, 0, 0, 0.08) !important;
}
.googleBtn {
  border-color: rgba(0, 0, 0, 0.08);
  margin: 30px 0 20px 0;
}
.outlinedInput .v-field {
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: none;
}
.orbtn {
  padding: 2px 40px;
  border-color: rgba(0, 0, 0, 0.08);
  margin: 20px 15px;
}
.pwdInput {
  position: relative;
  .v-input__append {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
  }
}
.loginForm {
  .v-text-field .v-field--active input {
    font-weight: 500;
  }
}
</style>
