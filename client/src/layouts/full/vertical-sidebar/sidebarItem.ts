// import {
//   CircleIcon,
//   WindmillIcon,
//   TypographyIcon,
//   ShadowIcon,
//   PaletteIcon,
//   KeyIcon,
//   BugIcon,
//   DashboardIcon,
//   BrandChromeIcon,
//   HelpIcon
// } from 'vue-tabler-icons';

export interface menu {
  header?: string;
  title?: string;
  icon?: object;
  to?: string;
  divider?: boolean;
  chip?: string;
  chipColor?: string;
  chipVariant?: string;
  chipIcon?: string;
  children?: menu[];
  disabled?: boolean;
  type?: string;
  subCaption?: string;
  auth?: string[];
}

const sidebarItem: menu[] = [
  {
    title: '기준정보',
    auth: ['관리자', '부서담당자'],
    children: [
      {
        title: '사원 관리',
        to: '/master/MasterEmp'
      },
      {
        title: '제품 관리',
        to: '/master/MasterProduct'
      },
      {
        title: '자재 관리',
        to: '/master/MasterMaterials'
      },
      {
        title: '재공품 관리',
        to: '/master/MasterWIP'
      },
      {
        title: '공정 관리',
        to: '/master/MasterProcess'
      },
      {
        title: '공정흐름도 관리',
        to: '/master/MasterDiagram'
      },
      {
        title: 'BOM 관리',
        to: '/master/MasterBom'
      }
    ]
  },
  {
    title: '영업',
    children: [
      {
        title: '거래처',
        children: [
          {
            title: '거래처등록 및 조회',
            to: '/marketing/MkAccount'
          }
        ]
      },
      {
        title: '주문서',
        children: [
          {
            title: '주문서 등록',
            to: '/marketing/OrderForm'
          },
          {
            title: '주문서 조회',
            to: '/marketing/OrderFormList'
          }
        ]
      },
      {
        title: '생산 의뢰서',
        children: [
          {
            title: '생산 의뢰서 등록',
            to: '/marketing/MfOrderForm'
          },
          {
            title: '생산 의뢰서 조회',
            to: '/marketing/MfOrderFormList'
          }
        ]
      },
      {
        title: '제품 입출고',
        children: [
          {
            title: '입고 및 LOT 생성',
            to: '/marketing/MkInbound'
          },
          {
            title: 'LOT 조회',
            to: '/marketing/MkLotList'
          },
          {
            title: '출하지시서 등록',
            to: '/marketing/MkOutboundForm'
          },
          {
            title: '출하이력 조회',
            to: '/marketing/MkOutboundFormList'
          }
        ]
      }
    ]
  },
  {
    title: '자재',
    children: [
      {
        title: '자재발주서',
        children: [
          {
            title: '자재발주서 등록',
            to: '/material/order'
          },
          {
            title: '자재발주서 조회',
            to: '/material/order/Select'
          }
        ]
      },
      {
        title: '입고',
        children: [
          {
            title: '입고 등록',
            to: '/material/insert'
          },
          {
            title: '입고 조회',
            to: '/material/select'
          }
        ]
      },
      {
        title: '불량품',
        children: [
          {
            title: '불량품 조회',
            to: '/failMaterial/select'
          },
          {
            title: '자재반품요청서 등록',
            to: '/failMaterial/equest'
          },
          {
            title: '자재반품요청서 조회',
            to: '/failMaterial/equest/select'
          }
        ]
      },
      {
        title: '재고',
        children: [
          {
            title: '자재 LOT 등록',
            to: '/material/LOT'
          },
          {
            title: '재공품 등록',
            to: '/material/retrial'
          },
          {
            title: '재고 조회',
            to: '/stock'
          },
          {
            title: '재고 입출고 조회',
            to: '/stock/status'
          }
        ]
      }
    ]
  },
  {
    title: '생산',
    children: [
      {
        title: '생산계획',
        children: [
          {
            title: '생산계획 관리',
            to: '/production/plan'
          },
          {
            title: '생산계획 조회',
            to: '/production/productioncheck'
          },
          {
            title: '생산계획 수정/삭제',
            to: '/production/productionmodify'
          }
        ]
      },
      {
        title: '작업지시',
        children: [
          {
            title: '작업지시 관리',
            to: '/production/workorder'
          },
          {
            title: '작업지시 조회',
            to: '/production/ordercheck'
          },
          {
            title: '작업지시 수정/삭제',
            to: '/production/ordermodify'
          }
        ]
      },
      {
        title: '공정관리',
        children: [
          {
            title: '공정 진행 관리',
            to: '/production/processcontrol'
          },
          {
            title: '작업 진행 현황',
            to: '/production/workstatus'
          },
          {
            title: '생산 실적 조회',
            to: '/production/performancecheck'
          }
        ]
      }
    ]
  },
  {
    title: '설비',
    children: [
      {
        title: '설비 정보 관리',
        children: [
          {
            title: '전체 조회',
            to: '/utils/List'
          },
          {
            title: '설비 등록',
            to: '/utils/Registration'
          },
          {
            title: '설비 수정',
            to: '/utils/modify'
          }
        ]
      },
      {
        title: '설비 상태 관리',
        children: [
          {
            title: '전체 조회',
            to: '/utils/status'
          },
          {
            title: '비가동 관리',
            to: '/utils/StatusOperational'
          }
        ]
      },
      {
        title: '설비 수리 관리',
        children: [
          {
            title: '수리 관리',
            to: '/utils/RepairManagement'
          },
          {
            title: '수리 내역',
            to: '/utils/repairhistory'
          }
        ]
      },
      {
        title: '설비 점검 관리',
        children: [
          {
            title: '점검 관리',
            to: '/utils/CheckManagement'
          },
          {
            title: '점검 내역',
            to: '/utils/checkhistory'
          }
        ]
      }
    ]
  },
  {
    title: '품질',
    children: [
      {
        title: '원자재 검수',
        children: [
          {
            title: '원자재 검수이력 조회',
            to: '/qm/matlsthst'
          },
          {
            title: '원자재 검수 관리',
            to: '/qm/matlst'
          }
        ]
      },
      {
        title: '제품성적서',
        children: [
          {
            title: '제품성적서조회',
            to: '/qm/prdlst'
          },
          {
            title: '제품성적서관리',
            to: '/qm/prdmng'
          }
        ]
      },
      {
        title: '품질 기준',
        children: [
          {
            title: '기준조회',
            to: '/qm/qslist'
          },
          {
            title: '기준관리',
            auth: ['관리자', '부서담당자'],
            to: '/qm/qsmng'
          }
        ]
      }
    ]
  },
  {
    title: '물류',
    children: [
      {
        title: '창고관리',
        to: '/warehouse/WareInfo'
      },
      {
        title: '물류 출하',
        to: '/warehouse/ShipmentSelect'
      },
      {
        title: '폐기 처리',
        children: [
          {
            title: '폐기 일정 등록',
            to: '/warehouse/ScrapInsert'
          },
          {
            title: '폐기 처리 조회',
            to: '/warehouse/ScrapSelect'
          }
        ]
      }
    ]
  }
];

export default sidebarItem;
