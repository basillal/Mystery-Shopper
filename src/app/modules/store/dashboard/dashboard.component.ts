import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface BranchData {
  "Timestamp": string;
  "StoreName": string;
  "Date of Visit": string;
  "Time Of Visit": string;
  "Mystery Shopper Name": string;
  "Sales Person Name": string;
  "Lighting appealing": string;
  "Music volume appropriate": string;
  "AC comfortable": string;
  "Showcases clean": string;
  "Watches aligned": string;
  "Price tags visible": string;
  "Watch Handling": string;
  "Overall Hygiene": string;
  "Greeted within 5 seconds": string;
  "Smile & eye contact": string;
  "Uniform And Grooming": string;
  "Body Language": string;
  "Product Knowledge": string;
  "Options Shown": string;
  "Up Selling / Cross selling": string;
  "Asked for Google Review": string;
  "Google Review QR Visible": string;
  "Staff Behavior": string;
  "Final Scores  (Overall Experience)": string;
  "What impressed you most?": string;
  "Training Focus for this store:": string;
  "City": string;
  [key: string]: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTcCmE7dqToG0ZUhyzHDRPGmcWgIgCrQMhWnT2JZ4MexaBvhCb9kHPxXT2sfCl7mz2YopDn4kU7QnPh/pub?gid=0&single=true&output=csv';

  branches: BranchData[] = [];
  isLoading = true;
  showAllBranches = false;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.fetchBranches();
  }

  fetchBranches(): void {
    this.isLoading = true;

    this.http.get(this.csvUrl, { responseType: 'text' }).subscribe({
      next: (csv: string) => {
        this.branches = this.csvToJson(csv);
        console.log("Loaded data:", this.branches);
        this.isLoading = false;
        console.log('Loaded audits:', this.branches.length);
      },
      error: (err) => {
        console.error('Error loading CSV:', err);
        this.isLoading = false;
        alert('Failed to load audit data. Please check the Google Sheet link.');
      }
    });
  }

  csvToJson(csv: string): BranchData[] {
    const lines = csv.split('\n').filter(line => line.trim().length > 0);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    return lines.slice(1).map(line => {
      // Handles commas inside quotes
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let char of line + ',') {
        if (char === '"' && !inQuotes) {
          inQuotes = true;
        } else if (char === '"' && inQuotes) {
          inQuotes = false;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }

      const obj: any = {};
      headers.forEach((header, i) => {
        obj[header] = values[i] || '';
      });
      return obj as BranchData;
    });
  }

  isDataLoaded(): boolean {
    return this.branches.length > 0;
  }

  // ─── Helper Getters ───────────────────────────────────────────────

  getStoreName(branch: BranchData): string {
    return branch['StoreName'] || 'N/A';
  }

  getCity(branch: BranchData): string {
    return branch['City'] || '-';
  }

  getDateOfVisit(branch: BranchData): string {
    return branch['Date of Visit'] || '-';
  }

  getTimeOfVisit(branch: BranchData): string {
    return branch['Time Of Visit'] || '';
  }

  getOverallHygiene(branch: BranchData): number {
    return Number(branch['Overall Hygiene']) || 0;
  }

  getFinalScoresOverallExperience(branch: BranchData): number {
    return Number(branch['Final Scores  (Overall Experience)']) || 0;
  }

  getGreetedWithin5Seconds(branch: BranchData): string {
    return branch['Greeted within 5 seconds'] || 'No';
  }

  getWhatImpressedYouMost(branch: BranchData): string {
    return branch['What impressed you most?'] || 'Nothing mentioned';
  }

  getMysteryShopperName(branch: BranchData): string {
    return branch['Mystery Shopper Name'] || '-';
  }

  getSalesPersonName(branch: BranchData): string {
    return branch['Sales Person Name'] || '-';
  }

  getStaffBehavior(branch: BranchData): string {
    return branch['Staff Behavior'] || 'N/A';
  }

  // ─── Calculations ──────────────────────────────────────────────────

  averageScore(): number {
    if (!this.branches.length) return 0;
    const sum = this.branches.reduce((acc, b) => acc + this.getOverallHygiene(b), 0);
    return Number((sum / this.branches.length).toFixed(1));
  }

  averageExperience(): number {
    if (!this.branches.length) return 0;
    const sum = this.branches.reduce((acc, b) => acc + this.getFinalScoresOverallExperience(b), 0);
    return Number((sum / this.branches.length).toFixed(1));
  }

  highestRated(): BranchData | null {
    if (!this.branches.length) return null;
    return [...this.branches].sort((a, b) =>
      this.getFinalScoresOverallExperience(b) - this.getFinalScoresOverallExperience(a)
    )[0];
  }

  lowestRated(): BranchData | null {
    if (!this.branches.length) return null;
    return [...this.branches].sort((a, b) =>
      this.getFinalScoresOverallExperience(a) - this.getFinalScoresOverallExperience(b)
    )[0];
  }

  lastVisit(): BranchData | null {
    if (!this.branches.length) return null;
    return [...this.branches].sort((a, b) => {
      // Helper to parse DD/MM/YYYY
      const parseDate = (dateStr: string) => {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
        return new Date('1900-01-01');
      };
      const dateA = parseDate(a['Date of Visit'] || '');
      const dateB = parseDate(b['Date of Visit'] || '');
      return dateB.getTime() - dateA.getTime();
    })[0];
  }

  greetingRate(): number {
    const yes = this.branches.filter(b => b['Greeted within 5 seconds']?.trim().toLowerCase().startsWith('yes')).length;
    return this.branches.length ? Math.round((yes / this.branches.length) * 100) : 0;
  }

  // Add more percentage methods as needed...
  qrVisibilityRate(): number {
    const yes = this.branches.filter(b => b['Google Review QR Visible']?.trim().toLowerCase() === 'yes').length;
    return this.branches.length ? Math.round((yes / this.branches.length) * 100) : 0;
  }

  cleanShowcaseRate(): number {
    const yes = this.branches.filter(b => b['Showcases clean']?.trim().toLowerCase() === 'yes').length;
    return this.branches.length ? Math.round((yes / this.branches.length) * 100) : 0;
  }

  uniformComplianceRate(): number {
    // Logic might need adjustment based on data content, e.g. "Perfect", "Well dressed", etc.
    const yes = this.branches.filter(b => {
      const val = b['Uniform And Grooming']?.toLowerCase() || '';
      return val.includes('perfect') || val.includes('well dressed') || val.includes('good');
    }).length;
    return this.branches.length ? Math.round((yes / this.branches.length) * 100) : 0;
  }

  staffBehaviorRate(): number {
    const good = this.branches.filter(b => {
      const val = b['Staff Behavior']?.toLowerCase() || '';
      return val.includes('excellent') || val.includes('good');
    }).length;
    return this.branches.length ? Math.round((good / this.branches.length) * 100) : 0;
  }

  // ─── Styling Helpers ───────────────────────────────────────────────

  getYesNoClass(value: string): string {
    return value?.trim().toLowerCase().startsWith('yes') ? 'text-green-600' : 'text-red-600';
  }

  getHygieneScoreClass(score: number): string {
    if (score >= 4.5) return 'bg-green-100 text-green-800';
    if (score >= 3.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  getExperienceScoreClass(score: number): string {
    if (score >= 8) return 'bg-green-100 text-green-800';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  getStaffBehaviorClass(value: string): string {
    const v = value?.toLowerCase();
    if (v.includes('excellent') || v.includes('good')) return 'bg-green-100 text-green-800';
    if (v.includes('average')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  // Simple export (you can improve it later)
  exportToCSV(): void {
    alert('Export functionality will be implemented soon!');
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}