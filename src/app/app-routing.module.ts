import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from "./components/home/home.component";
import {CollectionLandingComponent} from "./components/collection-landing/collection-landing.component";
import {AppLayoutComponent} from "./components/app-layout/app-layout.component";

const routes: Routes = [

  {
    path: '', component: HomeComponent,
    children: [
      {
        path: 'home', component: HomeComponent
      },
      {
        path: "home/:settings", component: HomeComponent
      }
    ],

  },
  {
    path: 'collection/:id',
    component: AppLayoutComponent,
    children: [
      { path: '', component: CollectionLandingComponent }
    ]
  },
  {path: ':settings', component: HomeComponent},
  {path: "**", redirectTo:"home"}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
