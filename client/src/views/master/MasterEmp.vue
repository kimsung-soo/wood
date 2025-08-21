<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="사원 목록">
    <div class="d-flex align-center mb-4">
      <v-text-field label="사원 검색" v-model="searchKeyword" hide-details class="mr-2" style="max-width: 280px"></v-text-field>
      <v-btn color="darkText" @click="searchData">검색</v-btn
      ><v-row justify="end" class="mr-3">
        <v-btn color="error" class="mr-1" @click="del">삭제</v-btn>
      </v-row>
    </div>
    <div class="main-container">
      <div class="list-container">
        <ag-grid-vue
          :rowData="empData"
          :columnDefs="colDefs1"
          :theme="quartz"
          style="height: 500px; width: 100%"
          rowSelection="single"
          @rowClicked="onRowClicked"
          @grid-ready="onGridReady"
        >
          <!--  :defaultColDef="{ width: 150 }" 로 전체 width지정도가능-->
        </ag-grid-vue>
      </div>
      <div class="form-wrapper">
        <div class="add">
          <v-row class="mb-4">
            <v-col cols="6">
              <v-text-field label="사원번호" v-model="form.empNo" readonly="true" outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="사원명" v-model="form.empName" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="연락처" v-model="form.phone" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="이메일" v-model="form.email" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="부서명" v-model="form.dept" placeholder="부서명" dense outlined readonly>
                <template #append-inner>
                  <i
                    class="fa-solid fa-magnifying-glass"
                    style="cursor: pointer; font-size: large; margin-right: 0.5rem"
                    @click="openModal('부서 조회', materialRowData, materialColDefs)"
                  ></i>
                </template>
              </v-text-field>
              <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="modalConfirm" />
            </v-col>
            <v-col cols="6">
              <v-select label="직급" v-model="form.auth" :items="authOptions" dense outlined />
            </v-col>
            <v-col cols="12">
              <v-text-field label="주소" v-model="form.addr" dense outlined />
            </v-col>
            <div class="radioDiv">
              <span class="mr-4">재직 상태 :</span>
              <v-radio-group v-model="form.status" inline hide-details>
                <v-radio label="재직" value="재직" />
                <v-radio label="퇴직" value="퇴직" />
              </v-radio-group>
            </div>
            <v-col cols="4">
              <v-text-field label="입사일자" v-model="form.hireDate" type="date" dense outlined />
            </v-col>
            <v-col cols="4">
              <v-text-field label="퇴사일자" v-model="form.endDate" type="date" dense outlined />
            </v-col>
            <v-row justify="center">
              <v-btn color="error" class="mr-3" @click="resetForm">초기화</v-btn>
              <v-btn color="primary" class="mr-6" @click="submitForm">저장</v-btn>
            </v-row>
          </v-row>
        </div>
        <br />
      </div>
    </div>
  </UiParentCard>
</template>

<script setup>
// 기존 스크립트 내용은 동일합니다.
import { onMounted, ref, shallowRef } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import { themeQuartz } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import axios from 'axios';
import MoDal from '../common/NewModal.vue';
// 토스트
import { useToast } from 'vue-toast-notification';
const $toast = useToast();
//{ position: 'top-right', duration: 1000 }

const searchKeyword = ref([]);
const page = ref({ title: '사원 관리' });
const breadcrumbs = shallowRef([
  {
    title: '기준정보',
    disabled: true,
    href: '#'
  },
  {
    title: '사원 관리',
    disabled: false,
    href: '#'
  }
]);
const quartz = themeQuartz;

const form = ref({
  empNo: '', //
  phone: '',
  empName: '',
  hireDate: '',
  auth: '',
  dept: '',
  addr: '',
  status: '',
  endDate: ''
});

onMounted(() => {
  empList();
  fetchCommonCodes();
  modalList();
});

// 사원 행들.
const empData = ref([]);

// 사원 컬럼 정의
const colDefs1 = ref([
  {
    checkboxSelection: true, // 각 행에 체크박스
    width: 50
  },
  { field: '사원번호', width: 150 },
  { field: '사원명', width: 140 },
  { field: '부서', width: 130 },
  { field: '직급', width: 130 },
  { field: '재직상태', width: 130 },
  { field: '연락처', width: 150 },
  { field: '이메일', width: 150 },
  { field: '주소', width: 200 },
  { field: '입사일자', width: 110 },
  { field: '퇴사일자', width: 110 }
]);

// 사원 리스트
const empList = async () => {
  const res = await axios.get('http://localhost:3000/masterEmp');
  empData.value = res.data.map((emp) => ({
    사원번호: emp.EMP_NO,
    사원명: emp.EMP_NAME,
    입사일자: emp.EMP_HDATE ? emp.EMP_HDATE.substring(0, 10) : null,
    주소: emp.ADDR,
    연락처: emp.PHONE,
    이메일: emp.EMAIL,
    부서: emp.DEPT_NAME,
    직급: emp.AUTH,
    퇴사일자: emp.EMP_EDATE ? emp.EMP_EDATE.substring(0, 10) : null,
    재직상태: emp.EMP_STATUS
  }));
};

// 부서 및 직급 데이터 변수
const authOptions = ref([]);

// 공통코드 데이터를 가져오는 함수
const fetchCommonCodes = async () => {
  try {
    // 직급 공통코드 API 호출 (예시)
    const authRes = await axios.get('http://localhost:3000/commonAuth');
    authOptions.value = authRes.data.map((item) => item.code_name); // `code_name`을 배열에 담기
  } catch (error) {
    console.error('공통코드 데이터를 불러오는 데 실패했습니다:', error);
  }
};
//사원 검색
const searchData = async (searchKeyword) => {
  console.log(searchKeyword);
  if (!searchKeyword.value) {
    $toast.error('사원이 입력되지 않았습니다');
    return;
  }
  const params = { EMP_NAME: `%${searchKeyword}%` };
  const res = await axios.post('http://localhost:3000/masterEmpName', params);
  empData.value = res.data.map((emp) => ({
    사원번호: emp.EMP_NO,
    사원명: emp.EMP_NAME,
    입사일자: emp.EMP_HDATE ? emp.EMP_HDATE.substring(0, 10) : null,
    주소: emp.ADDR,
    연락처: emp.PHONE,
    이메일: emp.EMAIL,
    부서: emp.DEPT_NAME,
    직급: emp.AUTH,
    퇴사일자: emp.EMP_EDATE ? emp.EMP_EDATE.substring(0, 10) : null,
    재직상태: emp.EMP_STATUS
  }));
};

// 저장버튼
const submitForm = async () => {
  //console.log(!form.value.empNO);
  // 수정
  if (form.value.empNo) {
    const updateRow = {
      EMP_NAME: form.value.empName,
      PHONE: form.value.phone,
      EMAIL: form.value.email,
      DEPT_NAME: form.value.dept,
      AUTH: form.value.auth,
      ADDR: form.value.addr,
      EMP_STATUS: form.value.status,
      EMP_HDATE: form.value.hireDate?.trim() || null,
      EMP_EDATE: form.value.endDate?.trim() || null,
      EMP_NO: form.value.empNo
    };
    const result = await axios.put('http://localhost:3000/masterEmpUpdate', updateRow);
    console.log(result.config.data);
    $toast.success(`${form.value.empName}의 정보가 수정되었습니다`, { position: 'top-right', duration: 1000 });
    empList();
  } else {
    // db저장
    if (form.value.endDate) {
      $toast.error('퇴직이 선택되어있습니다.');
      return;
    }
    const newRow = {
      EMP_NAME: form.value.empName,
      PHONE: form.value.phone,
      EMAIL: form.value.email,
      DEPT_NAME: form.value.dept,
      AUTH: form.value.auth,
      ADDR: form.value.addr,
      EMP_STATUS: form.value.status,
      EMP_HDATE: form.value.hireDate?.trim() || null,
      EMP_EDATE: form.value.endDate?.trim() || null
    };
    const result = await axios.post('http://localhost:3000/masterEmpInsert', newRow);
    console.log(result.config.data);
    empList();
  }
};

// 그리드 api에 값 저장
let gridApi = null;

const onGridReady = (params) => {
  gridApi = params.api;
};

// 사원 삭제
const del = async () => {
  if (!gridApi) return;

  const selectedRows = gridApi.getSelectedRows();
  if (selectedRows.length === 0) {
    alert('삭제할 항목을 선택하세요');
    return;
  }
  const deleteRow = { empNo: selectedRows[0].사원번호 };
  console.log(deleteRow);
  const result = await axios.delete('http://localhost:3000/masterEmpDelete', { data: deleteRow });
  console.log(result);
  empList();
};
// 폼 데이터를 초기화하는 함수
const resetForm = () => {
  form.value = {
    empName: '',
    hireDate: '',
    empNo: '',
    email: '',
    phone: '',
    auth: '',
    dept: '',
    addr: '',
    status: '재직'
  };
};

// 행선택시 등록 폼으로
const onRowClicked = (event) => {
  console.log(event.data);
  form.value.empNo = event.data.사원번호;
  form.value.empName = event.data.사원명;
  form.value.hireDate = event.data.입사일자;
  form.value.addr = event.data.주소;
  form.value.dept = event.data.부서;
  form.value.auth = event.data.직급;
  form.value.email = event.data.이메일;
  form.value.status = event.data.재직상태;
  form.value.phone = event.data.연락처;
  form.value.endDate = event.data.퇴사일자;
};

//모달 value들
const modalRef = ref(null);
const modalTitle = ref('');
const modalRowData = ref([]);
const modalColDefs = ref([]);
const materialColDefs = [
  { field: '그룹코드', headerName: '그룹코드', flex: 1 },
  { field: '부서명', headerName: '부서명', flex: 1 }
];
const materialRowData = ref([]);

// 모달 조회
const modalList = async () => {
  const res = await axios.get('http://localhost:3000/commonDept');
  materialRowData.value = res.data.map((prd) => ({
    그룹코드: prd.group_code,
    부서명: prd.code_name
  }));
  console.log(res);
};

//모달 열때 데이터값 자식컴포넌트로
const openModal = async (title, rowData, colDefs) => {
  modalTitle.value = title;
  modalRowData.value = rowData;
  modalColDefs.value = colDefs;
  if (modalRef.value) {
    modalRef.value.open();
  }
};

// 모달에서 확인시 행추가
const modalConfirm = async (selectedRow) => {
  form.value.size = selectedRow.규격;
};
</script>

<style scoped>
.main-container {
  display: flex;
  gap: 20px; /* 두 컨테이너 사이의 간격 */
  padding: 0 10px;
}

.list-container {
  flex: 1 1 50%; /* flex-grow: 1, flex-shrink: 1, flex-basis: 50% */
  min-width: 400px;
}

.form-wrapper {
  flex: 1 1 50%; /* list-container와 동일하게 공간을 차지 */
  min-width: 400px;
}
.radioDiv {
  margin-left: 1rem;
  margin-right: 1rem;
}
</style>
