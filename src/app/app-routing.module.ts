import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from "./components/home/home.component";
import {DataciteComponent} from "./components/datacite/datacite.component";
import {CollectionLandingComponent} from "./components/collection-landing/collection-landing.component";
import {AppLayoutComponent} from "./components/app-layout/app-layout.component";

const routes: Routes = [
  { path: 'datacite', component: DataciteComponent },
  { path: 'datacite/:linkID', component: DataciteComponent },
  {
    path: 'collection/:id',
    component: AppLayoutComponent,
    children: [
      { path: '', component: CollectionLandingComponent }
    ]
  },
  { path: 'home', component: HomeComponent },
  { path: 'home/:settings', component: HomeComponent },
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: ':settings', component: HomeComponent },
  { path: '**', redirectTo: 'home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
