import { StudyLog, UserProfile, StreakInfo } from '../types';

/**
 * Exports student study logs to a CSV file for spreadsheet analysis & school records
 */
export function exportStudyLogsToCSV(
  logs: StudyLog[],
  profile: UserProfile | null,
  termNumber?: number
) {
  const studentName = profile?.name || 'Student';
  const studentYear = profile?.yearLevel || 10;
  const filteredLogs = termNumber
    ? logs.filter((l) => l.termNumber === termNumber)
    : logs;

  const headers = [
    'Student Name',
    'Email',
    'Year Level',
    'Date',
    'Term',
    'Week',
    'Subject',
    'Duration (Minutes)',
    'Duration (Hours)',
    'Notes / Reflection',
  ];

  const rows = filteredLogs.map((l) => {
    const hours = (Math.round(((l.durationMinutes || 0) / 60) * 10) / 10).toFixed(1);
    const cleanNotes = (l.notes || '').replace(/"/g, '""');
    return [
      `"${studentName.replace(/"/g, '""')}"`,
      `"${(profile?.email || '').replace(/"/g, '""')}"`,
      studentYear,
      `"${l.date}"`,
      l.termNumber,
      l.weekNumber,
      `"${(l.subject || '').replace(/"/g, '""')}"`,
      l.durationMinutes,
      hours,
      `"${cleanNotes}"`,
    ];
  });

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const termLabel = termNumber ? `_Term_${termNumber}` : '_All_Terms';
  const safeName = studentName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  link.setAttribute(
    'download',
    `Path_To_Potential_Study_Logs_Year_${studentYear}_${safeName}${termLabel}_${new Date().toISOString().split('T')[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Opens a formatted, academic-grade print view / PDF generator
 * Styled for official school record-keeping and student academic portfolios
 */
export function exportStudyLogsToPDF(
  logs: StudyLog[],
  profile: UserProfile | null,
  termNumber: number,
  streakInfo?: StreakInfo,
  reflectionsMap?: Record<string, string>,
  weeksList?: number[]
) {
  const studentName = profile?.name || 'Secondary Student';
  const studentEmail = profile?.email || 'student@glennie.qld.edu.au';
  const yearLevel = profile?.yearLevel || 10;
  const weeklyGoal = profile?.weeklyGoal || 15;
  const filteredLogs = logs.filter((l) => l.termNumber === termNumber);

  const totalMinutes = filteredLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  const subjectMap: Record<string, number> = {};
  filteredLogs.forEach((l) => {
    subjectMap[l.subject] = (subjectMap[l.subject] || 0) + (l.durationMinutes || 0);
  });

  const topSubjects = Object.entries(subjectMap)
    .sort((a, b) => b[1] - a[1])
    .map(([sub, mins]) => `${sub} (${Math.round((mins / 60) * 10) / 10}h)`)
    .slice(0, 5)
    .join(', ');

  // Compute weekly breakdown
  const weeks = weeksList || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const weeklySummaryRows = weeks.map((w) => {
    const wLogs = filteredLogs.filter((l) => l.weekNumber === w);
    const mins = wLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
    const hrs = Math.round((mins / 60) * 10) / 10;
    const pct = Math.round((hrs / Math.max(1, weeklyGoal)) * 100);
    const ref = reflectionsMap?.[`t${termNumber}-w${w}`] || '—';
    const status = hrs >= weeklyGoal ? 'Goal Met' : hrs >= weeklyGoal * 0.8 ? 'Near Target' : hrs > 0 ? 'In Progress' : 'No Log';
    return { week: w, hrs, pct, status, sessions: wLogs.length, reflection: ref };
  });

  const medalsEarned: string[] = [];
  if (streakInfo?.medals.gold) medalsEarned.push('🥇 Gold Medal (7-Week Streak)');
  else if (streakInfo?.medals.silver) medalsEarned.push('🥈 Silver Medal (5-Week Streak)');
  else if (streakInfo?.medals.bronze) medalsEarned.push('🥉 Bronze Medal (3-Week Streak)');
  else medalsEarned.push('Developing Streak');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open and print the academic PDF report.');
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Path to Potential - Academic Study Record - Year ${yearLevel} ${studentName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 20px;
      line-height: 1.4;
      background: #fff;
    }
    .header-box {
      border-bottom: 3px solid #4A154B;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .school-title {
      font-size: 20px;
      font-weight: 800;
      color: #4A154B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .sub-title {
      font-size: 11px;
      color: #D4AF37;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    .meta-box {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 18px;
      font-size: 11px;
    }
    .meta-item strong {
      display: block;
      color: #64748b;
      font-size: 9px;
      text-transform: uppercase;
    }
    .meta-item span {
      font-weight: 700;
      color: #0f172a;
      font-size: 12px;
    }
    .achievement-banner {
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
    }
    .achievement-item {
      display: flex;
      flex-direction: column;
    }
    .achievement-item strong {
      font-size: 9px;
      color: #6b21a8;
      text-transform: uppercase;
    }
    .achievement-item span {
      font-weight: 800;
      color: #4A154B;
      font-size: 12px;
    }
    h3 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #4A154B;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin: 16px 0 8px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      margin-bottom: 16px;
    }
    th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      font-size: 9.5px;
      text-transform: uppercase;
    }
    td {
      padding: 5px 8px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }
    tr:nth-child(even) td {
      background-color: #fafafa;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
    }
    .status-met { background: #dcfce7; color: #15803d; }
    .status-near { background: #fef3c7; color: #b45309; }
    .status-prog { background: #f1f5f9; color: #475569; }
    .signoff-section {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px solid #cbd5e1;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      font-size: 10px;
    }
    .sign-line {
      margin-top: 28px;
      border-bottom: 1px solid #64748b;
      padding-bottom: 2px;
      color: #64748b;
      font-size: 9px;
    }
    .btn-print {
      position: fixed;
      top: 12px;
      right: 12px;
      background: #4A154B;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    @media print {
      .btn-print { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>

  <div class="header-box">
    <div>
      <h1 class="school-title">Path to Potential</h1>
      <div class="sub-title">Official Academic Study Record • Term ${termNumber}</div>
    </div>
    <div style="text-align: right; font-size: 10px; color: #64748b;">
      Generated: ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
    </div>
  </div>

  <div class="meta-box">
    <div class="meta-item">
      <strong>Student Name</strong>
      <span>${studentName}</span>
    </div>
    <div class="meta-item">
      <strong>Student Email</strong>
      <span>${studentEmail}</span>
    </div>
    <div class="meta-item">
      <strong>Academic Cohort</strong>
      <span>Year ${yearLevel}</span>
    </div>
    <div class="meta-item">
      <strong>Weekly Target Benchmark</strong>
      <span>${weeklyGoal} Hours / Week</span>
    </div>
  </div>

  <div class="achievement-banner">
    <div class="achievement-item">
      <strong>Total Logged (Term ${termNumber})</strong>
      <span>${totalHours} hrs (${filteredLogs.length} sessions)</span>
    </div>
    <div class="achievement-item">
      <strong>Current Weekly Streak</strong>
      <span>🔥 ${streakInfo?.currentStreak || 0} Consecutive Weeks</span>
    </div>
    <div class="achievement-item">
      <strong>Longest Streak</strong>
      <span>⭐ ${streakInfo?.longestStreak || 0} Weeks</span>
    </div>
    <div class="achievement-item">
      <strong>Achievement Tier</strong>
      <span>${medalsEarned.join(', ')}</span>
    </div>
  </div>

  <h3>Term ${termNumber} Weekly Summary & Reflection Notes</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 12%;">Week</th>
        <th style="width: 14%;">Hours Logged</th>
        <th style="width: 12%;">Goal</th>
        <th style="width: 12%;">% Achieved</th>
        <th style="width: 15%;">Status</th>
        <th style="width: 35%;">Weekly Reflection / Focus</th>
      </tr>
    </thead>
    <tbody>
      ${weeklySummaryRows
        .map(
          (r) => `
        <tr>
          <td><strong>Week ${r.week}</strong></td>
          <td>${r.hrs}h (${r.sessions} sessions)</td>
          <td>${weeklyGoal}h</td>
          <td>${r.pct}%</td>
          <td><span class="status-badge ${
            r.hrs >= weeklyGoal
              ? 'status-met'
              : r.hrs >= weeklyGoal * 0.8
              ? 'status-near'
              : 'status-prog'
          }">${r.status}</span></td>
          <td style="font-style: italic; color: #475569;">${r.reflection}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <h3>Chronological Study Log Entries (Term ${termNumber})</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 14%;">Date</th>
        <th style="width: 10%;">Week</th>
        <th style="width: 24%;">Subject</th>
        <th style="width: 14%;">Duration</th>
        <th style="width: 38%;">Session Focus / Learning Outcomes</th>
      </tr>
    </thead>
    <tbody>
      ${
        filteredLogs.length === 0
          ? `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 12px;">No logged sessions recorded for Term ${termNumber}.</td></tr>`
          : filteredLogs
              .slice(0, 30)
              .map(
                (l) => `
        <tr>
          <td>${l.date}</td>
          <td>Week ${l.weekNumber}</td>
          <td><strong>${l.subject}</strong></td>
          <td>${(Math.round(((l.durationMinutes || 0) / 60) * 10) / 10).toFixed(1)}h (${l.durationMinutes}m)</td>
          <td>${l.notes || '—'}</td>
        </tr>
      `
              )
              .join('')
      }
    </tbody>
  </table>

  <div class="signoff-section">
    <div>
      <div class="sign-line">Student Signature: </div>
      <div style="margin-top: 4px; color: #94a3b8;">${studentName}</div>
    </div>
    <div>
      <div class="sign-line">Teacher / Academic Mentor Signature: </div>
      <div style="margin-top: 4px; color: #94a3b8;">Glennie Faculty Advisor</div>
    </div>
    <div>
      <div class="sign-line">Date of Review: </div>
      <div style="margin-top: 4px; color: #94a3b8;">___ / ___ / 2026</div>
    </div>
  </div>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
