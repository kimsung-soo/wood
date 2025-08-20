<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  <UiParentCard>
    <!-- 상단 버튼 -->
    <v-row>
      <!-- 왼쪽: 셀렉트 -->
      <v-col cols="3">
        <v-select v-model="search.type" :items="['완제품', '반제품', '원목', '합판']" label="제품 구분" density="compact" />
      </v-col>

      <!-- 오른쪽: 버튼들 -->
      <v-col cols="auto" class="d-flex justify-end">
        <v-btn class="ml-2" color="primary" @click="saveForm">등록</v-btn>
      </v-col>
    </v-row>

    <!-- 상단 그리드: 카테고리 목록 -->
    <div class="grid-wrap">
      <ag-grid-vue
        :theme="quartz"
        style="height: 420px; width: 100%"
        :columnDefs="colDefs"
        :rowData="currentRowData"
        :defaultColDef="defaultColDef"
        rowSelection="single"
        :suppressRowClickSelection="false"
        @grid-ready="onMainGridReady"
        @selection-changed="onMainSelectionChanged"
        @cell-value-changed="onMainCellValueChanged"
      />
    </div>
    <br />

    <!-- 하단 그리드: 선택행 1건 (선택된 행이 있을 때만 표시) -->
    <div v-if="selectedRow" class="grid-wrap" style="margin-top: 12px">
      <div style="padding: 10px; background-color: #f5f5f5; font-weight: bold">선택한 기준</div>
      <v-row justify="end" class="mb-2 pa-2">
        <v-btn color="error" class="top_btn_ser" variant="elevated" @click="resetDetailForm">입력초기화</v-btn>
        <v-btn color="primary" class="top_btn_ser" @click="applyChanges">상단에 반영</v-btn>
      </v-row>
      <ag-grid-vue
        style="height: 120px"
        :theme="quartz"
        :rowData="detailRows"
        :columnDefs="detailColDefs"
        :defaultColDef="detailDefaultColDef"
        :singleClickEdit="true"
        @cell-value-changed="onDetailCellValueChanged"
      />
    </div>
  </UiParentCard>
</template>

<script setup>
import { ref, shallowRef, computed, watch, nextTick } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);
const quartz = themeQuartz;

// 페이지 정보 수정
const page = ref({ title: '품질 기준 관리' });
const breadcrumbs = shallowRef([
  { title: '품질', disabled: true, href: '#' },
  { title: '품질 기준 관리', disabled: false, href: '#' }
]);

// 카테고리별 기준 데이터
const dataMap = ref({
  완제품: [
    { id: 1, 기준: '함수율', 검사내용: '수분 함량 검사', 허용수치: '수분 함량이 12 ~ 13% 이하' },
    { id: 2, 기준: '치수정밀도', 검사내용: '전체 외형치수, 가공 및 조립 후 치수', 허용수치: '입고자재에서 ± 2mm 이내' },
    { id: 3, 기준: '강도/내구성', 검사내용: '하중, 휨, 낙하, 반복 사용시험(횡강도, 압축)', 허용수치: '횡강도 35MPa 이상' },
    {
      id: 4,
      기준: '안정성',
      검사내용: '전도방지, 전기부 위험, 모서리 안전성 시험',
      허용수치: '전도 없음, 전기부 안전, 모서리 둥글림 위험요소 없음'
    },
    { id: 5, 기준: '외관 결정', 검사내용: '옹이, 훼절, 균열 등 외관', 허용수치: '옹이, 훼절, 균열 유약확인 시 결점이 없을 시' },
    { id: 6, 기준: '포름알데히드 방출량', 검사내용: '완/반제품 목재의 포름알데히드 방출 시험', 허용수치: '친환경 E0 등급(0.3mg/L)이하' },
    {
      id: 7,
      기준: '표면 마감/도장',
      검사내용: '도막 균일성, 접착력, 내마모성 검사',
      허용수치: '도막 들뜸·박리 없음, 균일한 색상·광택 유지'
    }
  ],
  반제품: [
    { id: 1, 기준: '함수율', 검사내용: '수분 함량 검사', 허용수치: '수분 함량이 12 ~ 13% 이하' },
    { id: 2, 기준: '치수정밀도', 검사내용: '전체 외형치수, 가공 및 조립 후 치수', 허용수치: '입고자재에서 ± 2mm 이내' },
    { id: 3, 기준: '강도/내구성', 검사내용: '하중, 휨, 낙하, 반복 사용시험(횡강도, 압축)', 허용수치: '횡강도 35MPa 이상' },
    {
      id: 4,
      기준: '안정성',
      검사내용: '전도방지, 전기부 위험, 모서리 안전성 시험',
      허용수치: '전도 없음, 전기부 안전, 모서리 둥글림 위험요소 없음'
    },
    { id: 5, 기준: '외관 결정', 검사내용: '옹이, 훼절, 균열 등 외관', 허용수치: '옹이, 훼절, 균열 유약확인 시 결점이 없을 시' },
    { id: 6, 기준: '포름알데히드 방출량', 검사내용: '완/반제품 목재의 포름알데히드 방출 시험', 허용수치: '친환경 E0 등급(0.3mg/L)이하' },
    {
      id: 7,
      기준: '표면 마감/도장',
      검사내용: '도막 균일성, 접착력, 내마모성 검사',
      허용수치: '도막 들뜸·박리 없음, 균일한 색상·광택 유지'
    }
  ],
  원목: [
    { id: 1, 기준: '함수율', 검사내용: '수분 함량 검사', 허용수치: '수분 함량율이 12 ~ 15% 이하(KS 기준 범위)' },
    {
      id: 2,
      기준: '외관 결점',
      검사내용: '용이, 할렬, 휨 결점 확인',
      허용수치: '용이 지름 150MM 이하, 할렬 길이 50% 이하, 휨 전체길이의 1% 이하'
    },
    { id: 3, 기준: '치수정밀도', 검사내용: '두께, 너비, 길이 체크', 허용수치: '입고자재에서 ± 2mm 이내' },
    {
      id: 4,
      기준: '강도',
      검사내용: '인장, 굴곡, 압축강도 시험',
      허용수치: 'KS F 2207(압축, 인장, 휨 등 강도 시험법)에 의거 휨강도 35MPa 이상'
    },
    {
      id: 5,
      기준: '외관/표면 결함',
      검사내용: '외관, 흠집, 기포, 오염 확인',
      허용수치: '외관, 흠집, 기포, 오염에 대해 육안확인 시 결점이 없음'
    }
  ],
  합판: [
    { id: 1, 기준: '밀도', 검사내용: 'MDF 시편 무게/부피 측정 (일반 MDF 기준)', 허용수치: '무게 및 부피가 0.85 ~ 0.80g/cm³' },
    { id: 2, 기준: '함수율', 검사내용: '수분 함량 검사(KS 기준 범위)', 허용수치: '수분 함량이 5~13%' },
    { id: 3, 기준: '휨강도', 검사내용: '휨에 대한 저항력 시험(일반 MDF 기준)', 허용수치: '저항력이 23MPa 이상' },
    { id: 4, 기준: '두께/치수정밀도', 검사내용: '시편 두께, 길이, 폭 측정', 허용수치: '입고자재에서 ± 2mm 이내' },
    { id: 5, 기준: '표면 강도', 검사내용: '표면에 힘을 가해 강도 측정', 허용수치: '표면강도 1.0 N/mm² 이상' },
    { id: 6, 기준: '박리강도/접착강도', 검사내용: '시편 접합부 박리(떼어냄) 강도 시험', 허용수치: '강도가 0.24 N/mm² 이상' },
    { id: 7, 기준: '두께 팽창률', 검사내용: '흡수 후 두께 변화율(내수성)', 허용수치: '내수성이 12% 이하' },
    { id: 8, 기준: '포름알데히드방출량', 검사내용: '포름알데히드 방출량 시험', 허용수치: 'E0등급(0.5mg/L) 이하' },
    {
      id: 9,
      기준: '외관/표면 결함',
      검사내용: '외관, 흠집, 기포, 오염 확인',
      허용수치: '외관, 흠집, 기포, 오염에 대해 육안확인 시 결점이 없음'
    }
  ]
});

// 검색 조건 초기값 수정
const search = ref({ type: '완제품' });

// 현재 선택된 타입의 데이터
const currentRowData = computed(() => {
  return dataMap.value[search.value.type] || [];
});

// 상단 그리드 컬럼 정의
const colDefs = ref([
  { field: '기준', flex: 0.9, headerName: '기준', editable: false },
  { field: '검사내용', flex: 1.4, headerName: '검사내용', editable: false },
  { field: '허용수치', flex: 1.3, headerName: '허용수치', editable: false }
]);

// 상단 그리드 기본 설정
const defaultColDef = ref({
  resizable: true,
  sortable: true
});

// 하단 그리드 컬럼 정의
const detailColDefs = ref([
  {
    field: '기준',
    flex: 0.9,
    headerName: '기준',
    editable: true
  },
  {
    field: '검사내용',
    flex: 1.4,
    headerName: '검사내용',
    editable: true
  },
  {
    field: '허용수치',
    flex: 1.3,
    headerName: '허용수치',
    editable: true
  }
]);

// 하단 그리드 기본 설정
const detailDefaultColDef = ref({
  resizable: true,
  sortable: false,
  filter: false
});

// 그리드 API 참조
let mainApi = null;

// 메인 그리드 준비
const onMainGridReady = (params) => {
  mainApi = params.api;
  // 첫 행 자동 선택
  nextTick(() => {
    if (params.api.getDisplayedRowCount() > 0) {
      params.api.selectIndex(0);
    }
  });
};

// 선택된 행 상태
const selectedRow = ref(null);
const originalSelectedRow = ref(null);

// 메인 그리드 선택 변경
const onMainSelectionChanged = (params) => {
  const selected = params.api.getSelectedRows();
  if (selected.length > 0) {
    selectedRow.value = { ...selected[0] };
    originalSelectedRow.value = { ...selected[0] };
    console.log('선택된 행:', selectedRow.value);
  } else {
    selectedRow.value = null;
    originalSelectedRow.value = null;
  }
};

// 하단 그리드 데이터
const detailRows = computed(() => {
  return selectedRow.value ? [selectedRow.value] : [];
});

// 하단 그리드 셀 값 변경
const onDetailCellValueChanged = (params) => {
  const field = params.colDef.field;
  const newValue = params.newValue;

  console.log(`하단 그리드 수정: ${field} = ${newValue}`);

  if (selectedRow.value) {
    selectedRow.value[field] = newValue;
  }
};

// 상단 그리드 셀 값 변경 방지
const onMainCellValueChanged = (params) => {
  console.log('상단 그리드는 직접 수정할 수 없습니다.');
  // 변경사항 되돌리기
  params.api.refreshCells();
};

// 변경사항을 상단 그리드에 반영
const applyChanges = () => {
  if (!selectedRow.value || !originalSelectedRow.value) {
    alert('선택된 항목이 없습니다.');
    return;
  }

  const currentData = dataMap.value[search.value.type];
  const rowIndex = currentData.findIndex((row) => row.id === originalSelectedRow.value.id);

  if (rowIndex !== -1) {
    // 원본 데이터 업데이트
    currentData[rowIndex] = { ...selectedRow.value };

    // 원본 백업 업데이트
    originalSelectedRow.value = { ...selectedRow.value };

    // 상단 그리드 새로고침
    if (mainApi) {
      mainApi.refreshCells();
      // 선택 상태 유지
      nextTick(() => {
        mainApi.forEachNode((node) => {
          if (node.data && node.data.id === selectedRow.value.id) {
            node.setSelected(true);
          }
        });
      });
    }

    alert('변경사항이 상단 그리드에 반영되었습니다.');
    console.log('변경사항이 상단 그리드에 반영되었습니다:', selectedRow.value);
  } else {
    alert('해당 데이터를 찾을 수 없습니다.');
  }
};

// 하단 입력 초기화
const resetDetailForm = () => {
  if (originalSelectedRow.value) {
    selectedRow.value = { ...originalSelectedRow.value };
    console.log('하단 입력이 초기화되었습니다.');
    alert('입력이 초기화되었습니다.');
  }
};

// 제품 구분 변경 시 선택 초기화
watch(
  () => search.value.type,
  () => {
    selectedRow.value = null;
    originalSelectedRow.value = null;

    if (mainApi) {
      nextTick(() => {
        if (mainApi.getDisplayedRowCount() > 0) {
          mainApi.selectIndex(0);
        }
      });
    }
  }
);

// 등록 버튼
const saveForm = () => {
  const currentData = dataMap.value[search.value.type];
  console.log('현재 모든 데이터:', currentData);
  alert(`${search.value.type} 데이터가 저장되었습니다. (총 ${currentData.length}건)`);
};
</script>

<style scoped>
.grid-wrap {
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  overflow: hidden;
}

.top_btn_ser {
  margin-right: 10px;
}

.mb-2.pa-2 {
  margin-top: 10px;
}
</style>
