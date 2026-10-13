# Google Apps Script (GAS) Implementation Guide

Since this environment runs a React application, we cannot directly deploy Google Apps Script. However, per your request, here is the complete code structure for a GAS version of this application.

## 1. Google Sheet Database Structure

Create a new Google Sheet with the following tabs:

### Tab 1: `Responses`
Stores raw survey answers.
- **Row 1 (Headers):**
  - Column A: `Timestamp`
  - Column B: `SessionID`
  - Column C~DP: `Q1` ... `Q120` (120 columns for answers)
  - Column DQ~EB: `Score_Category1` ... `Score_Category12` (12 columns for calculated percentile scores)

### Tab 2: `Questions` (Optional)
If you want to manage questions dynamically.
- **Row 1 (Headers):** `ID`, `Category`, `Text`

---

## 2. Code.gs

Create a file named `Code.gs` in your Apps Script project.

```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your Sheet ID
const SHEET_NAME = 'Responses';

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('성태앱 - 성격 및 태도 진단')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function saveResponse(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  // Calculate scores (simplified logic)
  // In a real app, you might want to do this on the client side or more robustly here
  const scores = calculateScores(data.answers);
  
  const rowData = [
    new Date(),
    data.sessionId,
    ...Object.values(data.answers), // Ensure order matches Q1-Q120
    ...Object.values(scores)
  ];
  
  sheet.appendRow(rowData);
  
  return { success: true, scores: scores };
}

function calculateScores(answers) {
  // Implement the scoring logic here based on the 12 categories
  // This is a placeholder
  return {
    'Category1': 0,
    // ...
  };
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
```

## 3. index.html

Create a file named `index.html`. This will contain your React or Vanilla JS frontend.
Since GAS serves HTML, you can bundle your React app into a single HTML file or use a CDN-based approach for simplicity in GAS.

```html
<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <script src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
  </head>
  <body>
    <div id="root"></div>
    
    <script type="text/babel">
      // Paste your React components here (Survey, Result, etc.)
      // Note: You cannot use 'import' statements here. You must bundle them or write them in one file.
      
      function App() {
        const handleSubmit = (answers) => {
          google.script.run
            .withSuccessHandler((response) => {
              console.log('Saved!', response);
            })
            .saveResponse({ answers: answers, sessionId: Date.now().toString() });
        };

        return (
          <div className="p-4">
            <h1 className="text-2xl font-bold">성태앱 (GAS Version)</h1>
            {/* Your App Logic */}
          </div>
        );
      }

      ReactDOM.render(<App />, document.getElementById('root'));
    </script>
  </body>
</html>
```

## 4. Deployment
1. Click **Deploy** > **New deployment**.
2. Select **Web app**.
3. Set **Who has access** to "Anyone" (or as needed).
4. Click **Deploy**.
