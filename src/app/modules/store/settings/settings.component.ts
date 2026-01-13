import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface BranchData {
  StoreName: string;
  City: string;
  'Date of Visit': string;
  'Mystery Shopper Name': string;
  'Overall Hygiene':  number;
  'Staff Behavior': string;
  'Greeted within 5 seconds': string;
  'Showcases clean':  string;
  'Music volume appropriate': string;
  'Lighting appealing': string;
  'AC comfortable': string;
  'Training Focus for this store:'?:  string;
  [key: string]: any;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  
  // Data
  branches: BranchData[] = [];
  filteredBranches: BranchData[] = [];
  
  // Loading states
  loading = false;
  saving = false;
  
  // Modal state
  showModal = false;
  isEditMode = false;
  selectedBranchIndex:  number = -1;
  
  // Form data
  branchForm:  BranchData = this.getEmptyBranch();
  
  // Search and filter
  searchTerm = '';
  filterCity = '';
  filterHygiene = '';
  sortBy = 'date';
  sortDirection:  'asc' | 'desc' = 'desc';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  
  // Available options
  cities:  string[] = [];
  shoppers: string[] = [];
  
  // Google Sheets URLs
  csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTcCmE7dqToG0ZUhyzHDRPGmcWgIgCrQMhWnT2JZ4MexaBvhCb9kHPxXT2sfCl7mz2YopDn4kU7QnPh/pub?gid=0&single=true&output=csv';
  
  // Google Sheets API configuration (you'll need to set these up)
  private readonly SPREADSHEET_ID = '1Bgrmqzg0fujWKQLA9SeBhQWjPFlzkzqxzbLEWcEr6ps'; // Replace with your actual spreadsheet ID
  private readonly API_KEY = 'AIzaSyD-9QkwaiXAsP0HhGe6-elcWqjpO9VtLJU'; // Replace with your Google Sheets API key
  private readonly SHEET_NAME = 'Sheet1'; // Replace with your sheet name

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchBranches();
  }

  /**
   * Fetch all branches from Google Sheets
   */
  fetchBranches(): void {
    this.loading = true;
    
    this.http.get(this.csvUrl, { responseType: 'text' }).subscribe({
      next: (csv: string) => {
        this.branches = this.csvToJson(csv);
        this.filteredBranches = [... this.branches];
        this. extractOptions();
        this.applyFilters();
        this.loading = false;
        console.log('Loaded branches:', this.branches.length);
      },
      error: (error) => {
        console. error('Error fetching branches:', error);
        this.branches = [];
        this.filteredBranches = [];
        this.loading = false;
        alert('Error loading branch data. Please check the CSV URL.');
      }
    });
  }

  /**
   * Convert CSV to JSON
   */
  csvToJson(csv: string): BranchData[] {
    const lines = csv.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((header, idx) => {
        obj[header] = values[idx]?.trim() || '';
      });
      return obj as BranchData;
    });
  }

  /**
   * Extract unique cities and shoppers
   */
  extractOptions(): void {
    this.cities = [... new Set(this.branches.map(b => b.City).filter(Boolean))];
    this.shoppers = [...new Set(this.branches.map(b => b['Mystery Shopper Name']).filter(Boolean))];
  }

  /**
   * Apply filters and search
   */
  applyFilters(): void {
    let result = [... this.branches];

    // Search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(b => 
        b. StoreName?. toLowerCase().includes(term) ||
        b. City?.toLowerCase().includes(term) ||
        b['Mystery Shopper Name']?.toLowerCase().includes(term)
      );
    }

    // Filter by city
    if (this.filterCity) {
      result = result.filter(b => b.City === this. filterCity);
    }

    // Filter by hygiene
    if (this.filterHygiene) {
      const hygiene = parseFloat(this. filterHygiene);
      result = result.filter(b => parseFloat(b['Overall Hygiene']?. toString() || '0') >= hygiene);
    }

    // Sort
    result.sort((a, b) => {
      let compareA: any, compareB: any;

      switch (this.sortBy) {
        case 'date': 
          compareA = new Date(a['Date of Visit'] || 0).getTime();
          compareB = new Date(b['Date of Visit'] || 0).getTime();
          break;
        case 'name':
          compareA = a. StoreName || '';
          compareB = b. StoreName || '';
          break;
        case 'hygiene': 
          compareA = parseFloat(a['Overall Hygiene']?.toString() || '0');
          compareB = parseFloat(b['Overall Hygiene']?.toString() || '0');
          break;
        case 'city': 
          compareA = a.City || '';
          compareB = b.City || '';
          break;
        default:
          compareA = compareB = 0;
      }

      if (compareA < compareB) return this.sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return this.sortDirection === 'asc' ? 1 :  -1;
      return 0;
    });

    this.filteredBranches = result;
    this.currentPage = 1; // Reset to first page
  }

  /**
   * Save data to Google Sheets
   */
  private async saveToGoogleSheets(data: BranchData, isUpdate: boolean = false, rowIndex?: number): Promise<boolean> {
    try {
      const headers = Object.keys(data);
      const values = headers.map(header => data[header] || '');

      if (isUpdate && rowIndex !== undefined) {
        // Update existing row
        const range = `${this.SHEET_NAME}!A${rowIndex + 2}: ${String. fromCharCode(65 + headers.length - 1)}${rowIndex + 2}`;
        const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.SPREADSHEET_ID}/values/${range}?valueInputOption=RAW&key=${this.API_KEY}`;
        
        const updateData = {
          values: [values]
        };

        const response = await this.http.put(updateUrl, updateData).toPromise();
        return true;
      } else {
        // Append new row
        const range = `${this.SHEET_NAME}!A: A`;
        const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.SPREADSHEET_ID}/values/${range}: append?valueInputOption=RAW&key=${this.API_KEY}`;
        
        const appendData = {
          values: [values]
        };

        const response = await this.http.post(appendUrl, appendData).toPromise();
        return true;
      }
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      return false;
    }
  }

  /**
   * Get paginated branches
   */
  get paginatedBranches(): BranchData[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredBranches.slice(start, end);
  }

  /**
   * Get total pages
   */
  get totalPages(): number {
    return Math.ceil(this.filteredBranches.length / this. itemsPerPage);
  }

  /**
   * Change page
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this. totalPages) {
      this.currentPage = page;
    }
  }

  /**
   * Open modal for adding new branch
   */
  openAddModal(): void {
    this.isEditMode = false;
    this.selectedBranchIndex = -1;
    this.branchForm = this.getEmptyBranch();
    this.showModal = true;
  }

  /**
   * Open modal for editing branch
   */
  openEditModal(branch: BranchData, index: number): void {
    this.isEditMode = true;
    this.selectedBranchIndex = index;
    this. branchForm = { ...branch }; // Create a copy
    this.showModal = true;
  }

  /**
   * Close modal
   */
  closeModal(): void {
    this.showModal = false;
    this. branchForm = this.getEmptyBranch();
    this.selectedBranchIndex = -1;
  }

  /**
   * Save branch (add or update) to Google Sheets
   */
  async saveBranch(): Promise<void> {
    // Validate form
    if (!this.validateForm()) {
      return;
    }

    this.saving = true;

    try {
      let success = false;

      if (this.isEditMode) {
        // Update existing branch
        const actualIndex = this.branches.findIndex(b => b === this.filteredBranches[this.selectedBranchIndex]);
        if (actualIndex !== -1) {
          success = await this.saveToGoogleSheets(this.branchForm, true, actualIndex);
          if (success) {
            this.branches[actualIndex] = { ...this.branchForm };
            alert('Branch updated successfully!');
          }
        }
      } else {
        // Add new branch
        success = await this.saveToGoogleSheets(this.branchForm, false);
        if (success) {
          this.branches.unshift({ ...this.branchForm });
          alert('New branch added successfully!');
        }
      }

      if (! success) {
        alert('Error saving to Google Sheets. Please try again.');
      } else {
        // Refresh the display
        this.applyFilters();
        this.closeModal();
      }
    } catch (error) {
      console.error('Error saving branch:', error);
      alert('Error saving to Google Sheets. Please check your configuration.');
    } finally {
      this.saving = false;
    }
  }

  /**
   * Delete branch from Google Sheets
   */
  async deleteBranch(index:  number): Promise<void> {
    const branch = this.filteredBranches[index];
    const confirmed = confirm(`Are you sure you want to delete "${branch.StoreName}"?`);
    
    if (confirmed) {
      try {
        const actualIndex = this.branches.findIndex(b => b === branch);
        if (actualIndex !== -1) {
          // Note: Google Sheets API doesn't have a direct delete row method
          // You would need to implement this by clearing the row or using batch update
          // For now, we'll remove from local array and warn user
          
          console.warn('Note: Direct row deletion from Google Sheets requires additional API setup');
          
          this.branches.splice(actualIndex, 1);
          this.applyFilters();
          alert('Branch removed from local view.  Note: You may need to manually remove it from Google Sheets.');
        }
      } catch (error) {
        console.error('Error deleting branch:', error);
        alert('Error deleting branch. Please try again.');
      }
    }
  }

  /**
   * Validate form
   */
  validateForm(): boolean {
    if (! this.branchForm.StoreName?. trim()) {
      alert('Please enter a store name');
      return false;
    }
    if (!this.branchForm.City?.trim()) {
      alert('Please enter a city');
      return false;
    }
    if (!this.branchForm['Date of Visit']) {
      alert('Please select a visit date');
      return false;
    }
    if (!this. branchForm['Mystery Shopper Name']?.trim()) {
      alert('Please enter a mystery shopper name');
      return false;
    }
    
    const hygiene = parseFloat(this. branchForm['Overall Hygiene']?.toString() || '0');
    if (hygiene < 1 || hygiene > 5) {
      alert('Hygiene score must be between 1 and 5');
      return false;
    }

    return true;
  }

  /**
   * Get empty branch template
   */
  getEmptyBranch(): BranchData {
    return {
      StoreName: '',
      City: '',
      'Date of Visit': new Date().toISOString().split('T')[0],
      'Mystery Shopper Name': '',
      'Overall Hygiene': 3,
      'Staff Behavior': 'Good',
      'Greeted within 5 seconds': 'Yes',
      'Showcases clean': 'Yes',
      'Music volume appropriate': 'Yes',
      'Lighting appealing': 'Yes',
      'AC comfortable': 'Yes',
      'Training Focus for this store: ': ''
    };
  }

  /**
   * Export branches as CSV
   */
  exportToCSV(): void {
    if (this.branches.length === 0) {
      alert('No data to export');
      return;
    }

    // Get headers from first branch
    const headers = Object.keys(this.branches[0]);
    
    // Create CSV content
    let csv = headers.join(',') + '\n';
    
    this.branches.forEach(branch => {
      const row = headers.map(header => {
        const value = branch[header] || '';
        // Escape commas and quotes
        return `"${value.toString().replace(/"/g, '""')}"`;
      });
      csv += row.join(',') + '\n';
    });

    // Download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL. createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `branches-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export branches as JSON
   */
  exportToJSON(): void {
    if (this.branches.length === 0) {
      alert('No data to export');
      return;
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      totalBranches: this.branches. length,
      branches: this. branches
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `branches-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Refresh data from Google Sheets
   */
  refreshData(): void {
    this.fetchBranches();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.filterCity = '';
    this.filterHygiene = '';
    this.sortBy = 'date';
    this.sortDirection = 'desc';
    this.applyFilters();
  }

  /**
   * Toggle sort direction
   */
  toggleSort(field: string): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' :  'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  /**
   * Get hygiene score color class
   */
  getHygieneClass(score: number): string {
    if (score >= 4) return 'bg-green-100 text-green-800';
    if (score >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  /**
   * Format date for display
   */
  formatDate(date: string): string {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return date;
    }
  }
}