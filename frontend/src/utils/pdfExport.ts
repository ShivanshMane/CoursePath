import jsPDF from 'jspdf';
import { SemesterPlan, ValidationWarning, RequirementsProgress } from '../api/plans';

interface ExportOptions {
  studentName: string;
  planTitle: string;
  catalogYear: number;
  semesterPlans: SemesterPlan[];
  warnings?: ValidationWarning[];
  requirementsProgress?: RequirementsProgress;
  planNotes?: string;
}

export class PlanPDFExporter {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;
  private lineHeight: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
    this.lineHeight = 7;
  }

  export(options: ExportOptions): void {
    // Header
    this.addHeader(options);

    // Plan Info
    this.addPlanInfo(options);

    // Semester Grid
    this.addSemesterGrid(options.semesterPlans);

    // Requirements Progress
    if (options.requirementsProgress) {
      this.addRequirementsProgress(options.requirementsProgress);
    }

    // Warnings
    if (options.warnings && options.warnings.length > 0) {
      this.addWarnings(options.warnings);
    }

    // Plan Notes
    if (options.planNotes) {
      this.addPlanNotes(options.planNotes);
    }

    // Footer
    this.addFooter();

    // Download
    this.doc.save('coursepath-plan.pdf');
  }

  private addHeader(options: ExportOptions): void {
    // Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Academic Plan', this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 12;

    // Student Name
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(options.studentName, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 10;

    // Divider
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 8;
  }

  private addPlanInfo(options: ExportOptions): void {
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    // Plan Title and Catalog Year
    this.doc.text(`Plan: ${options.planTitle}`, this.margin, this.currentY);
    this.doc.text(
      `Catalog Year: ${options.catalogYear}`,
      this.pageWidth - this.margin,
      this.currentY,
      { align: 'right' }
    );
    this.currentY += this.lineHeight;

    // Last Updated
    const now = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    this.doc.text(`Last Updated: ${now}`, this.margin, this.currentY);
    this.currentY += 12;
  }

  private addSemesterGrid(semesterPlans: SemesterPlan[]): void {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Course Schedule', this.margin, this.currentY);
    this.currentY += 10;

    semesterPlans.forEach((semester) => {
      this.checkPageBreak(40);

      // Semester Header
      this.doc.setFillColor(255, 215, 0);
      this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - 2 * this.margin, 8, 'F');
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(semester.semester, this.margin + 2, this.currentY);
      this.doc.text(
        `${semester.total_credits} credits`,
        this.pageWidth - this.margin - 2,
        this.currentY,
        { align: 'right' }
      );
      this.currentY += 8;

      // Courses
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      
      if (semester.items.length === 0) {
        this.doc.setTextColor(150, 150, 150);
        this.doc.text('No courses scheduled', this.margin + 5, this.currentY);
        this.doc.setTextColor(0, 0, 0);
        this.currentY += this.lineHeight;
      } else {
        semester.items.forEach((item) => {
          this.checkPageBreak(10);
          this.doc.text(`• ${item.course_code}`, this.margin + 5, this.currentY);
          if (item.notes) {
            this.doc.setTextColor(100, 100, 100);
            this.doc.setFontSize(9);
            this.doc.text(`  ${item.notes}`, this.margin + 10, this.currentY + 4);
            this.doc.setTextColor(0, 0, 0);
            this.doc.setFontSize(10);
            this.currentY += 4;
          }
          this.currentY += this.lineHeight;
        });
      }

      this.currentY += 5;
    });

    // Total Credits
    const totalCredits = semesterPlans.reduce((sum, sem) => sum + sem.total_credits, 0);
    this.checkPageBreak(15);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Total Credits: ${totalCredits}`, this.pageWidth - this.margin, this.currentY, {
      align: 'right',
    });
    this.currentY += 15;
  }

  private addRequirementsProgress(progress: RequirementsProgress): void {
    this.checkPageBreak(50);

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Requirements Progress', this.margin, this.currentY);
    this.currentY += 10;

    // Progress Bar
    const barWidth = this.pageWidth - 2 * this.margin - 40;
    const barHeight = 10;
    
    // Background
    this.doc.setFillColor(220, 220, 220);
    this.doc.rect(this.margin, this.currentY - 6, barWidth, barHeight, 'F');
    
    // Progress
    this.doc.setFillColor(255, 215, 0);
    const progressWidth = (barWidth * progress.percentage_complete) / 100;
    this.doc.rect(this.margin, this.currentY - 6, progressWidth, barHeight, 'F');
    
    // Percentage
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(
      `${progress.percentage_complete}%`,
      this.margin + barWidth + 5,
      this.currentY
    );
    this.currentY += 12;

    // Stats
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      `Completed: ${progress.completed_requirements} | ` +
      `In Progress: ${progress.in_progress_requirements} | ` +
      `Remaining: ${progress.remaining_requirements}`,
      this.margin,
      this.currentY
    );
    this.currentY += 12;

    // Requirements Details (abbreviated)
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Requirement Groups:', this.margin, this.currentY);
    this.currentY += 7;

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    progress.details.forEach((detail) => {
      this.checkPageBreak(10);
      const status = detail.is_complete ? '✓' : '○';
      const percentage = Math.round(
        ((detail.completed.length + detail.planned.length) / detail.required_courses.length) * 100
      );
      this.doc.text(
        `${status} ${detail.group_name}: ${percentage}% (${detail.completed.length + detail.planned.length}/${detail.required_courses.length})`,
        this.margin + 3,
        this.currentY
      );
      this.currentY += 6;
    });

    this.currentY += 10;
  }

  private addWarnings(warnings: ValidationWarning[]): void {
    this.checkPageBreak(50);

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(200, 0, 0);
    this.doc.text('Plan Issues & Warnings', this.margin, this.currentY);
    this.doc.setTextColor(0, 0, 0);
    this.currentY += 10;

    const errors = warnings.filter((w) => w.severity === 'error');
    const warningsOnly = warnings.filter((w) => w.severity === 'warning');

    // Errors
    if (errors.length > 0) {
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(200, 0, 0);
      this.doc.text(`Errors (${errors.length}):`, this.margin, this.currentY);
      this.doc.setTextColor(0, 0, 0);
      this.currentY += 7;

      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      errors.forEach((warning) => {
        this.checkPageBreak(10);
        this.doc.text(`• ${warning.message}`, this.margin + 3, this.currentY);
        this.currentY += 6;
      });

      this.currentY += 5;
    }

    // Warnings
    if (warningsOnly.length > 0) {
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(200, 150, 0);
      this.doc.text(`Warnings (${warningsOnly.length}):`, this.margin, this.currentY);
      this.doc.setTextColor(0, 0, 0);
      this.currentY += 7;

      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      warningsOnly.forEach((warning) => {
        this.checkPageBreak(10);
        this.doc.text(`• ${warning.message}`, this.margin + 3, this.currentY);
        this.currentY += 6;
      });

      this.currentY += 5;
    }
  }

  private addPlanNotes(notes: string): void {
    this.checkPageBreak(30);

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Plan Notes', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    const lines = this.doc.splitTextToSize(notes, this.pageWidth - 2 * this.margin);
    lines.forEach((line: string) => {
      this.checkPageBreak(10);
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    });
  }

  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(150, 150, 150);
      
      this.doc.text(
        `Generated by CoursePath - Page ${i} of ${pageCount}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      );
      
      this.doc.setTextColor(0, 0, 0);
    }
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin - 15) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }
}

export const exportPlanToPDF = (options: ExportOptions): void => {
  const exporter = new PlanPDFExporter();
  exporter.export(options);
};

