// Table : t_bard_bard

// 서버테스트 SQL
const selectBoardList = `
select * from tbl_users
`;

// 조건없이 전체조회
// const selectBoardList = `
// SELECT no
// 		    , title
//         , writer
//         , content
//         , created_date
// FROM t_board_board
// ORDER BY no`;

// 단건조회
const selectBoardInfo = `
SELECT no
		    , title
        , writer
        , content
        , created_date
FROM t_board_board
WHERE no = ?`;

// 등록
const boardInsert = `
INSERT INTO t_board_board (title, writer, content, created_date, updated_date)
VALUES ( ?, ?, ?, NOW(), NOW())
`;

module.exports = {
  selectBoardList,
  selectBoardInfo,
  boardInsert,
};
