import * as XLSX from 'xlsx-js-style';
import type { CellObject, WorkSheet } from 'xlsx-js-style';

// Style helper functions
function createStyledCell(value: any, style: Partial<CellObject> = {}): CellObject {
  return {
    v: value,
    t: typeof value === 'number' ? 'n' : 's',
    s: style.s || {},
    ...style
  };
}

function applyCellStyle(sheet: WorkSheet, cell: string, style: any) {
  if (!sheet[cell]) {
    sheet[cell] = { t: 's', v: '' };
  }
  sheet[cell].s = style;
}

export type EmployeeTimesheetData = {
  employee: {
    username: string;
    email: string | null;
  };
  period: {
    month: number;
    year: number;
  };
  workHours: Array<{
    date: string;
    project: string;
    hours: number;
    note: string | null;
  }>;
  absences: Array<{
    startDate: string;
    endDate: string;
    type: string;
    days: number;
  }>;
  summary: {
    totalWorkHours: number;
    totalAbsenceDays: number;
    projectBreakdown: Record<string, number>;
  };
};

export function exportTimesheetToExcel(data: EmployeeTimesheetData) {
  const { employee, period, workHours, absences, summary } = data;

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData: any[][] = [
    ['EMPLOYEE TIMESHEET REPORT'],
    [],
    ['Employee:', employee.username],
    ['Email:', employee.email || 'N/A'],
    ['Period:', `${getMonthName(period.month)} ${period.year}`],
    [],
    ['WORK SUMMARY'],
    [],
  ];

  // Add project breakdown
  const projectEntries = Object.entries(summary.projectBreakdown).sort((a, b) => b[1] - a[1]);
  summaryData.push(['Projects Worked On:']);
  projectEntries.forEach(([project, hours]) => {
    summaryData.push(['', `${project}`, `${hours.toFixed(2)} hours`]);
  });
  summaryData.push([]);
  summaryData.push(['Total Work Hours:', '', `${summary.totalWorkHours.toFixed(2)} hours`]);
  
  // Add absence summary
  if (absences.length > 0) {
    summaryData.push([]);
    summaryData.push(['ABSENCE SUMMARY']);
    summaryData.push([]);
    
    // Group absences by type
    const absencesByType = absences.reduce((acc, absence) => {
      if (!acc[absence.type]) {
        acc[absence.type] = [];
      }
      acc[absence.type].push(absence);
      return acc;
    }, {} as Record<string, typeof absences>);

    Object.entries(absencesByType).forEach(([type, typeAbsences]) => {
      const totalDays = typeAbsences.reduce((sum, a) => sum + a.days, 0);
      summaryData.push([`${type}:`, '', `${totalDays} days`]);
      typeAbsences.forEach(absence => {
        const startDate = formatDate(absence.startDate);
        const endDate = formatDate(absence.endDate);
        const dateRange = startDate === endDate ? startDate : `${startDate} - ${endDate}`;
        summaryData.push(['', dateRange, `${absence.days} days`]);
      });
      summaryData.push([]);
    });

    summaryData.push(['Total Absence Days:', '', `${summary.totalAbsenceDays} days`]);
  } else {
    summaryData.push([]);
    summaryData.push(['ABSENCE SUMMARY']);
    summaryData.push([]);
    summaryData.push(['No absences recorded for this period']);
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

  // Style the summary sheet
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 20 }];

  // Apply styles
  // Main title - Row 1
  if (summarySheet['A1']) {
    summarySheet['A1'].s = {
      font: { bold: true, sz: 16, color: { rgb: "244B77" } },
      fill: { fgColor: { rgb: "E8F4F8" } },
      alignment: { horizontal: "left", vertical: "center" }
    };
  }

  // Employee info styling - Rows 3-5
  ['A3', 'A4', 'A5'].forEach(cell => {
    if (summarySheet[cell]) {
      summarySheet[cell].s = {
        font: { bold: true, sz: 11 },
        alignment: { horizontal: "left" }
      };
    }
  });

  // "WORK SUMMARY" header - Row 7
  if (summarySheet['A7']) {
    summarySheet['A7'].s = {
      font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "10B981" } },
      alignment: { horizontal: "left", vertical: "center" }
    };
  }

  // Find "ABSENCE SUMMARY" row
  const absenceSummaryRow = summaryData.findIndex(row => row[0] === 'ABSENCE SUMMARY');
  if (absenceSummaryRow >= 0) {
    const absenceCell = `A${absenceSummaryRow + 1}`;
    if (summarySheet[absenceCell]) {
      summarySheet[absenceCell].s = {
        font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "F59E0B" } },
        alignment: { horizontal: "left", vertical: "center" }
      };
    }
  }

  // Style total rows (bold)
  summaryData.forEach((row, idx) => {
    if (row[0]?.toString().includes('Total')) {
      const cellA = `A${idx + 1}`;
      const cellC = `C${idx + 1}`;
      if (summarySheet[cellA]) {
        summarySheet[cellA].s = {
          font: { bold: true, sz: 12 },
          fill: { fgColor: { rgb: "F3F4F6" } }
        };
      }
      if (summarySheet[cellC]) {
        summarySheet[cellC].s = {
          font: { bold: true, sz: 12 },
          fill: { fgColor: { rgb: "F3F4F6" } }
        };
      }
    }
  });
  
  // Sheet 2: Work Hours Details (grouped by project)
  const workHoursData: any[][] = [
    ['WORK HOURS DETAILS'],
    [],
    ['Date', 'Project', 'Hours', 'Notes'],
  ];

  // Group work hours by project
  const workHoursByProject = workHours.reduce((acc, wh) => {
    if (!acc[wh.project]) {
      acc[wh.project] = [];
    }
    acc[wh.project].push(wh);
    return acc;
  }, {} as Record<string, typeof workHours>);

  // Add work hours grouped by project
  Object.entries(workHoursByProject).forEach(([project, hours]) => {
    const projectTotal = hours.reduce((sum, h) => sum + h.hours, 0);
    workHoursData.push([]);
    workHoursData.push([`PROJECT: ${project}`, '', `${projectTotal.toFixed(2)} hours`, '']);
    hours.forEach(wh => {
      workHoursData.push([
        formatDate(wh.date),
        '',
        wh.hours.toFixed(2),
        wh.note || ''
      ]);
    });
  });

  workHoursData.push([]);
  workHoursData.push(['TOTAL HOURS:', '', summary.totalWorkHours.toFixed(2), '']);

  const workHoursSheet = XLSX.utils.aoa_to_sheet(workHoursData);
  workHoursSheet['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 40 }];

  // Style work hours sheet
  // Main title
  if (workHoursSheet['A1']) {
    workHoursSheet['A1'].s = {
      font: { bold: true, sz: 16, color: { rgb: "244B77" } },
      fill: { fgColor: { rgb: "E8F4F8" } }
    };
  }

  // Column headers (Row 3)
  ['A3', 'B3', 'C3', 'D3'].forEach(cell => {
    if (workHoursSheet[cell]) {
      workHoursSheet[cell].s = {
        font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "3B82F6" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
  });

  // Style project headers and totals
  workHoursData.forEach((row, idx) => {
    if (row[0]?.toString().startsWith('PROJECT:')) {
      const cellA = `A${idx + 1}`;
      const cellC = `C${idx + 1}`;
      if (workHoursSheet[cellA]) {
        workHoursSheet[cellA].s = {
          font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "8B5CF6" } }
        };
      }
      if (workHoursSheet[cellC]) {
        workHoursSheet[cellC].s = {
          font: { bold: true, sz: 11 },
          fill: { fgColor: { rgb: "DDD6FE" } }
        };
      }
    }
    if (row[0] === 'TOTAL HOURS:') {
      const cellA = `A${idx + 1}`;
      const cellC = `C${idx + 1}`;
      if (workHoursSheet[cellA]) {
        workHoursSheet[cellA].s = {
          font: { bold: true, sz: 12 },
          fill: { fgColor: { rgb: "DBEAFE" } }
        };
      }
      if (workHoursSheet[cellC]) {
        workHoursSheet[cellC].s = {
          font: { bold: true, sz: 12 },
          fill: { fgColor: { rgb: "DBEAFE" } }
        };
      }
    }
  });

  // Sheet 3: Absences (grouped by type)
  const absencesData: any[][] = [
    ['ABSENCE DETAILS'],
    [],
  ];

  if (absences.length > 0) {
    // Group absences by type
    const absencesByType = absences.reduce((acc, absence) => {
      if (!acc[absence.type]) {
        acc[absence.type] = [];
      }
      acc[absence.type].push(absence);
      return acc;
    }, {} as Record<string, typeof absences>);

    // Add header
    absencesData.push(['Type', 'Start Date', 'End Date', 'Days']);
    absencesData.push([]);

    // Add absences grouped by type
    Object.entries(absencesByType).forEach(([type, typeAbsences]) => {
      const typeDays = typeAbsences.reduce((sum, a) => sum + a.days, 0);
      absencesData.push([`${type}`, '', '', `${typeDays} days total`]);
      typeAbsences.forEach(absence => {
        absencesData.push([
          '',
          formatDate(absence.startDate),
          formatDate(absence.endDate),
          absence.days
        ]);
      });
      absencesData.push([]);
    });

    absencesData.push(['TOTAL ABSENCE DAYS:', '', '', summary.totalAbsenceDays]);
  } else {
    absencesData.push(['No absences recorded for this period']);
  }

  const absencesSheet = XLSX.utils.aoa_to_sheet(absencesData);
  absencesSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

  // Style absences sheet
  // Main title
  if (absencesSheet['A1']) {
    absencesSheet['A1'].s = {
      font: { bold: true, sz: 16, color: { rgb: "244B77" } },
      fill: { fgColor: { rgb: "E8F4F8" } }
    };
  }

  if (absences.length > 0) {
    // Column headers (Row 3)
    ['A3', 'B3', 'C3', 'D3'].forEach(cell => {
      if (absencesSheet[cell]) {
        absencesSheet[cell].s = {
          font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "EF4444" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
    });

    // Style absence type headers
    absencesData.forEach((row, idx) => {
      const cellA = `A${idx + 1}`;
      const cellD = `D${idx + 1}`;
      
      // Type headers (VACATION, SICK, etc.)
      if (row[0] && ['VACATION', 'SICK', 'PERSONAL', 'PARENTAL'].includes(row[0].toString())) {
        if (absencesSheet[cellA]) {
          absencesSheet[cellA].s = {
            font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "F59E0B" } }
          };
        }
        if (absencesSheet[cellD]) {
          absencesSheet[cellD].s = {
            font: { bold: true, sz: 11 },
            fill: { fgColor: { rgb: "FEF3C7" } }
          };
        }
      }
      
      // Total row
      if (row[0] === 'TOTAL ABSENCE DAYS:') {
        if (absencesSheet[cellA]) {
          absencesSheet[cellA].s = {
            font: { bold: true, sz: 12 },
            fill: { fgColor: { rgb: "FEE2E2" } }
          };
        }
        if (absencesSheet[cellD]) {
          absencesSheet[cellD].s = {
            font: { bold: true, sz: 12 },
            fill: { fgColor: { rgb: "FEE2E2" } }
          };
        }
      }
    });
  }

  // Add sheets to workbook
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
  XLSX.utils.book_append_sheet(wb, workHoursSheet, 'Work Hours');
  XLSX.utils.book_append_sheet(wb, absencesSheet, 'Absences');

  // Generate filename
  const filename = `timesheet_${employee.username}_${period.year}_${String(period.month + 1).padStart(2, '0')}.xlsx`;

  // Write file
  XLSX.writeFile(wb, filename);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
}
