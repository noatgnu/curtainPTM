import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { StringNetworkService } from '../string-network.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-protein-info-panel',
  templateUrl: './protein-info-panel.component.html',
  styleUrls: ['./protein-info-panel.component.scss'],
  standalone: false
})
export class ProteinInfoPanelComponent implements OnChanges, AfterViewInit {
  @ViewChild('contentFrame', { static: false }) contentFrame?: ElementRef<HTMLIFrameElement>;

  @Input() proteinId: string | null = null;
  @Input() edgeInfo: { node1: string; node2: string } | null = null;
  @Input() position: { x: number; y: number } = { x: 0, y: 0 };
  @Input() visible: boolean = false;
  @Output() close = new EventEmitter<void>();

  contentHtml: string = '';
  loading: boolean = false;
  error: string = '';

  constructor(
    private stringService: StringNetworkService,
    private sanitizer: DomSanitizer
  ) {}

  ngAfterViewInit(): void {
    if (this.contentFrame && this.visible && this.contentHtml) {
      this.renderInIframe();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && !this.visible) {
      this.contentHtml = '';
    }

    if ((changes['proteinId'] || changes['edgeInfo']) && this.visible) {
      this.loadContent();
    }
  }

  loadContent(): void {
    if (this.proteinId) {
      this.loading = true;
      this.error = '';
      this.stringService.getProteinInfo(this.proteinId).subscribe({
        next: (html) => {
          this.contentHtml = html;
          this.loading = false;
          this.renderInIframe();
        },
        error: (err) => {
          console.error('Error loading protein info:', err);
          this.error = 'Failed to load protein information';
          this.loading = false;
        }
      });
    } else if (this.edgeInfo) {
      this.loading = true;
      this.error = '';
      this.stringService.getEdgeInfo(this.edgeInfo.node1, this.edgeInfo.node2).subscribe({
        next: (html) => {
          this.contentHtml = html;
          this.loading = false;
          this.renderInIframe();
        },
        error: (err) => {
          console.error('Error loading edge info:', err);
          this.error = 'Failed to load interaction information';
          this.loading = false;
        }
      });
    }
  }

  private renderInIframe(): void {
    setTimeout(() => {
      if (this.contentFrame) {
        const iframe = this.contentFrame.nativeElement;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

        if (iframeDoc) {
          iframeDoc.open();

          let modifiedHtml = this.contentHtml;
          modifiedHtml = modifiedHtml.replace(/<a\s+/gi, '<a target="_parent" ');
          modifiedHtml = modifiedHtml.replace(/href="(?!http)/gi, 'href="https://string-db.org');

          const wrappedHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body {
                  margin: 0;
                  padding: 10px;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                  background-color: white !important;
                  color: #333 !important;
                  overflow-x: hidden;
                }
                * {
                  color: inherit !important;
                  background-color: transparent !important;
                }
                body > * {
                  background-color: white !important;
                }
                table {
                  background-color: white !important;
                  color: #333 !important;
                }
                td, th {
                  background-color: white !important;
                  color: #333 !important;
                }
                a {
                  color: #0d6efd !important;
                  text-decoration: none;
                }
                a:hover {
                  text-decoration: underline;
                }
              </style>
              <script>
                function toggle_structures_section(direction, proteinId) {
                  var currentElement = document.getElementById('current.section.count.' + proteinId);
                  var maxElement = document.getElementById('max.section.count.' + proteinId);

                  if (!currentElement || !maxElement) return;

                  var current = parseInt(currentElement.textContent);
                  var max = parseInt(maxElement.textContent);

                  var newCurrent = current + direction;
                  if (newCurrent < 1) newCurrent = max;
                  if (newCurrent > max) newCurrent = 1;

                  for (var i = 1; i <= max; i++) {
                    var group = document.getElementById(proteinId + '.protein.section.group.' + i);
                    if (group) {
                      group.style.visibility = (i === newCurrent) ? 'visible' : 'hidden';
                    }
                  }

                  currentElement.textContent = newCurrent;
                }

                window.addEventListener('DOMContentLoaded', function() {
                  var links = document.querySelectorAll('a[href]');
                  links.forEach(function(link) {
                    var href = link.getAttribute('href');
                    if (href && !href.startsWith('javascript:')) {
                      link.setAttribute('target', '_blank');
                    }
                  });
                });
              </script>
            </head>
            <body>
              ${modifiedHtml}
            </body>
            </html>
          `;

          iframeDoc.write(wrappedHtml);
          iframeDoc.close();

          setTimeout(() => {
            const contentHeight = iframeDoc.body.scrollHeight;
            const maxHeight = window.innerHeight * 0.85 - 60;
            iframe.style.height = Math.min(contentHeight + 30, maxHeight) + 'px';
          }, 150);
        }
      }
    }, 100);
  }

  onClose(): void {
    this.close.emit();
  }

  get panelStyle(): any {
    const panelWidth = Math.min(800, window.innerWidth * 0.9);
    const panelHeight = window.innerHeight * 0.85;

    const adjustedX = Math.max(10, Math.min(this.position.x, window.innerWidth - panelWidth - 20));
    const adjustedY = Math.max(10, Math.min(this.position.y, window.innerHeight - 150));

    return {
      position: 'fixed',
      left: `${adjustedX}px`,
      top: `${adjustedY}px`,
      display: this.visible ? 'block' : 'none'
    };
  }
}
