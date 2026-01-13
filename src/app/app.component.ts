import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'my-store';


  // In your Angular TS file:
  isSidebarCollapsed = false;
  currentDate = new Date();

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  closeSidebar() {
    // Only close if on mobile (screen width < 768px typically handled by CSS, but here we can just close it if we interpret 'collapsed' as hidden on mobile)
    // Actually, usually sidebar is hidden by default on mobile. 
    // Let's just toggle it if it's currently showing (which means NOT collapsed in some logics, but let's see)
    // Based on user HTML: *ngIf="!isSidebarCollapsed" means it shows when FALSE.
    // So to hide it, we set isSidebarCollapsed = true.
    this.isSidebarCollapsed = true;
  }
}
