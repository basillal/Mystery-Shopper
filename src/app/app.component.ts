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

  ngOnInit() {
    // Start collapsed on mobile
    if (window.innerWidth < 768) {
      this.isSidebarCollapsed = true;
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  closeSidebar() {
    // Only close on mobile (width < 768px as a standard breakpoint)
    if (window.innerWidth < 768) {
      this.isSidebarCollapsed = true;
    }
  }
}
