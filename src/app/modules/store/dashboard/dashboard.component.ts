import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface BranchData {
  'Store Name': string;
  'City': string;
  'Date of Visit': string;
  'Time of Visit': string;
  'Overall Hygiene': string;
  'Overall Experience': string;
  'Greeted within 5 Seconds': string;
  'QR Code Visibility': string;
  'Clean Showcase': string;
  'Uniform Compliance': string;
  'Staff Behavior': string;
  'What Impressed You Most': string;
  'Mystery Shopper Name': string;
  'Sales Person Name': string;
  [key: string]: string; // allow extra columns
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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchBranches();
  }

  fetchBranches(): void {
    this.isLoading = true;

    this.http.get(this.csvUrl, { responseType: 'text' }).subscribe({
      next: (csv: string) => {
        this.branches = this.csvToJson(csv);
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
      // Better CSV parsing - handles commas inside quotes
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
    return branch['Store Name'] || 'N/A';
  }

  getCity(branch: BranchData): string {
    return branch['City'] || '-';
  }

  getDateOfVisit(branch: BranchData): string {
    return branch['Date of Visit'] || '-';
  }

  getTimeOfVisit(branch: BranchData): string {
    return branch['Time of Visit'] || '';
  }

  getOverallHygiene(branch: BranchData): number {
    return Number(branch['Overall Hygiene']) || 0;
  }

  getFinalScoresOverallExperience(branch: BranchData): number {
    return Number(branch['Overall Experience']) || 0;
  }

  getGreetedWithin5Seconds(branch: BranchData): string {
    return branch['Greeted within 5 Seconds'] || 'No';
  }

  getWhatImpressedYouMost(branch: BranchData): string {
    return branch['What Impressed You Most'] || 'Nothing mentioned';
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
      const dateA = new Date(a['Date of Visit'] || '1900-01-01');
      const dateB = new Date(b['Date of Visit'] || '1900-01-01');
      return dateB.getTime() - dateA.getTime();
    })[0];
  }

  greetingRate(): number {
    const yes = this.branches.filter(b => b['Greeted within 5 Seconds']?.trim().toLowerCase() === 'yes').length;
    return this.branches.length ? Math.round((yes / this.branches.length) * 100) : 0;
  }

  // Add more percentage methods as needed...
  qrVisibilityRate(): number {
    const yes = this.branches.filter(b => b['QR Code Visibility']?.trim().toLowerCase() === 'yes').length;
    return this.branches.length ? Math.round((yes / this.branches.length) * 100) : 0;
  }

  cleanShowcaseRate(): number {
    const yes = this.branches.filter(b => b['Clean Showcase']?.trim().toLowerCase() === 'yes').length;
    return this.branches.length ? Math.round((yes / this.branches.length) * 100) : 0;
  }

  uniformComplianceRate(): number {
    const yes = this.branches.filter(b => b['Uniform Compliance']?.trim().toLowerCase() === 'yes').length;
    return this.branches.length ? Math.round((yes / this.branches.length) * 100) : 0;
  }

  staffBehaviorRate(): number {
    const good = this.branches.filter(b => ['excellent', 'good'].includes(b['Staff Behavior']?.trim().toLowerCase())).length;
    return this.branches.length ? Math.round((good / this.branches.length) * 100) : 0;
  }

  // ─── Styling Helpers ───────────────────────────────────────────────

  getYesNoClass(value: string): string {
    return value?.toLowerCase() === 'yes' ? 'text-green-600' : 'text-red-600';
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
    if (v === 'excellent') return 'bg-green-100 text-green-800';
    if (v === 'good') return 'bg-blue-100 text-blue-800';
    if (v === 'average') return 'bg-yellow-100 text-yellow-800';
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