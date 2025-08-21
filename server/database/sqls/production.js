// server/sqls/production.js
module.exports = {
  /* =========================
   * 제품 목록 / 카운트
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
   * BOM 조회
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
   * 생산계획 저장 (일반쿼리)
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

  /* ✅ 계획-연동: 선택된 주문서 상태 업데이트 */
  "orders.updateStatusByIdsCsv": `
    UPDATE CUSTOMER_REQUEST
    SET REQ_STATUS = ?
    WHERE FIND_IN_SET(REQ_ID, ?)
  `,

  /* =========================================================
   *                공정 실행/상태 관련
   * ========================================================= */
  "exec.initStatesForWo": `
    INSERT INTO work_order_process_state
      (wo_id, process_code, status, prod_qty, defect_qty, input_qty_total,
       progress, started_at, ended_at, worker_id, equip_ids)
    SELECT
      ?           AS wo_id,
      t.code      AS process_code,
      'IDLE'      AS status,
      0, 0, 0, 0,
      NULL, NULL, NULL, NULL
    FROM (
      SELECT 'CUT' AS code UNION ALL
      SELECT 'FAB' UNION ALL
      SELECT 'POL' UNION ALL
      SELECT 'PAI' UNION ALL
      SELECT 'ASM'
    ) t
    WHERE (? = '완제품') OR (t.code <> 'ASM')
    ON DUPLICATE KEY UPDATE wo_id = wo_id
  `,
  "exec.upsertState": `
    INSERT INTO work_order_process_state
      (wo_id, process_code, status, prod_qty, defect_qty, input_qty_total,
       progress, started_at, worker_id, equip_ids)
    VALUES (?, ?, ?, 0, 0, 0, 0, NOW(), ?, ?)
    ON DUPLICATE KEY UPDATE
      status     = VALUES(status),
      worker_id  = VALUES(worker_id),
      equip_ids  = VALUES(equip_ids),
      started_at = COALESCE(work_order_process_state.started_at, NOW())
  `,
  "exec.insertRun": `
    INSERT INTO work_order_exec
      (wo_id, process_code, input_qty, start_at, worker_id, equip_ids)
    VALUES (?, ?, ?, NOW(), ?, ?)
  `,
  "exec.pauseLatest": `
    SELECT ? AS _ignored;
    UPDATE work_order_exec e
    JOIN (
      SELECT id
      FROM work_order_exec
      WHERE wo_id = ? AND process_code = ? AND end_at IS NULL
      ORDER BY id DESC
      LIMIT 1
    ) t ON t.id = e.id
    SET e.end_at = NOW()
  `,
  "exec.finishLatest": `
    SELECT ? AS _ignored;
    UPDATE work_order_exec e
    JOIN (
      SELECT id
      FROM work_order_exec
      WHERE wo_id = ? AND process_code = ? AND end_at IS NULL
      ORDER BY id DESC
      LIMIT 1
    ) t ON t.id = e.id
    SET e.end_at = NOW()
  `,
  "exec.getState": `
    SELECT wo_id, process_code, status, prod_qty, defect_qty, input_qty_total,
           progress, started_at, ended_at, worker_id, equip_ids
    FROM work_order_process_state
    WHERE wo_id = ?
    ORDER BY FIELD(process_code,'CUT','FAB','POL','PAI','ASM')
  `,
  "exec.getStateOne": `
    SELECT *
    FROM work_order_process_state
    WHERE wo_id = ? AND process_code = ?
    LIMIT 1
  `,
  "exec.getWoHeader": `
    SELECT id, target_qty, product_type
    FROM work_orders
    WHERE id = ?
    LIMIT 1
  `,
  "exec.bumpStateOnFinish": `
    UPDATE work_order_process_state s
    SET
      s.prod_qty        = LEAST(s.prod_qty + ?, GREATEST(?,1)),
      s.input_qty_total = s.input_qty_total + ?,
      s.progress        = FLOOR( LEAST(s.prod_qty + ?, GREATEST(?,1)) / GREATEST(?,1) * 100 ),
      s.ended_at        = NOW(),
      s.status          = CASE WHEN LEAST(s.prod_qty + ?, GREATEST(?,1)) >= GREATEST(?,1) THEN 'DONE' ELSE s.status END
    WHERE s.wo_id = ? AND s.process_code = ?
  `,
  "exec.countRequiredProcs": `
    SELECT CASE WHEN ? = '반제품' THEN 4 ELSE 5 END AS cnt
  `,
  "exec.countDoneProcs": `
    SELECT COUNT(*) AS cnt
    FROM work_order_process_state s
    WHERE s.wo_id = ?
      AND s.status = 'DONE'
      AND (
        CASE
          WHEN ? = '반제품' THEN s.process_code IN ('CUT','FAB','POL','PAI')
          ELSE s.process_code IN ('CUT','FAB','POL','PAI','ASM')
        END
      )
  `,
  "exec.enqueueQuality": `
    INSERT INTO production_done_queue (wo_id, finished_at, qty, picked)
    VALUES (?, NOW(), ?, 0)
    ON DUPLICATE KEY UPDATE
      qty = VALUES(qty),
      finished_at = VALUES(finished_at)
  `,

  /* =========================================================
   *                설비/작업자
   * ========================================================= */
  "facility.selectWithLatestStatus": `
    SELECT
      f.FAC_ID   AS facId,
      f.FAC_NAME AS facName,
      f.PR_ID    AS prId,
      f.FAC_TYPE AS facType,
      f.FAC_USE  AS facUse,
      f.MANAGER  AS manager,
      fs.FS_STATUS   AS fsStatus,
      fs.FS_REASON   AS fsReason,
      fs.DOWN_STARTDAY AS downStart,
      fs.DOWN_ENDDAY   AS downEnd
    FROM FACILITY f
    LEFT JOIN (
      SELECT s1.FAC_ID, s1.FS_STATUS, s1.FS_REASON, s1.DOWN_STARTDAY, s1.DOWN_ENDDAY
      FROM FACILITY_STATUS s1
      JOIN (
        SELECT FAC_ID, MAX(COALESCE(DOWN_STARTDAY, '1970-01-01 00:00:00')) AS mx_start
        FROM FACILITY_STATUS
        GROUP BY FAC_ID
      ) s2
        ON s1.FAC_ID = s2.FAC_ID
       AND (s1.DOWN_STARTDAY <=> s2.mx_start)
    ) fs
      ON fs.FAC_ID = f.FAC_ID
    WHERE (? = '' OR f.PR_ID = ?)
    ORDER BY f.FAC_ID
  `,

  /* =========================================================
   *                제품유형 조회 / 지시 SP
   * ========================================================= */
  "product.selectTypeByCode": `
    SELECT PRD_TYPE AS prdType
    FROM PRODUCT
    WHERE PRD_CODE = ?
    LIMIT 1
  `,
  "product.selectTypesByCodesCsv": `
    SELECT PRD_CODE AS code, PRD_TYPE AS prdType
    FROM PRODUCT
    WHERE FIND_IN_SET(PRD_CODE, ?)
  `,

  "workorder.updateProductType": `
    UPDATE work_orders
    SET product_type = ?
    WHERE id = ?
  `,
  "workorder.selectPlanNamesInCsv": `
    SELECT GROUP_CONCAT(plan_name ORDER BY id SEPARATOR ', ') AS names
    FROM production_plans
    WHERE FIND_IN_SET(id, ?)
  `,
  "production.sp.selectPlans": "CALL dev.sp_select_plans(?, ?, ?)",
  "production.sp.countPlans": "CALL dev.sp_count_plans(?)",
  "production.sp.updatePlan": "CALL dev.sp_update_plan(?, ?, ?, ?, ?, ?, ?, ?)",
  "production.sp.deletePlans": "CALL dev.sp_delete_plans(?)",

  "workorder.sp.create":
    "CALL dev.sp_create_work_order(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  "workorder.sp.select": "CALL dev.sp_select_work_orders(?, ?, ?)",
  "workorder.sp.count": "CALL dev.sp_count_work_orders(?)",
  "workorder.sp.update":
    "CALL dev.sp_update_work_order(?, ?, ?, ?, ?, ?, ?, ?, ?)",
  "workorder.sp.delete": "CALL dev.sp_delete_work_orders(?)",

  /* =========================
   * 자재 재고/예약
   * ========================= */
  "materials.selectStockByType": `
    SELECT M.MAT_CODE,
           M.MAT_NAME,
           M.MAT_TYPE,
           M.MAT_UNIT,
           M.MAT_SIZE,
           M.MAT_NOTE,
           IFNULL(SUM(MR.MAT_QTY),0) AS MAT_QTY
    FROM MATERIALS AS M
    LEFT JOIN MATERIAL_RECEIPT AS MR
      ON M.MAT_CODE = MR.MAT_CODE
    WHERE M.MAT_TYPE = ?
    GROUP BY M.MAT_CODE, M.MAT_NAME, M.MAT_TYPE, M.MAT_UNIT, M.MAT_SIZE, M.MAT_NOTE
  `,
  "materials.selectAvailableByCodesCsv": `
    SELECT
      M.MAT_CODE AS matCode,
      M.MAT_NAME AS matName,
      M.MAT_UNIT AS unit,
      M.MAT_SIZE AS spec,
      IFNULL(SUM(R.MAT_QTY),0) AS receiptQty,
      IFNULL(RES.reservedQty,0) AS reservedQty,
      (IFNULL(SUM(R.MAT_QTY),0) - IFNULL(RES.reservedQty,0)) AS availableQty
    FROM MATERIALS M
    LEFT JOIN MATERIAL_RECEIPT R
      ON M.MAT_CODE = R.MAT_CODE
    LEFT JOIN (
      SELECT mat_code, SUM(reserved_qty) AS reservedQty
      FROM production_mat_reserve
      WHERE status = 'ACTIVE'
      GROUP BY mat_code
    ) RES
      ON RES.mat_code = M.MAT_CODE
    WHERE FIND_IN_SET(M.MAT_CODE, ?)
    GROUP BY M.MAT_CODE, M.MAT_NAME, M.MAT_UNIT, M.MAT_SIZE, RES.reservedQty
    ORDER BY M.MAT_CODE
  `,
  "materials.reserveInsert": `
    INSERT INTO production_mat_reserve
      (wo_id, product_code, mat_code, reserved_qty, status, created_at, note)
    VALUES (?, ?, ?, ?, 'ACTIVE', NOW(), ?)
  `,
  "materials.reserveCancelByWo": `
    UPDATE production_mat_reserve
    SET status = 'CANCELED', canceled_at = NOW()
    WHERE wo_id = ? AND status = 'ACTIVE'
  `,

  // ✅ 생산 작업자 조회(EMPLOYEES 실제 컬럼명 반영)
  "production.selectWorkers.employees": `
  SELECT
    e.EMP_NO   AS id,
    e.EMP_NAME AS name,
    TRIM(COALESCE(e.DEPT_NAME,'')) AS dept,
    COALESCE(e.AUTH,'')            AS auth,
    COALESCE(e.PHONE,'')           AS phone,
    COALESCE(e.EMAIL,'')           AS email
  FROM EMPLOYEES e
  WHERE
    (
      COALESCE(?, '') = ''
      OR TRIM(e.DEPT_NAME) = TRIM(?)
      OR TRIM(e.DEPT_NAME) LIKE CONCAT('%', TRIM(?), '%')
    )
    AND (e.EMP_EDATE IS NULL OR e.EMP_EDATE > NOW())
    AND (COALESCE(e.EMP_STATUS,'') IN ('', '재직', 'Y', 'y', 'YES', 'Yes', 'ACTIVE', 'Active', '1'))
  ORDER BY e.EMP_NO
`,
};
