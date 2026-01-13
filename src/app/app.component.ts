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
toggleSidebar() {
  console.log("hello");
  
  this.isSidebarCollapsed = !this.isSidebarCollapsed;
}
}
