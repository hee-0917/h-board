const XLSX = require('xlsx')
const fs = require('fs')

// 엑셀 파일 읽기
const workbook = XLSX.readFile('/workspace/hospital-board/근무표.xlsx')

// 시트 이름들 출력
console.log('📋 시트 목록:', workbook.SheetNames)

// 각 시트 분석
workbook.SheetNames.forEach(sheetName => {
  console.log(`\n=== 시트: ${sheetName} ===`)
  const worksheet = workbook.Sheets[sheetName]
  
  // JSON으로 변환 (헤더 포함)
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    defval: '',
    raw: false 
  })
  
  console.log('📊 데이터 구조:')
  jsonData.slice(0, 10).forEach((row, index) => {
    console.log(`행 ${index + 1}:`, row)
  })
  
  // 범위 정보
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
  console.log(`📏 데이터 범위: ${range.s.c + 1}열 x ${range.e.r + 1}행`)
})