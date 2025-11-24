import { Injectable } from '@angular/core';
import { ThemeService } from './theme.service';

@Injectable({
  providedIn: 'root',
})
export class PlotlyThemeService {

  constructor(private themeService: ThemeService) {}

  getLayoutTemplate(): any {
    const isDark = this.themeService.isDarkMode();

    return {
      paper_bgcolor: isDark ? '#212529' : '#ffffff',
      plot_bgcolor: isDark ? '#212529' : '#ffffff',
      font: {
        color: isDark ? '#f8f9fa' : '#212529',
      },
      xaxis: {
        gridcolor: isDark ? '#3d4247' : '#e9ecef',
        zerolinecolor: isDark ? '#495057' : '#dee2e6',
        tickcolor: isDark ? '#adb5bd' : '#6c757d',
        linecolor: isDark ? '#495057' : '#dee2e6',
      },
      yaxis: {
        gridcolor: isDark ? '#3d4247' : '#e9ecef',
        zerolinecolor: isDark ? '#495057' : '#dee2e6',
        tickcolor: isDark ? '#adb5bd' : '#6c757d',
        linecolor: isDark ? '#495057' : '#dee2e6',
      },
      legend: {
        bgcolor: isDark ? '#2d3136' : '#ffffff',
        bordercolor: isDark ? '#495057' : '#dee2e6',
        font: {
          color: isDark ? '#f8f9fa' : '#212529',
        },
      },
      colorway: isDark ? [
        '#4dabf7',
        '#51cf66',
        '#ff6b6b',
        '#ffd43b',
        '#da77f2',
        '#38d9a9',
        '#ff8787',
        '#74c0fc',
        '#94d82d',
        '#ffa94d',
      ] : [
        '#1971c2',
        '#2f9e44',
        '#e03131',
        '#f59f00',
        '#9c36b5',
        '#0ca678',
        '#c92a2a',
        '#1864ab',
        '#5c940d',
        '#d9480f',
      ],
    };
  }

  applyThemeToLayout(layout: any): any {
    const template = this.getLayoutTemplate();

    return {
      ...layout,
      paper_bgcolor: template.paper_bgcolor,
      plot_bgcolor: template.plot_bgcolor,
      font: {
        ...layout.font,
        color: template.font.color,
      },
      xaxis: {
        ...layout.xaxis,
        gridcolor: template.xaxis.gridcolor,
        zerolinecolor: template.xaxis.zerolinecolor,
        tickcolor: template.xaxis.tickcolor,
        linecolor: template.xaxis.linecolor,
        tickfont: {
          ...layout.xaxis?.tickfont,
          color: template.font.color,
        },
      },
      yaxis: {
        ...layout.yaxis,
        gridcolor: template.yaxis.gridcolor,
        zerolinecolor: template.yaxis.zerolinecolor,
        tickcolor: template.yaxis.tickcolor,
        linecolor: template.yaxis.linecolor,
        tickfont: {
          ...layout.yaxis?.tickfont,
          color: template.font.color,
        },
      },
      legend: {
        ...layout.legend,
        bgcolor: template.legend.bgcolor,
        bordercolor: template.legend.bordercolor,
        font: {
          ...layout.legend?.font,
          color: template.legend.font.color,
        },
      },
    };
  }
}
