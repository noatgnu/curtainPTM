import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import {NgbDropdownModule, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { FileFormComponent } from './components/file-form/file-form.component';
import {FileInputWidgetComponent} from "./components/file-input-widget/file-input-widget.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import {VolcanoColorsComponent} from "./components/volcano-colors/volcano-colors.component";
import {VolcanoPlotComponent} from "./components/volcano-plot/volcano-plot.component";
import {BatchSearchComponent} from "./components/batch-search/batch-search.component";
import {ProteinSelectionsComponent} from "./components/protein-selections/protein-selections.component";
import {FdrCurveComponent} from "./components/fdr-curve/fdr-curve.component";
import {PlotlyModule} from "angular-plotly.js";
import * as PlotlyJS from 'plotly.js-dist-min';
import {ColorPickerDirective} from "ngx-color-picker";
import {CytoplotComponent} from "./components/cytoplot/cytoplot.component";
import {VolcanoAndCytoComponent} from "./components/volcano-and-cyto/volcano-and-cyto.component";
import {NetworkInteractionsComponent} from "./components/network-interactions/network-interactions.component";
import { DataViewerComponent } from './components/data-viewer/data-viewer.component';
import { DataBlockComponent } from './components/data-block/data-block.component';
import {ProteinInformationComponent} from "./components/protein-information/protein-information.component";
import {ProteinDomainPlotComponent} from "./components/protein-domain-plot/protein-domain-plot.component";
import { RawDataComponent } from './components/raw-data/raw-data.component';
import {BarChartComponent} from "./components/bar-chart/bar-chart.component";
//import {ContextMenuModule, ContextMenuService} from "ngx-contextmenu";
import { PtmPositionViewerComponent } from './components/ptm-position-viewer/ptm-position-viewer.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import {NetphosKinasesComponent} from "./components/netphos-kinases/netphos-kinases.component";
import { KinaseInfoComponent } from './components/kinase-info/kinase-info.component';
import {NgxPrintModule} from "ngx-print";
import {QuillModule} from "ngx-quill";
import {SampleAnnotationComponent} from "./components/sample-annotation/sample-annotation.component";
import {PrideComponent} from "./components/pride/pride.component";
import { SampleOrderAndHideComponent } from './components/sample-order-and-hide/sample-order-and-hide.component';
import { VolcanoPlotTextAnnotationComponent } from './components/volcano-plot-text-annotation/volcano-plot-text-annotation.component';
import { LoginModalComponent } from './accounts/login-modal/login-modal.component';
import { SessionSettingsComponent } from './components/session-settings/session-settings.component';
import {AccountsModule} from "./accounts/accounts.module";
import { KinaseLibraryModalComponent } from './components/kinase-library-modal/kinase-library-modal.component';
import { WebLogoComponent } from './components/web-logo/web-logo.component';
import { DefaultColorPaletteComponent } from './components/default-color-palette/default-color-palette.component';
import { VariantSelectionComponent } from './components/variant-selection/variant-selection.component';
import { SessionExpiredModalComponent } from './components/session-expired-modal/session-expired-modal.component';
import { DataSelectionManagementComponent } from './components/data-selection-management/data-selection-management.component';
import { QrcodeModalComponent } from './components/qrcode-modal/qrcode-modal.component';
import { DraggableElementComponent } from './components/draggable-element/draggable-element.component';
import { SideFloatControlComponent } from './components/side-float-control/side-float-control.component';
import { CollaborateModalComponent } from './components/collaborate-modal/collaborate-modal.component';
import { LocalSessionStateModalComponent } from './components/local-session-state-modal/local-session-state-modal.component';
import { ProfilePlotComponent } from './components/profile-plot/profile-plot.component';
import { SampleConditionAssignmentModalComponent } from './components/sample-condition-assignment-modal/sample-condition-assignment-modal.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { UserPtmImportManagementComponent } from './components/user-ptm-import-management/user-ptm-import-management.component';
import { EncryptionSettingsComponent } from './components/encryption-settings/encryption-settings.component';
import {ToastProgressbarComponent} from "./components/toast-container/toast-progressbar/toast-progressbar.component";
import {ShapesComponent} from "./components/volcano-plot/shapes/shapes.component";
import { NearbyPointsModalComponent } from './components/nearby-points-modal/nearby-points-modal.component';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {ReorderTracesModalComponent} from './components/volcano-plot/reorder-traces-modal/reorder-traces-modal.component';
import { StringNetworkComponent } from './components/string-network/string-network.component';
import { InteractiveNetworkComponent } from './components/string-network/interactive-network/interactive-network.component';
import { ProteinInfoPanelComponent } from './components/string-network/protein-info-panel/protein-info-panel.component';
import { StringNetworkService } from './components/string-network/string-network.service';
import { DataciteMetadataDisplayComponent } from './components/datacite-metadata-display/datacite-metadata-display.component';
import { BatchUploadModalComponent } from './components/batch-upload-modal/batch-upload-modal.component';
import { IndividualSessionComponent } from './components/batch-upload-modal/individual-session/individual-session.component';
//PlotlyViaCDNModule.setPlotlyVersion('latest');
//PlotlyViaCDNModule.setPlotlyBundle('basic');

@NgModule({ declarations: [
        AppComponent,
        HomeComponent,
        ToastContainerComponent,
        FileFormComponent,
        FileInputWidgetComponent,
        VolcanoColorsComponent,
        VolcanoPlotComponent,
        BatchSearchComponent,
        ProteinSelectionsComponent,
        FdrCurveComponent,
        CytoplotComponent,
        VolcanoAndCytoComponent,
        NetworkInteractionsComponent,
        DataViewerComponent,
        DataBlockComponent,
        ProteinInformationComponent,
        ProteinDomainPlotComponent,
        RawDataComponent,
        BarChartComponent,
        PtmPositionViewerComponent,
        NavbarComponent,
        NetphosKinasesComponent,
        KinaseInfoComponent,
        SampleAnnotationComponent,
        PrideComponent,
        SampleOrderAndHideComponent,
        VolcanoPlotTextAnnotationComponent,
        SessionSettingsComponent,
        KinaseLibraryModalComponent,
        WebLogoComponent,
        DefaultColorPaletteComponent,
        VariantSelectionComponent,
        SessionExpiredModalComponent,
        DataSelectionManagementComponent,
        QrcodeModalComponent,
        DraggableElementComponent,
        SideFloatControlComponent,
        CollaborateModalComponent,
        LocalSessionStateModalComponent,
        ProfilePlotComponent,
        SampleConditionAssignmentModalComponent,
        UserPtmImportManagementComponent,
        EncryptionSettingsComponent,
        NearbyPointsModalComponent,
        ReorderTracesModalComponent,
        StringNetworkComponent,
        InteractiveNetworkComponent,
        ProteinInfoPanelComponent,
        BatchUploadModalComponent,
        IndividualSessionComponent,
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        NgbModule,
        FormsModule,
        //ContextMenuModule,
        NgxPrintModule,
        QuillModule.forRoot(),
        PlotlyModule.forRoot(PlotlyJS),
        ColorPickerDirective,
        ReactiveFormsModule,
        AccountsModule,
    NgbDropdownModule,
        ServiceWorkerModule.register('ngsw-worker.js', {
            enabled: !isDevMode(),
            // Register the ServiceWorker as soon as the application is stable
            // or after 30 seconds (whichever comes first).
            registrationStrategy: 'registerWhenStable:30000'
        }),
        ToastProgressbarComponent,
        ShapesComponent,
        DragDropModule,
        DataciteMetadataDisplayComponent], providers: [HttpClient, provideHttpClient(withInterceptorsFromDi()), StringNetworkService] })
export class AppModule { }
