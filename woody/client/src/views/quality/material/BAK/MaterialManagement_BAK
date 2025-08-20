<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  <UiParentCard title="원자재 검수관리 등록">
    <!-- 검사 기준표 -->
    <v-table class="mb-4" density="compact">
      <thead>
        <tr>
          <th class="text-center" width="120">검사명</th>
          <th class="text-center">허용수치</th>
          <th class="text-center">미달수치</th>
          <th class="text-center" width="120">판정</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, i) in criteria" :key="i">
          <td class="text-center">{{ item.label }}</td>
          <td>{{ item.allow }}</td>
          <td>{{ item.reject }}</td>
          <td>
            <v-radio-group v-model="item.result" row>
              <v-radio label="합격" value="합격" />
              <v-radio label="불합격" value="불합격" />
            </v-radio-group>
          </td>
        </tr>
      </tbody>
    </v-table>
    <!-- 처리 상태 -->
    <v-row dense>
      <v-col>
        <v-radio-group v-model="status" row>
          <v-radio label="합격" value="합격" />
          <v-radio label="불합격" value="불합격" />
        </v-radio-group>
      </v-col>
    </v-row>
    <!-- 입력폼 하단 -->
    <v-table density="compact">
      <thead>
        <tr>
          <th>원자재검사번호</th>
          <th>입고번호</th>
          <th>원자재코드</th>
          <th>원자재명</th>
          <th>총수량</th>
          <th>합격수량</th>
          <th>작성자</th>
          <th>입고일자</th>
          <th>검사완료일자</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><v-text-field v-model="form.id" dense readonly variant="plain" /></td>
          <td><v-text-field v-model="form.inNo" dense readonly variant="plain" /></td>
          <td><v-text-field v-model="form.materialCode" dense readonly variant="plain" /></td>
          <td><v-text-field v-model="form.materialName" dense readonly variant="plain" /></td>
          <td><v-text-field v-model="form.totalQty" dense readonly variant="plain" /></td>
          <td><v-text-field v-model="form.passQty" dense readonly variant="plain" /></td>
          <td><v-text-field v-model="form.user" dense readonly variant="plain" /></td>
          <td><v-text-field v-model="form.inDate" dense readonly variant="plain" /></td>
          <td><v-text-field v-model="form.doneDate" dense readonly variant="plain" /></td>
        </tr>
      </tbody>
    </v-table>
    <!-- 버튼 -->
    <v-row class="mt-4" justify="end">
      <v-btn color="error" variant="outlined" class="mr-2" @click="resetForm">초기화</v-btn>
      <v-btn color="primary" @click="saveForm">등록</v-btn>
    </v-row>
  </UiParentCard>
</template>

<script setup lang="ts">
import { ref, shallowRef, reactive } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: '원자재' });
const breadcrumbs = shallowRef([
  { title: '품질', disabled: true, href: '#' },
  { title: '원자재 검수관리 등록', disabled: false, href: '#' }
]);

// 검사 기준 항목 (여기서 직접 라벨, 허용/미달 값 세팅)
const criteria = reactive([
  {
    label: '함수율',
    allow: '수분 함량이 12 ~ 15% 이하(KS 기준 범위)',
    reject: '수분 함량이 15% 초과',
    result: ''
  },
  {
    label: '외관결점',
    allow: '옹이 지름 150MM 이하, 활결 길이 50% 이하, 활 전체길이의 1% 이하',
    reject: '셋 수치 모두 해당 수치 초과',
    result: ''
  },
  {
    label: '치수정밀도',
    allow: '입고자재에서 ± 2mm 이내',
    reject: '입고자재에서 ± 2mm 초과',
    result: ''
  },
  {
    label: '강도',
    allow: 'KS F 2207(압축, 인장, 휨 등 강도 시험법)에 의거 횡강도 35MPa 이상',
    reject: '횡강도 35MPa 미만',
    result: ''
  },
  {
    label: '외관/표면 결함',
    allow: '외관, 흠집, 기포, 오염에 대해 육안확인 시 결점이 없음',
    reject: '외관, 흠집, 기포, 오염에 대해 육안확인 시 결점이 보임',
    result: ''
  }
]);

// 하단 폼
const form = reactive({
  id: '(자동입력)',
  inNo: '(자동입력)',
  materialCode: '(자동입력)',
  materialName: '(자동입력)',
  totalQty: 40,
  passQty: 30,
  user: '사람1',
  inDate: '2025-07-30',
  doneDate: '2025-07-30'
});

const status = ref('합격');

function resetForm() {
  criteria.forEach((c) => (c.result = ''));
  status.value = '합격';
}

function saveForm() {
  // 실제 저장 로직
  alert('등록되었습니다!');
}
</script>
