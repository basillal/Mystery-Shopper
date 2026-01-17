import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

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
  protected readonly Math = Math;

  // View State Management
  viewMode: 'dashboard' | 'branches' | 'branch-details' | 'audit-details' = 'dashboard';
  selectedStoreName: string | null = null;
  selectedAudit: BranchData | null = null;

  constructor(private http: HttpClient, private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Reset view on navigation (even same URL if configured)
      this.viewMode = 'dashboard';
      this.selectedStoreName = null;
      this.selectedAudit = null;
      this.fetchBranches();
      this.scrollToTop();
    });
  }

  ngOnInit(): void {
    // Initialization handled by constructor subscription or initial call
    // If navigation triggers immediately, the subscription handles it. 
    // But for first load, we need to fetch.
    if (this.branches.length === 0) {
      this.fetchBranches();
    }
  }

  fetchBranches(): void {
    this.isLoading = true;

    this.http.get(this.csvUrl, { responseType: 'text' }).subscribe({
      next: (csv: string) => {
        console.log("CSV Data:", csv);

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
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentVal = '';
    let inQuotes = false;

    // Normalize newlines for easier processing
    const cleanCsv = csv.replace(/\r\n/g, '\n');

    for (let i = 0; i < cleanCsv.length; i++) {
      const char = cleanCsv[i];
      const nextChar = cleanCsv[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote ("") -> treat as literal quote
          currentVal += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        currentRow.push(currentVal);
        currentVal = '';
      } else if (char === '\n' && !inQuotes) {
        // End of row
        currentRow.push(currentVal);
        rows.push(currentRow);
        currentRow = [];
        currentVal = '';
      } else {
        // Regular character
        currentVal += char;
      }
    }

    // Push last row if exists
    if (currentRow.length > 0 || currentVal.length > 0) {
      currentRow.push(currentVal);
      rows.push(currentRow);
    }

    if (rows.length <= 1) return [];

    const headers = rows[0].map(h => h.trim());

    return rows.slice(1).map(values => {
      const obj: any = {};
      headers.forEach((header, i) => {
        // Strip keys of any accidental whitespace/quotes if still present, though parser handles most
        const key = header.replace(/^"|"$/g, '').trim();
        let val = values[i] || '';
        // Clean value of surrounding quotes if manual logic missed it (usually not needed with this parser but safer)
        // val = val.trim().replace(/^"|"$/g, ''); 
        obj[key] = val.trim();
      });
      return obj as BranchData;
    }).filter(item => item['StoreName'] && item['StoreName'].trim().length > 0);
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
    const impression = branch['What impressed you most?'];
    if (impression && impression.trim().length > 0 && impression.toLowerCase() !== 'nothing mentioned') {
      return impression;
    }
    // Fallback to behavior if impression is empty
    const behavior = branch['Staff Behavior'];
    if (behavior) {
      return `Staff behavior was rated as ${behavior}`;
    }
    return 'No specific highlights recorded for this visit.';
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

  // ─── New Navigation & Logic ────────────────────────────────────────

  get uniqueBranches(): any[] {
    const groups: { [key: string]: BranchData[] } = {};

    this.branches.forEach(b => {
      const name = this.getStoreName(b);
      if (!groups[name]) groups[name] = [];
      groups[name].push(b);
    });

    return Object.keys(groups).map(name => {
      const storeAudits = groups[name];
      // Calculate agregates
      const hygieneSum = storeAudits.reduce((sum, b) => sum + this.getOverallHygiene(b), 0);
      const expSum = storeAudits.reduce((sum, b) => sum + this.getFinalScoresOverallExperience(b), 0);

      // Get last audit for this store
      const lastAudit = storeAudits.sort((a, b) => {
        const dateA = this.parseDate(a['Date of Visit']);
        const dateB = this.parseDate(b['Date of Visit']);
        return dateB.getTime() - dateA.getTime();
      })[0];

      return {
        name,
        city: this.getCity(lastAudit),
        count: storeAudits.length,
        avgHygiene: Number((hygieneSum / storeAudits.length).toFixed(1)),
        avgExperience: Number((expSum / storeAudits.length).toFixed(1)),
        lastAuditDate: this.getDateOfVisit(lastAudit),
        status: this.calculateStatus(storeAudits) // Placeholder
      };
    });
  }

  // Helper to parse DD/MM/YYYY
  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date('1900-01-01');
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    return new Date('1900-01-01');
  }

  calculateStatus(audits: BranchData[]): 'Improving' | 'Declining' | 'Stable' {
    if (audits.length < 2) return 'Stable';
    // Sort by date ascending to check trend
    const sorted = [...audits].sort((a, b) => this.parseDate(a['Date of Visit']).getTime() - this.parseDate(b['Date of Visit']).getTime());

    // Compare last two
    const last = this.getFinalScoresOverallExperience(sorted[sorted.length - 1]);
    const prev = this.getFinalScoresOverallExperience(sorted[sorted.length - 2]);

    if (last > prev) return 'Improving';
    if (last < prev) return 'Declining';
    return 'Stable';
  }

  getAuditsForSelectedStore(): BranchData[] {
    if (!this.selectedStoreName) return [];
    return this.branches.filter(b => this.getStoreName(b) === this.selectedStoreName);
  }

  // Navigation Actions

  showDashboard(): void {
    this.viewMode = 'dashboard';
    this.scrollToTop();
  }

  showBranchesList(): void {
    this.viewMode = 'branches';
    this.scrollToTop();
  }

  openBranchDetails(storeName: string): void {
    this.selectedStoreName = storeName;
    this.viewMode = 'branch-details';
    this.scrollToTop();
  }

  openAuditDetails(audit: BranchData): void {
    this.selectedAudit = audit;
    this.viewMode = 'audit-details';
    this.scrollToTop();
  }

  goBack(): void {
    if (this.viewMode === 'audit-details') {
      this.viewMode = 'branch-details';
    } else if (this.viewMode === 'branch-details') {
      this.viewMode = 'branches';
      this.selectedStoreName = null;
    } else if (this.viewMode === 'branches') {
      this.viewMode = 'dashboard';
    }
  }
}