<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard title="설비 등록">
    <v-row class="mb-4">
      <v-col cols="6">
        <v-text-field label="설비코드" v-model.trim="form.code" dense outlined readonly />
      </v-col>

      <v-col cols="6">
        <v-text-field label="설비명" v-model.trim="form.name" dense outlined />
      </v-col>

      <v-col cols="6">
        <v-select
          label="설비유형"
          v-model="form.type"
          :items="typeItems"
          item-title="code_name"
          item-value="code"
          dense
          outlined
          clearable
          placeholder="유형 선택"
        />
      </v-col>

      <v-col cols="6">
        <v-text-field label="제조사" v-model.trim="form.maker" dense outlined />
      </v-col>

      <v-col cols="12">
        <v-label class="mb-2 d-block">사용유무</v-label>
        <v-radio-group v-model="form.useYn" inline>
          <v-radio label="사용" value="사용" />
          <v-radio label="정지" value="정지" />
        </v-radio-group>
      </v-col>

      <v-col cols="6">
        <v-text-field label="설비 제조일" v-model="form.makeDate" type="date" dense outlined />
      </v-col>

      <v-col cols="6">
        <v-text-field label="설비 설치일" v-model="form.installDate" type="date" dense outlined />
      </v-col>

      <v-col cols="6">
        <v-text-field label="점검 주기(일)" v-model.number="form.checkCycle" type="number" min="0" dense outlined />
      </v-col>

      <v-col cols="6">
        <v-text-field label="담당자" v-model.trim="form.manager" dense outlined />
      </v-col>
    </v-row>

    <v-row justify="end">
      <v-btn color="primary" @click="sign" :loading="loading" :disabled="loading || !canSubmit"> 등록 </v-btn>
    </v-row>
  </UiParentCard>
</template>

<script setup>
import { ref, shallowRef, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const router = useRouter();

const http = axios.create({
  baseURL: 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' }
});

const EP = {
  nextId: '/facility/next-id',
  codesFC: '/common/codes/FC',
  insert: '/facilityInsert',
  list: '/facility'
};

const apiTry = async (method, path, data = null) => {
  try {
    const urlWithApi = '/api' + path;
    return await http.request({ method, url: urlWithApi, data });
  } catch (e) {
    if (e?.response?.status === 404) {
      return await http.request({ method, url: path, data });
    }
    throw e;
  }
};

const form = reactive({
  code: '',
  name: '',
  type: '',
  useYn: '사용',
  maker: '',
  makeDate: '',
  installDate: '',
  checkCycle: '',
  manager: ''
});
const typeItems = ref([]);
const loading = ref(false);

const canSubmit = computed(() => !!form.name && !!form.type);

const toNull = (v) => (v === '' || v === undefined ? null : v);
const toIntOrNull = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/* ========= 초기 로딩 ========= */
onMounted(async () => {
  try {
    const [idRes, codeRes] = await Promise.all([apiTry('get', EP.nextId), apiTry('get', EP.codesFC)]);
    form.code = idRes?.data?.FAC_ID || '';
    typeItems.value = Array.isArray(codeRes?.data) ? codeRes.data : [];
  } catch (e) {
    console.error(e);
    alert('초기 로딩 실패: ' + (e?.response?.data?.error || e?.message));
  }
});

/* ========= 등록 ========= */
const sign = async () => {
  if (!canSubmit.value) {
    alert('(설비명/설비유형)을 확인하세요.');
    return;
  }

  const payload = {
    FAC_NAME: toNull(form.name),
    FAC_TYPE: toNull(form.type),
    FAC_USE: form.useYn === '사용' ? 1 : 0,
    FAC_COMPANY: toNull(form.maker),
    FAC_MDATE: toNull(form.makeDate),
    FAC_IDATE: toNull(form.installDate),
    FAC_CHECKDAY: toIntOrNull(form.checkCycle),
    MANAGER: toNull(form.manager)
  };

  try {
    loading.value = true;

    // 1) 등록
    const res = await apiTry('post', EP.insert, payload);
    if (!res?.data?.ok) throw new Error('등록 실패');

    const listRes = await apiTry('get', EP.list);
    const rows = Array.isArray(listRes?.data) ? listRes.data : [];
    const created = rows.find((r) => (r.FAC_ID ?? '') === (form.code ?? ''));

    const prId = created?.PR_ID || '';

    alert('설비 등록 완료!');

    const LIST_ROUTE = '/utils/List';
    if (prId) {
      router.push({ path: LIST_ROUTE, query: { proc: prId } });
    } else {
      router.push({ path: LIST_ROUTE });
    }
  } catch (err) {
    console.error(err);
    alert(err?.response?.data?.error || err?.message || '등록 실패');
  } finally {
    loading.value = false;
  }
};

const page = ref({ title: '설비 정보 관리' });
const breadcrumbs = shallowRef([
  { title: '설비', disabled: true, href: '#' },
  { title: '설비 등록', disabled: false, href: '#' }
]);
</script>
