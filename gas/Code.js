/**
 * Google Apps Script Code
 * 
 * 1. Create a new Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Paste this code into Code.gs.
 * 4. Run the 'setupSheet' function once to create headers (or it will auto-create on first save).
 * 5. Deploy as Web App:
 *    - Click 'Deploy' > 'New deployment'
 *    - Select type: 'Web app'
 *    - Description: 'P.A.D Database v3'
 *    - Execute as: 'Me'
 *    - Who has access: 'Anyone' (Important for the React app to access it)
 * 6. Copy the 'Web App URL' and paste it into the P.A.D app.
 */

const SHEET_NAME = 'Responses';

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = [
      'Timestamp',
      'SessionID',
      'Name',
      'Email',
      '조직기반 자긍심',
      '형평 민감성',
      '신경증',
      '나르시시즘',
      '마키아벨리즘',
      '사이코패스',
      '자기성장 마인드셋',
      '자기효능감',
      '회복탄력성',
      '타인성장 마인드셋',
      '원만성',
      '조직신뢰',
      'Raw_Answers_JSON' 
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function setupSheet() {
  getOrCreateSheet();
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    const sheet = getOrCreateSheet();
    
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseError) {
      try {
        if (e.parameter && e.parameter.data) {
          data = JSON.parse(e.parameter.data);
        } else {
          data = e.parameter;
        }
      } catch (e2) {
        data = e.parameter;
      }
    }

    if (!data || !data.scores) {
      return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': 'Invalid data format' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Prepare row data mapping to headers (백분위 점수 저장)
    const row = [
      new Date(),
      data.sessionId || Utilities.getUuid(),
      (data.userInfo && data.userInfo.name) || '',
      (data.userInfo && data.userInfo.email) || '',
      data.scores['조직기반 자긍심']?.percentile ?? data.scores['조직기반 자긍심']?.tScore ?? 0,
      data.scores['형평 민감성']?.percentile ?? data.scores['형평 민감성']?.tScore ?? 0,
      data.scores['신경증']?.percentile ?? data.scores['신경증']?.tScore ?? 0,
      data.scores['나르시시즘']?.percentile ?? data.scores['나르시시즘']?.tScore ?? 0,
      data.scores['마키아벨리즘']?.percentile ?? data.scores['마키아벨리즘']?.tScore ?? 0,
      data.scores['사이코패스']?.percentile ?? data.scores['사이코패스']?.tScore ?? 0,
      data.scores['자기성장 마인드셋']?.percentile ?? data.scores['자기성장 마인드셋']?.tScore ?? 0,
      data.scores['자기효능감']?.percentile ?? data.scores['자기효능감']?.tScore ?? 0,
      data.scores['회복탄력성']?.percentile ?? data.scores['회복탄력성']?.tScore ?? 0,
      data.scores['타인성장 마인드셋']?.percentile ?? data.scores['타인성장 마인드셋']?.tScore ?? 0,
      data.scores['원만성']?.percentile ?? data.scores['원만성']?.tScore ?? 0,
      data.scores['조직신뢰']?.percentile ?? data.scores['조직신뢰']?.tScore ?? 0,
      JSON.stringify(data.answers || {})
    ];
    
    sheet.appendRow(row);
    
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'row': sheet.getLastRow() }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function testSheetConnection() {
  const sheet = getOrCreateSheet();
  Logger.log('Success: Connected to sheet "' + SHEET_NAME + '". Current rows: ' + sheet.getLastRow());
}

function doGet(e) {
  return ContentService.createTextOutput("This Web App is active. Use POST to submit data.");
}
