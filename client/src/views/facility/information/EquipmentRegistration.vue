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
      <v-btn color="primary" @click="sign" :loading="loading" :disabled="loading || !canSubmit">등록</v-btn>
    </v-row>
  </UiParentCard>
</template>

<script setup>
import { ref, shallowRef, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { useAuthStore } from '@/stores/auth';

// 로그인 세션 정보
const authStore = useAuthStore();
const router = useRouter();

const http = axios.create({
  baseURL: 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' }
});

// 엔드포인트 모음
const EP = {
  nextId: '/facility/next-id',
  codesFC: '/common/codes/FC',
  insert: '/facilityInsert',
  list: '/facility'
};

const apiTry = async (method, path, data = null) => {
  try {
    return await http.request({ method, url: '/api' + path, data });
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
  type: '', // FAC_TYPE: '01', '02', ...
  useYn: '사용',
  maker: '',
  makeDate: '',
  installDate: '',
  checkCycle: '',
  manager: authStore.user?.name || ''
});
const typeItems = ref([]); // [{ code:'01', code_name:'재단 설비', sort_order:1 }, ...]
const loading = ref(false);

// 필수값
const canSubmit = computed(() => !!form.name && !!form.type);

const toNull = (v) => (v === '' || v === undefined ? null : v);
const toIntOrNull = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// '01' -> 1 -> '001'
const pad3 = (n) => String(n).padStart(3, '0');

// FAC_TYPE('01','02',...) → PR_ID('PRC-001','PRC-002',...) 변환
const facTypeToPrId = (facType) => {
  const m = String(facType ?? '').match(/\d+/); // '01'에서 숫자만 추출
  const num = Number(m?.[0]);
  if (!Number.isFinite(num)) return null;
  return `PRC-${pad3(num)}`;
};

// 신규 설비코드, 유형코드 목록
onMounted(async () => {
  try {
    const [idRes, codeRes] = await Promise.all([apiTry('get', EP.nextId), apiTry('get', EP.codesFC)]);
    form.code = idRes?.data?.FAC_ID || '';
    // 서버 응답 정렬 보정(옵션)
    const rows = Array.isArray(codeRes?.data) ? codeRes.data : [];
    typeItems.value = rows.sort((a, b) => {
      const ao = Number.isFinite(Number(a?.sort_order)) ? Number(a.sort_order) : 9999;
      const bo = Number.isFinite(Number(b?.sort_order)) ? Number(b.sort_order) : 9999;
      if (ao !== bo) return ao - bo;
      return String(a?.code_name || '').localeCompare(String(b?.code_name || ''));
    });
  } catch (e) {
    console.error(e);
    alert('초기 로딩 실패: ' + (e?.response?.data?.error || e?.message));
  }
});

// 등록 처리 (FAC_TYPE 기준 PR_ID 동시 저장)
const sign = async () => {
  if (!canSubmit.value) return alert('(설비명/설비유형)을 확인하세요.');

  // ★ 핵심: FAC_TYPE → PR_ID 매핑
  const prId = facTypeToPrId(form.type);
  if (!prId) {
    alert('공정(PR_ID) 매핑 실패: 설비유형을 다시 선택하세요.');
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
    PR_ID: prId, // ← PRC-001, PRC-002, ...
    MANAGER: toNull(form.manager)
  };

  try {
    loading.value = true;

    // 1) 등록
    const res = await apiTry('post', EP.insert, payload);
    const newId = res?.data?.FAC_ID;
    if (!newId) throw new Error(res?.data?.error || '등록 실패');
    form.code = newId;

    alert('설비 등록 완료!');

    // 2) 목록 화면으로 이동 (proc에 같은 PR_ID로 필터)
    const LIST_ROUTE = '/utils/List';
    router.push({ path: LIST_ROUTE, query: { proc: prId } });
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
