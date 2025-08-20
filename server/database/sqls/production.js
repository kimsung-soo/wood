// server/sqls/production.js
module.exports = {
  /* =========================
   * 제품 목록 / 카운트  (← PRODUCT 테이블 사용)
   * 파라미터(서비스 호출 순서)
   *  - selectProducts: [kw, like, like, limit, offset]
   *  - countProducts : [kw, like, like]
   * ========================= */
  "production.selectProducts": `
    SELECT
      p.PRD_CODE  AS code,
      p.PRD_NAME  AS name,
      p.PRD_TYPE  AS type,
      p.PRD_UNIT  AS uom,
      p.PRD_SIZE  AS spec
    FROM PRODUCT p
    WHERE (? = '' OR p.PRD_CODE LIKE ? OR p.PRD_NAME LIKE ?)
    ORDER BY p.PRD_CODE
    LIMIT ? OFFSET ?
  `,
  "production.countProducts": `
    SELECT COUNT(*) AS cnt
    FROM PRODUCT p
    WHERE (? = '' OR p.PRD_CODE LIKE ? OR p.PRD_NAME LIKE ?)
  `,

  /* =========================
   * 생산의뢰 목록 / 카운트
   * 파라미터(서비스 호출 순서)
   *  - selectRequests: [kw, like, like, like, limit, offset]
   *  - countRequests : [kw, like, like, like]
   * 컬럼 별칭은 프런트 그리드 컬럼에 맞춤.
   * ========================= */
  "production.selectRequests": `
    SELECT
      r.req_no         AS reqNo,
      r.order_no       AS orderNo,
      r.product_code   AS productCode,
      r.product_name   AS productName,
      r.product_type   AS productType,
      DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i') AS createdAt,
      r.writer         AS writer,
      r.total_qty      AS totalQty,
      DATE_FORMAT(r.due_date, '%Y-%m-%d') AS dueDate,
      r.id             AS id
    FROM production_requests r
    WHERE (? = ''
       OR r.req_no       LIKE ?
       OR r.order_no     LIKE ?
       OR r.product_name LIKE ?)
    ORDER BY r.id DESC
    LIMIT ? OFFSET ?
  `,
  "production.countRequests": `
    SELECT COUNT(*) AS cnt
    FROM production_requests r
    WHERE (? = ''
       OR r.req_no       LIKE ?
       OR r.order_no     LIKE ?
       OR r.product_name LIKE ?)
  `,

  /* =========================
   * BOM 조회 (제품코드 → 사용중(Y) 최신 BOM 한 개 + 디테일)
   * - header: 제품의 사용중 BOM 헤더 1건
   * - items : 해당 BOM의 상세(자재목록)
   * ========================= */
  "production.selectBomHeaderByProduct": `
    SELECT
      b.BOM_CODE   AS bomCode,
      b.PRD_CODE   AS productCode,
      b.BOM_VER    AS bomVer,
      b.BOM_WRITER AS writer,
      DATE_FORMAT(b.BOM_RDATE, '%Y-%m-%d') AS bomDate,
      b.USE_YN     AS useYn
    FROM BOM b
    WHERE b.PRD_CODE = ?
      AND b.USE_YN = 'Y'
    ORDER BY b.BOM_RDATE DESC, b.BOM_VER DESC
    LIMIT 1
  `,
  "production.selectBomItemsByHeader": `
    SELECT
      d.DETAIL_NO AS seq,
      d.MAT_CODE  AS matCode,
      d.MAT_NAME  AS matName,
      d.MAT_TYPE  AS matType,
      d.QTY       AS qty,
      d.UNIT      AS unit
    FROM BOM_DETAIL d
    WHERE d.BOM_CODE = ?
      AND d.BOM_VER  = ?
    ORDER BY d.DETAIL_NO ASC
  `,

  /* =========================
   * 생산계획 저장 관련 (일반쿼리)
   * savePlan()에서 사용
   * 파라미터(서비스 호출 순서)
   *  - insertPlan: [plan_no, plan_name, writer, order_no, created_date, due_date, total_qty, product_code, product_name, product_type, memo]
   *  - selectPlanByNo: [plan_no]
   *  - insertPlanItem: [plan_id, request_id, qty]
   * ========================= */
  "production.insertPlan": `
    INSERT INTO production_plans
      (plan_no, plan_name, writer, order_no, created_date, due_date, total_qty,
       product_code, product_name, product_type, memo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  "production.selectPlanByNo": `
    SELECT id, plan_no
    FROM production_plans
    WHERE plan_no = ?
    LIMIT 1
  `,
  "production.insertPlanItem": `
    INSERT INTO production_plan_items
      (plan_id, request_id, qty)
    VALUES (?, ?, ?)
  `,

  /* ===== 공정 진행 API ===== */
  "exec.upsertState": `
    INSERT INTO work_order_process_state
      (wo_id, process_code, status, prod_qty, progress, started_at, ended_at, worker_id, equip_ids)
    VALUES (?, ?, ?, 0, 0, NOW(), NULL, ?, ?)
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      started_at = NOW(),
      ended_at = NULL,
      worker_id = VALUES(worker_id),
      equip_ids = VALUES(equip_ids)
  `,

  "exec.insertRun": `
    INSERT INTO work_order_exec
      (wo_id, process_code, batch_qty, done_qty, status, worker_id, equip_ids, start_at)
    VALUES (?, ?, ?, 0, 'RUN', ?, ?, NOW())
  `,

  "exec.pauseLatest": `
    UPDATE work_order_exec
       SET status='PAUSE', end_at = NOW(), done_qty = ?
     WHERE wo_id = ? AND process_code = ? AND status='RUN'
     ORDER BY id DESC LIMIT 1
  `,

  "exec.finishLatest": `
    UPDATE work_order_exec
       SET status='DONE', end_at = NOW(), done_qty = ?
     WHERE wo_id = ? AND process_code = ? AND status IN ('RUN','PAUSE')
     ORDER BY id DESC LIMIT 1
  `,

  "exec.getState": `
    SELECT * FROM work_order_process_state WHERE wo_id = ?
  `,

  "exec.bumpStateOnFinish": `
    UPDATE work_order_process_state
       SET prod_qty = LEAST(prod_qty + ?, ?),
           progress = FLOOR(LEAST(prod_qty + ?, ?) / ? * 100),
           status = CASE WHEN FLOOR(LEAST(prod_qty + ?, ?) / ? * 100) >= 100 THEN 'DONE' ELSE 'IDLE' END,
           ended_at = CASE WHEN FLOOR(LEAST(prod_qty + ?, ?) / ? * 100) >= 100 THEN NOW() ELSE ended_at END
     WHERE wo_id = ? AND process_code = ?
  `,

  // 작업지시 목표/유형 조회
  "exec.getWoHeader": `
    SELECT id, target_qty, product_type
      FROM work_orders
     WHERE id = ?
     LIMIT 1
  `,

  // 전체 공정 완료 여부 계산용 (필요 공정 개수/완료 개수)
  "exec.countRequiredProcs": `
    SELECT COUNT(*) AS cnt
      FROM (
        SELECT 'CUT' code UNION ALL SELECT 'FAB' UNION ALL SELECT 'POL' UNION ALL SELECT 'PAI' UNION ALL SELECT 'ASM'
      ) base
     WHERE NOT (? = '반제품' AND code='ASM')
  `,
  "exec.countDoneProcs": `
    SELECT COUNT(*) AS cnt
      FROM work_order_process_state
     WHERE wo_id=? AND status='DONE'
       AND NOT (? = '반제품' AND process_code='ASM')
  `,

  "exec.enqueueQuality": `
    INSERT INTO production_done_queue (wo_id, finished_at, qty)
    VALUES (?, NOW(), ?)
    ON DUPLICATE KEY UPDATE finished_at=VALUES(finished_at), qty=VALUES(qty)
  `,

  /* =========================
   * 생산계획 목록/수정/삭제 (프로시저)
   * ========================= */
  "production.sp.selectPlans": "CALL dev.sp_select_plans(?, ?, ?)", // ← dev 스키마로 고정
  "production.sp.countPlans": "CALL dev.sp_count_plans(?)",
  "production.sp.updatePlan": "CALL dev.sp_update_plan(?, ?, ?, ?, ?, ?, ?, ?)",
  "production.sp.deletePlans": "CALL dev.sp_delete_plans(?)",

  // Work Orders (SP)
  "workorder.sp.create":
    "CALL dev.sp_create_work_order(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  "workorder.sp.select": "CALL dev.sp_select_work_orders(?, ?, ?)",
  "workorder.sp.count": "CALL dev.sp_count_work_orders(?)",
  "workorder.sp.update":
    "CALL dev.sp_update_work_order(?, ?, ?, ?, ?, ?, ?, ?, ?)",
  "workorder.sp.delete": "CALL dev.sp_delete_work_orders(?)",

  // 선택된 계획 CSV → 계획명 join (지시명 자동 채움 보조)
  "workorder.selectPlanNamesInCsv":
    "SELECT GROUP_CONCAT(plan_name ORDER BY id SEPARATOR ', ') AS names FROM production_plans WHERE FIND_IN_SET(id, ?)",

  /* ===== 설비 기본정보 (FACILITY) =====
     - 공정별 필터: prId(예: 'PRC-001') 없으면 전체
  */
  "facility.selectList": `
    SELECT
      f.FAC_ID   AS facId,
      f.FAC_NAME AS facName,
      f.FAC_TYPE AS facType,
      f.FAC_USE  AS facUse,
      f.PR_ID    AS prId,
      f.MANAGER  AS manager
    FROM FACILITY f
    WHERE (? = '' OR f.PR_ID = ?)
    ORDER BY f.FAC_ID
  `,

  /* ===== 설비 비가동 이력 (FACILITY_STATUS) =====
     - FS_STATUS = 1 (비가동) 만 반환
     - 현재 비가동 중(종료일 미기재)이든 과거건이든, 프론트 요구가
       "FS_STATUS=1만 보면 됨"이라서 상태 값만 사용
  */
  "facility.selectDowns": `
    SELECT
      s.FAC_ID     AS facId,
      s.FS_STATUS  AS fsStatus,
      s.FS_REASON  AS fsReason,
      s.FS_TYPE    AS fsType,
      s.DOWN_STARTDAY AS downStart,
      s.DOWN_ENDDAY   AS downEnd
    FROM FACILITY_STATUS s
    WHERE s.FS_STATUS = 1
  `,

  /* 현재 비가동 설비 집합
     - 설비별 가장 최근 이력(STARTDAY 기준)만 취함
     - 그 이력이 FS_STATUS=1 이고, 종료 전(NOW() < END) 이거나 종료일이 NULL 이면 "현재 비가동"
  */
  "production.selectFacilityDownMap": `
    SELECT s.FAC_ID AS facId
      FROM FACILITY_STATUS s
      JOIN (
            SELECT FAC_ID,
                   MAX(COALESCE(DOWN_STARTDAY, '1970-01-01 00:00:00')) AS mx_start
              FROM FACILITY_STATUS
             GROUP BY FAC_ID
           ) last
        ON last.FAC_ID = s.FAC_ID
       AND (last.mx_start <=> s.DOWN_STARTDAY)
     WHERE s.FS_STATUS = 1
       AND (s.DOWN_ENDDAY IS NULL OR s.DOWN_ENDDAY > NOW())
  `,

  /* 실행중(또는 일시정지)인 설비 id 모으기 (상태 테이블 기준) */
  "production.selectRunningEquipIds": `
    SELECT DISTINCT wps.equip_ids AS equipIds
      FROM work_order_process_state wps
     WHERE wps.equip_ids IS NOT NULL
       AND wps.equip_ids <> ''
       AND wps.status IN ('RUN','PAUSE')
  `,

  /* 생산부서 재직자(작업자) 조회 */
  "production.selectWorkers": `
    SELECT
      e.EMP_NO   AS id,
      e.EMP_NAME AS name,
      e.DEPT_NAME AS dept,
      e.AUTH     AS auth,
      e.PHONE    AS phone,
      e.EMAIL    AS email
    FROM EMPLOYEES e
    WHERE e.DEPT_NAME = '생산'
    AND (e.EMP_EDATE IS NULL OR e.EMP_EDATE = '')
    ORDER BY e.EMP_NO
  `,

  /* 설비 + 가장 최근 상태(FACILITY_STATUS) 조인
     - FS_STATUS: 0=가동, 1=비가동
     - 공정 필터: prId 없으면 전체
  */
  "facility.selectWithLatestStatus": `
    SELECT
      f.FAC_ID   AS facId,
      f.FAC_NAME AS facName,
      f.PR_ID    AS prId,
      f.FAC_TYPE AS facType,
      f.FAC_USE  AS facUse,        -- 참고용(있어도 최종판정은 FS_STATUS)
      f.MANAGER  AS manager,
      fs.FS_STATUS   AS fsStatus,  -- 0/1
      fs.FS_REASON   AS fsReason,
      fs.DOWN_STARTDAY AS downStart,
      fs.DOWN_ENDDAY   AS downEnd
    FROM FACILITY f
    LEFT JOIN (
      /* 설비별 가장 최근 이력 한 건 */
      SELECT s1.FAC_ID, s1.FS_STATUS, s1.FS_REASON, s1.DOWN_STARTDAY, s1.DOWN_ENDDAY
      FROM FACILITY_STATUS s1
      JOIN (
        SELECT FAC_ID, MAX(COALESCE(DOWN_STARTDAY, '1970-01-01 00:00:00')) AS mx_start
        FROM FACILITY_STATUS
        GROUP BY FAC_ID
      ) s2
        ON s1.FAC_ID = s2.FAC_ID
       AND (s1.DOWN_STARTDAY <=> s2.mx_start)   -- NULL-safe 비교
    ) fs
      ON fs.FAC_ID = f.FAC_ID
    WHERE (? = '' OR f.PR_ID = ?)
    ORDER BY f.FAC_ID
  `,

  /* 현재 생산중인 설비: work_order_process_state.equip_ids 에 포함 && 상태 RUN/PAUSE */
  "production.selectRunningEquipIds": `
    SELECT DISTINCT wps.equip_ids AS equipIds
      FROM work_order_process_state wps
     WHERE wps.equip_ids IS NOT NULL
       AND wps.equip_ids <> ''
       AND wps.status IN ('RUN','PAUSE')
  `,

  // 공정 상태 단건 조회 (시작/종료 시각 포함)
  "exec.getStateOne": `
  SELECT wo_id, process_code, status, prod_qty, progress,
         DATE_FORMAT(started_at,'%Y-%m-%d %H:%i:%s') AS started_at,
         DATE_FORMAT(ended_at  ,'%Y-%m-%d %H:%i:%s') AS ended_at,
         worker_id, equip_ids
    FROM work_order_process_state
   WHERE wo_id = ? AND process_code = ?
   LIMIT 1
`,
  /* 제품코드로 유형 1건 조회 */
  "product.selectTypeByCode": `
    SELECT PRD_TYPE AS prdType
      FROM PRODUCT
     WHERE PRD_CODE = ?
     LIMIT 1
  `,

  /* 여러 코드 유형 한 번에 (CSV 사용) */
  "product.selectTypesByCodesCsv": `
    SELECT PRD_CODE AS code, PRD_TYPE AS prdType
      FROM PRODUCT
     WHERE FIND_IN_SET(PRD_CODE, ?)
  `,

  /* 작업지시 생성 후 product_type 보정 (SP가 안 넣어줄 때 대비) */
  "workorder.updateProductType": `
    UPDATE work_orders
       SET product_type = ?
     WHERE id = ?
  `,
};
