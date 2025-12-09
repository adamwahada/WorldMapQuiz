import { Component, signal, effect, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

interface Country {
  name: string;
  id: string;
}

interface CountryQuiz extends Country {
  status: 'unanswered' | 'correct' | 'incorrect';
}

@Component({
  selector: 'app-quiz',
  templateUrl: '../app.component.html',
  styleUrls: ['../app.scss','../app.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatTooltipModule, MatIconModule]
})
export class QuizComponent implements AfterViewInit {
  protected readonly score = signal(0);
  protected readonly totalQuestions = signal(0);
  protected readonly correctCount = signal(0);
  protected readonly incorrectCount = signal(0);
  protected readonly answeredCount = signal(0);
  protected readonly countries = signal<CountryQuiz[]>([]);
  private svgPathMap = new Map<SVGPathElement, string>();
  protected readonly randomActive = signal(false);
  protected readonly activeRandomId = signal<string | null>(null);
  protected readonly diceLockedHint = signal('');
  protected readonly mapActive = signal(false);
  protected readonly gameStarted = signal(false);
  protected readonly gameFinished = signal(false);
  protected readonly currentPlayerIdx = signal(0);
  protected readonly players = signal<{ id: number; name: string; score: number }[]>([]);
  protected readonly winnerIdx = signal<number | null>(null);
  protected readonly difficultyMode = signal<'easy' | 'medium' | 'hard'>('easy');
  protected readonly nextAction = signal<'pick' | 'random'>('pick');
  protected readonly selectedPlayers = signal<2 | 3 | 4>(2);
  protected readonly selectedDifficulty = signal<'easy' | 'medium' | 'hard'>('easy');
  protected readonly selectedTimerMinutes = signal<number>(15);
  protected readonly timerRemainingMs = signal<number>(0);
  protected readonly globalEndTs = signal<number>(0);
  private timerId: any = null;

  protected readonly showModal = signal(false);
  protected readonly currentCountry = signal<CountryQuiz | null>(null);
  protected readonly userAnswer = signal('');
  protected readonly modalMessage = signal('');
  protected readonly modalMessageType = signal<'success' | 'error' | 'neutral' | 'winner'>('neutral');
  protected readonly isAnswered = signal(false);
  protected readonly selectedSvgPath = signal<SVGPathElement | null>(null);

  private svgDoc: SVGSVGElement | null = null;
  private zoomLevel = signal(1);
  private panX = signal(0);
  private panY = signal(0);
  private baseViewBox = { x: 0, y: 0, width: 0, height: 0 };

  private countriesEffect = effect(() => {
    const list = this.countries();
    this.svgPathMap.forEach((id, path) => {
      const country = list.find(c => c.id === id);
      if (country) this.updatePathColor(path, country);
    });
    this.correctCount.set(list.filter(c => c.status === 'correct').length);
    this.incorrectCount.set(list.filter(c => c.status === 'incorrect').length);
    this.answeredCount.set(list.filter(c => c.status !== 'unanswered').length);
  });

  @ViewChild('svgContainer') svgContainer!: ElementRef;
  @ViewChild('svgEmbed') svgEmbed!: ElementRef;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadCountries();
      try {
        const rawSettings = localStorage.getItem('gameSettings');
        const rawState = localStorage.getItem('gameState');
        if (rawSettings && !rawState) {
          const s = JSON.parse(rawSettings) as { players: 2|3|4; difficulty: 'easy'|'medium'|'hard'; minutes: number };
          this.selectedPlayers.set(s.players);
          this.selectedDifficulty.set(s.difficulty);
          this.selectedTimerMinutes.set(s.minutes);
          this.confirmSettings();
        }
        if (rawState) {
          const st = JSON.parse(rawState) as any;
          this.players.set(st.players || []);
          this.currentPlayerIdx.set(st.currentPlayerIdx ?? 0);
          this.gameStarted.set(!!st.gameStarted);
          this.gameFinished.set(!!st.gameFinished);
          this.winnerIdx.set(st.winnerIdx ?? null);
          this.difficultyMode.set(st.difficultyMode || 'easy');
          this.nextAction.set(st.nextAction || 'pick');
          if (Array.isArray(st.countries)) this.countries.set(st.countries);
          const now = Date.now();
          if (st.globalEndTs && st.globalEndTs > now) {
            this.startTimerFromEnd(st.globalEndTs);
          }
          if (st.turnEndTs && st.turnEndTs > now) {
            this.startTurnTimerFromEnd(st.turnEndTs);
          }
        }
      } catch {}
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadSVG();
    }
  }

  private loadSVG(): void {
    const svgContainer = this.svgEmbed?.nativeElement as HTMLDivElement;
    if (!svgContainer) {
      return;
    }
    fetch('/world.svg')
      .then(response => response.text())
      .then(svgText => {
        svgContainer.innerHTML = svgText;
        this.svgDoc = svgContainer.querySelector('svg') as SVGSVGElement | null;
        const vbInit = this.svgDoc?.viewBox?.baseVal;
        if (vbInit && vbInit.width > 0 && vbInit.height > 0) {
          this.baseViewBox = { x: vbInit.x, y: vbInit.y, width: vbInit.width, height: vbInit.height };
        } else if (this.svgDoc) {
          const widthAttr = Number(this.svgDoc.getAttribute('width')) || 1024;
          const heightAttr = Number(this.svgDoc.getAttribute('height')) || 512;
          this.baseViewBox = { x: 0, y: 0, width: widthAttr, height: heightAttr };
          this.svgDoc.setAttribute('viewBox', `0 0 ${widthAttr} ${heightAttr}`);
        }
        if (this.svgDoc) this.svgDoc.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        this.initializeSVG();
        setTimeout(() => {
          this.setupZoomAndPan();
        }, 100);
      })
      .catch(() => {});
  }

  private loadCountries(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    fetch('/countries.json')
      .then(response => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
      })
      .then((data: Country[]) => {
        const countriesWithStatus: CountryQuiz[] = data.map((country) => ({ ...country, status: 'unanswered' }));
        this.countries.set(countriesWithStatus);
        this.totalQuestions.set(countriesWithStatus.length);
      })
      .catch(() => {});
  }

  private initializeSVG(): void {
    if (!this.svgDoc) return;
    const paths = this.svgDoc.querySelectorAll('path');
    const allCountries = this.countries();
    paths.forEach((path: SVGPathElement) => {
      const id = path.getAttribute('id') || '';
      const name = path.getAttribute('name') || '';
      let country = allCountries.find(c => c.id.toLowerCase() === id.toLowerCase());
      if (!country) {
        country = allCountries.find(c => c.name.toLowerCase() === name.toLowerCase());
      }
      if (country) {
        this.svgPathMap.set(path, country.id);
        path.style.cursor = 'pointer';
        path.style.transition = 'all 0.3s ease';
        path.setAttribute('vector-effect', 'non-scaling-stroke');
        this.updatePathColor(path, country);
        path.addEventListener('click', (e) => { e.stopPropagation(); this.onCountrySVGClick(path); });
        path.addEventListener('mouseenter', () => {
          const id = this.svgPathMap.get(path);
          const current = id ? this.countries().find(c => c.id === id) : null;
          if (current?.status === 'unanswered') {
            path.style.opacity = '0.7';
          } else if (current) {
            this.showTooltip(path, `${current.name}`);
          }
        });
        path.addEventListener('mouseleave', () => {
          const id = this.svgPathMap.get(path);
          const current = id ? this.countries().find(c => c.id === id) : null;
          if (current?.status === 'unanswered') {
            path.style.opacity = '1';
          }
          this.hideTooltip();
        });
      }
    });
  }

  private updatePathColor(path: SVGPathElement, country: CountryQuiz): void {
    if (country.status === 'correct') {
      path.style.fill = '#22c55e';
      path.setAttribute('data-status', 'correct');
    } else if (country.status === 'incorrect') {
      path.style.fill = '#ef4444';
      path.setAttribute('data-status', 'incorrect');
    } else {
      path.style.fill = '#3b82f6';
      path.setAttribute('data-status', 'unanswered');
    }
    path.style.filter = 'none';
    path.style.opacity = '1';
  }

  private levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    const al = a.length, bl = b.length;
    if (al === 0) return bl;
    if (bl === 0) return al;
    const dp = new Array(bl + 1);
    for (let j = 0; j <= bl; j++) dp[j] = j;
    for (let i = 1; i <= al; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= bl; j++) {
        const temp = dp[j];
        const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
        dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
        prev = temp;
      }
    }
    return dp[bl];
  }

  protected resetView(): void { this.zoomLevel.set(1); this.panX.set(0); this.panY.set(0); this.updateSVGTransform(); }
  protected activateMap(): void { this.mapActive.update(v => !v); }
  protected zoomIn(): void { this.zoomLevel.update(z => Math.min(5, +(z + 0.2).toFixed(2))); this.updateSVGTransform(); }
  protected zoomOut(): void { this.zoomLevel.update(z => Math.max(1, +(z - 0.2).toFixed(2))); this.updateSVGTransform(); }
  protected selectPlayers(count: 2 | 3 | 4): void { this.selectedPlayers.set(count); }
  protected selectDifficulty(d: 'easy' | 'medium' | 'hard'): void { this.selectedDifficulty.set(d); }
  protected selectTimerMinutes(m: number): void { this.selectedTimerMinutes.set(Math.max(1, Math.floor(m))); }

  protected confirmSettings(): void {
    const count = this.selectedPlayers();
    const diff = this.selectedDifficulty();
    const mins = this.selectedTimerMinutes();
    const arr = Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `Player ${i + 1}`, score: 0 }));
    this.players.set(arr);
    this.currentPlayerIdx.set(0);
    this.gameStarted.set(true);
    this.gameFinished.set(false);
    this.winnerIdx.set(null);
    this.difficultyMode.set(diff);
    if (diff === 'easy') this.nextAction.set('pick');
    else if (diff === 'medium') this.nextAction.set('pick');
    else this.nextAction.set('random');
    this.startTimer(mins * 60 * 1000);
    this.startTurnTimer();
  }

  private startTimer(ms: number): void {
    this.clearTimer();
    const endTs = Date.now() + ms;
    this.globalEndTs.set(endTs);
    this.timerRemainingMs.set(ms);
    this.timerId = setInterval(() => {
      const left = Math.max(0, this.globalEndTs() - Date.now());
      this.timerRemainingMs.set(left);
      if (left <= 0) {
        this.clearTimer();
        this.finishGame();
      }
    }, 1000);
  }

  private startTimerFromEnd(endTs: number): void {
    this.clearTimer();
    this.globalEndTs.set(endTs);
    const left = Math.max(0, endTs - Date.now());
    this.timerRemainingMs.set(left);
    this.timerId = setInterval(() => {
      const l = Math.max(0, this.globalEndTs() - Date.now());
      this.timerRemainingMs.set(l);
      if (l <= 0) {
        this.clearTimer();
        this.finishGame();
      }
    }, 1000);
    this.saveGameState();
  }

  private clearTimer(): void { if (this.timerId) { clearInterval(this.timerId); this.timerId = null; } }

  protected readonly turnRemainingMs = signal<number>(20000);
  private turnTimerId: any = null;
  private startTurnTimer(): void {
    this.clearTurnTimer();
    const endTs = Date.now() + 20000;
    localStorage.setItem('turnEndTs', String(endTs));
    this.turnRemainingMs.set(20000);
    this.turnTimerId = setInterval(() => {
      const left = Math.max(0, (Number(localStorage.getItem('turnEndTs')) || 0) - Date.now());
      this.turnRemainingMs.set(left);
      if (left <= 0) {
        this.clearTurnTimer();
        this.modalMessage.set("⏱️ Time's up! Next player");
        this.modalMessageType.set('neutral');
        this.showModal.set(true);
        this.nextQuestion();
      }
    }, 1000);
  }

  private startTurnTimerFromEnd(endTs: number): void {
    this.clearTurnTimer();
    localStorage.setItem('turnEndTs', String(endTs));
    const left = Math.max(0, endTs - Date.now());
    this.turnRemainingMs.set(left);
    this.turnTimerId = setInterval(() => {
      const l = Math.max(0, (Number(localStorage.getItem('turnEndTs')) || 0) - Date.now());
      this.turnRemainingMs.set(l);
      if (l <= 0) {
        this.clearTurnTimer();
        this.modalMessage.set("⏱️ Time's up! Next player");
        this.modalMessageType.set('neutral');
        this.showModal.set(true);
        this.nextQuestion();
      }
    }, 1000);
    this.saveGameState();
  }
  private clearTurnTimer(): void { if (this.turnTimerId) { clearInterval(this.turnTimerId); this.turnTimerId = null; } }

  protected startGame(count: 2 | 3 | 4): void {
    const arr = Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `Player ${i + 1}`, score: 0 }));
    this.players.set(arr);
    this.currentPlayerIdx.set(0);
    this.gameStarted.set(true);
    this.gameFinished.set(false);
    this.winnerIdx.set(null);
  }

  protected advanceTurn(): void {
    const n = this.players().length;
    if (n > 0) this.currentPlayerIdx.set((this.currentPlayerIdx() + 1) % n);
  }

  protected finishGame(): void {
    const arr = this.players();
    if (!arr.length) return;
    let max = -Infinity;
    let idx = 0;
    arr.forEach((p, i) => { if (p.score > max) { max = p.score; idx = i; } });
    this.winnerIdx.set(idx);
    this.gameFinished.set(true);
    this.modalMessage.set(`🏆 Winner: ${arr[idx].name} with ${arr[idx].score} points`);
    this.modalMessageType.set('neutral');
    this.showModal.set(true);
    this.clearTimer();
  }

  protected randomQuestion(): void {
    if (this.randomActive() && !this.isAnswered()) {
      this.diceLockedHint.set('Finish the current random country first');
      setTimeout(() => this.diceLockedHint.set(''), 2000);
      return;
    }
    if (this.gameStarted() && this.difficultyMode() === 'medium' && this.nextAction() === 'pick') {
      this.diceLockedHint.set('Medium mode: random turn next, not now');
      setTimeout(() => this.diceLockedHint.set(''), 2000);
      return;
    }
    const candidates = this.countries().filter(c => c.status === 'unanswered');
    if (!candidates.length) return;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const entry = Array.from(this.svgPathMap.entries()).find(([p, id]) => id === pick.id);
    const path = entry ? entry[0] : null;
    if (!path) return;
    this.clearPreviousHighlight();
    this.updatePathColor(path, pick);
    path.style.fill = '#f59e0b';
    path.setAttribute('data-highlight', 'true');
    path.style.filter = 'none';
    path.style.opacity = '1';
    this.selectedSvgPath.set(path);
    this.randomActive.set(true);
    this.activeRandomId.set(pick.id);
    this.mapActive.set(true);
    try {
      const bbox = path.getBBox();
      const zoom = 2.2;
      this.zoomLevel.set(zoom);
      const vbWidth = this.baseViewBox.width / zoom;
      const vbHeight = this.baseViewBox.height / zoom;
      const targetX = bbox.x + bbox.width / 2 - vbWidth / 2;
      const targetY = bbox.y + bbox.height / 2 - vbHeight / 2;
      this.panX.set(targetX - this.baseViewBox.x);
      this.panY.set(targetY - this.baseViewBox.y);
      this.updateSVGTransform();
    } catch {}
  }

  private showTooltip(path: SVGPathElement, text: string): void {
    if (!this.svgDoc) return;
    const bbox = path.getBBox();
    const x = bbox.x + bbox.width / 2;
    const y = bbox.y + bbox.height / 2;
    const doc = this.svgDoc.ownerDocument || document;
    let tooltipBg = this.svgDoc.getElementById('tooltip-bg') as SVGRectElement | null;
    if (!tooltipBg) {
      tooltipBg = doc.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGRectElement;
      tooltipBg.setAttribute('id', 'tooltip-bg');
      tooltipBg.setAttribute('rx', '4');
      tooltipBg.setAttribute('ry', '4');
      tooltipBg.setAttribute('fill', '#1f2937');
      tooltipBg.setAttribute('opacity', '0.95');
      tooltipBg.setAttribute('pointer-events', 'none');
      this.svgDoc.appendChild(tooltipBg);
    }
    let tooltip = this.svgDoc.getElementById('tooltip') as SVGTextElement | null;
    if (!tooltip) {
      tooltip = doc.createElementNS('http://www.w3.org/2000/svg', 'text') as SVGTextElement;
      tooltip.setAttribute('id', 'tooltip');
      tooltip.setAttribute('fill', 'white');
      tooltip.setAttribute('font-size', '14');
      tooltip.setAttribute('font-weight', 'bold');
      tooltip.setAttribute('pointer-events', 'none');
      tooltip.setAttribute('text-anchor', 'middle');
      tooltip.setAttribute('dominant-baseline', 'middle');
      this.svgDoc.appendChild(tooltip);
    }
    if (tooltip) {
      tooltip.textContent = text;
      tooltip.setAttribute('x', String(x));
      tooltip.setAttribute('y', String(y));
      tooltip.setAttribute('visibility', 'visible');
      const bbox_text = tooltip.getBBox();
      const padding = 8;
      if (tooltipBg) {
        tooltipBg.setAttribute('x', String(bbox_text.x - padding));
        tooltipBg.setAttribute('y', String(bbox_text.y - padding));
        tooltipBg.setAttribute('width', String(bbox_text.width + padding * 2));
        tooltipBg.setAttribute('height', String(bbox_text.height + padding * 2));
        tooltipBg.setAttribute('visibility', 'visible');
      }
    }
  }

  private hideTooltip(): void {
    if (!this.svgDoc) return;
    const tooltip = this.svgDoc.getElementById('tooltip') as SVGTextElement | null;
    const tooltipBg = this.svgDoc.getElementById('tooltip-bg') as SVGRectElement | null;
    if (tooltip) tooltip.setAttribute('visibility', 'hidden');
    if (tooltipBg) tooltipBg.setAttribute('visibility', 'hidden');
  }

  private setupZoomAndPan(): void {
    const container = this.svgContainer?.nativeElement;
    const embedElement = this.svgEmbed?.nativeElement as HTMLEmbedElement;
    if (!container || !this.svgDoc || !embedElement) return;
    const targetWheel = (e: WheelEvent) => {
      if (!this.mapActive()) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.98 : 1.02;
      const newZoom = Math.max(1, Math.min(5, this.zoomLevel() * delta));
      this.zoomLevel.set(newZoom);
      this.updateSVGTransform();
    };
    container.addEventListener('wheel', targetWheel, { passive: false });
    embedElement.addEventListener('wheel', targetWheel, { passive: false });
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    const onDown = (e: MouseEvent) => {
      if (!this.mapActive()) return;
      if ((e.target as any).tagName !== 'path') {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
      }
    };
    const onMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const vb = this.svgDoc!.viewBox.baseVal;
      const clientRect = (this.svgDoc as any).getBoundingClientRect();
      const unitsPerPixelX = vb.width / clientRect.width;
      const unitsPerPixelY = vb.height / clientRect.height;
      this.panX.update(x => x - dx * unitsPerPixelX);
      this.panY.update(y => y - dy * unitsPerPixelY);
      startX = e.clientX;
      startY = e.clientY;
      this.updateSVGTransform();
    };
    const onUp = () => { isDragging = false; };
    container.addEventListener('mousedown', onDown);
    container.addEventListener('mousemove', onMove);
    container.addEventListener('mouseup', onUp);
    container.addEventListener('mouseleave', onUp);
    embedElement.addEventListener('mousedown', onDown);
    embedElement.addEventListener('mousemove', onMove);
    embedElement.addEventListener('mouseup', onUp);
    embedElement.addEventListener('mouseleave', onUp);
    container.addEventListener('click', () => this.mapActive.set(true));
    embedElement.addEventListener('click', () => this.mapActive.set(true));
  }

  private updateSVGTransform(): void {
    if (!this.svgDoc) return;
    const vbWidth = this.baseViewBox.width / this.zoomLevel();
    const vbHeight = this.baseViewBox.height / this.zoomLevel();
    const vbX = this.baseViewBox.x + this.panX();
    const vbY = this.baseViewBox.y + this.panY();
    this.svgDoc.setAttribute('viewBox', `${vbX} ${vbY} ${vbWidth} ${vbHeight}`);
  }

  private onCountrySVGClick(path: SVGPathElement): void {
    const id = this.svgPathMap.get(path);
    const country = id ? this.countries().find(c => c.id === id) : null;
    if (country) {
      if (this.gameStarted() && this.difficultyMode() === 'hard' && !this.randomActive()) { this.showTooltip(path, 'Hard mode: use the dice to play'); return; }
      if (this.gameStarted() && this.difficultyMode() === 'medium' && this.nextAction() === 'random' && !this.randomActive()) { this.showTooltip(path, 'Medium mode: random turn — use the dice'); return; }
      if (this.randomActive() && this.activeRandomId() && id !== this.activeRandomId()) { this.showTooltip(path, 'Finish the current random country first'); return; }
      if (country.status !== 'unanswered') { this.showAlreadyAnsweredMessage(country); return; }
      this.openModal(country, path);
    }
  }

  private getCountryStatus(path: SVGPathElement): 'unanswered' | 'correct' | 'incorrect' { const id = this.svgPathMap.get(path); const country = id ? this.countries().find(c => c.id === id) : null; return country?.status || 'unanswered'; }

  protected openModal(country: CountryQuiz, path: SVGPathElement): void {
    this.currentCountry.set(country);
    this.userAnswer.set('');
    this.modalMessage.set('');
    this.isAnswered.set(false);
    this.showModal.set(true);
    path.style.opacity = '1';
    this.selectedSvgPath.set(path);
  }

  private showAlreadyAnsweredMessage(country: CountryQuiz): void {}

  protected closeModal(): void {
    this.showModal.set(false);
    const activeId = this.activeRandomId();
    const path = this.selectedSvgPath();
    if (activeId && path) {
      const country = this.countries().find(c => c.id === activeId);
      if (country?.status === 'unanswered') return;
    }
    this.clearPreviousHighlight();
  }

  protected submitAnswer(): void {
    const raw = this.userAnswer().trim();
    const country = this.currentCountry();
    if (!raw) { this.modalMessage.set('Please enter a country name'); this.modalMessageType.set('error'); return; }
    if (!country) { this.closeModal(); return; }
    if (country.status !== 'unanswered') { this.modalMessage.set('You already answered this country'); this.modalMessageType.set('error'); this.isAnswered.set(true); return; }
    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z\s-]/g, '').trim();
    const a = normalize(raw);
    const b = normalize(country.name);
    const distance = this.levenshtein(a, b);
    const threshold = Math.max(1, Math.floor(b.length * 0.2));
    const isExact = a === b;
    const isFuzzy = !isExact && distance <= threshold;
    const isCorrect = isExact || isFuzzy;
    if (isCorrect) {
      const points = isExact ? 3 : 2;
      if (this.gameStarted() && this.players().length) {
        const idx = this.currentPlayerIdx();
        const updated = this.players().map((p, i) => i === idx ? { ...p, score: p.score + points } : p);
        this.players.set(updated);
      } else {
        this.score.update(s => s + points);
      }
      this.modalMessage.set(isExact ? '✓ Correct! +3 points' : '✓ Accepted with minor typo! +2 points');
      this.modalMessageType.set('success');
      this.colorizeCountry(true);
    } else {
      this.modalMessage.set(`✗ Wrong! The answer is ${country.name}`);
      this.modalMessageType.set('error');
      this.colorizeCountry(false);
    }
    this.isAnswered.set(true);
    const newStatus: 'correct' | 'incorrect' = isCorrect ? 'correct' : 'incorrect';
    const updatedCountries = this.countries().map(c => c.id === country.id ? { ...c, status: newStatus } : c);
    this.countries.set(updatedCountries);
    const fresh = this.countries().find(c => c.id === country.id);
    if (fresh) this.currentCountry.set(fresh);
    const path = this.selectedSvgPath();
    if (path && fresh) { this.updatePathColor(path, fresh); path.removeAttribute('data-highlight'); path.style.filter = 'none'; }
    this.randomActive.set(false);
    this.activeRandomId.set(null);
    if (this.gameStarted() && this.difficultyMode() === 'medium') { this.nextAction.set(this.nextAction() === 'pick' ? 'random' : 'pick'); }
    if (this.gameStarted() && this.difficultyMode() === 'hard') { this.nextAction.set('random'); }
  }

  private colorizeCountry(isCorrect: boolean): void { const path = this.selectedSvgPath(); if (!path) return; const color = isCorrect ? '#22c55e' : '#ef4444'; path.style.fill = color; path.style.opacity = '1'; path.style.filter = 'none'; }

  protected skipQuestion(): void {
    const country = this.currentCountry();
    if (country) { const updatedCountries = this.countries().map(c => c === country ? { ...c, status: 'unanswered' as const } : c); this.countries.set(updatedCountries); }
    this.closeModal();
    this.randomActive.set(false);
    this.activeRandomId.set(null);
    if (this.gameStarted() && this.difficultyMode() === 'medium') { this.nextAction.set(this.nextAction() === 'pick' ? 'random' : 'pick'); }
    if (this.gameStarted() && this.difficultyMode() === 'hard') { this.nextAction.set('random'); }
  }

  protected nextQuestion(): void {
    this.closeModal();
    if (this.gameStarted()) {
      this.advanceTurn();
      if (this.difficultyMode() === 'medium') { this.nextAction.set(this.nextAction() === 'pick' ? 'random' : 'pick'); }
      else if (this.difficultyMode() === 'hard') { this.nextAction.set('random'); }
      else { this.nextAction.set('pick'); }
      this.startTurnTimer();
    }
  }

  protected randomCountry(): void {
    const prevPath = this.selectedSvgPath();
    if (prevPath) {
      const prevId = this.svgPathMap.get(prevPath);
      const prevCountry = prevId ? this.countries().find(c => c.id === prevId) : null;
      if (prevCountry && prevCountry.status === 'unanswered') return;
    }
    const unansweredCountries = this.countries().filter(c => c.status === 'unanswered');
    if (unansweredCountries.length === 0) { alert('All countries have been answered!'); return; }
    const picked = unansweredCountries[Math.floor(Math.random() * unansweredCountries.length)];
    let targetPath: SVGPathElement | undefined;
    this.svgPathMap.forEach((id, path) => { if (id === picked.id) targetPath = path; });
    if (targetPath) {
      this.clearPreviousHighlight();
      targetPath.style.filter = 'brightness(1.5)';
      targetPath.style.opacity = '1';
      this.selectedSvgPath.set(targetPath);
      try {
        const bbox = targetPath.getBBox();
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;
        this.zoomLevel.set(3);
        this.panX.set(window.innerWidth / 2 - centerX * 3);
        this.panY.set(window.innerHeight / 2 - centerY * 3);
        this.updateSVGTransform();
      } catch {}
    }
  }

  private clearPreviousHighlight(): void {
    const prevPath = this.selectedSvgPath();
    if (prevPath) {
      const id = this.svgPathMap.get(prevPath);
      const current = id ? this.countries().find(c => c.id === id) : null;
      if (current) { this.updatePathColor(prevPath, current); }
      prevPath.removeAttribute('data-highlight');
      prevPath.style.filter = 'none';
    }
  }

  private saveGameState(): void {
    try {
      const state = {
        players: this.players(),
        currentPlayerIdx: this.currentPlayerIdx(),
        gameStarted: this.gameStarted(),
        gameFinished: this.gameFinished(),
        winnerIdx: this.winnerIdx(),
        difficultyMode: this.difficultyMode(),
        nextAction: this.nextAction(),
        countries: this.countries(),
        globalEndTs: this.globalEndTs(),
        turnEndTs: Number(localStorage.getItem('turnEndTs')) || 0
      };
      localStorage.setItem('gameState', JSON.stringify(state));
    } catch {}
  }
}
