import { TestBed } from '@angular/core/testing';
import { App } from './app';

// 建立測試群組
describe('App', () => {

  // 每個測試案例執行前，都會執行這裡的準備工作。
  beforeEach(async () => {
    await TestBed.configureTestingModule({ // 設定這次測試需要的 Angular 元件或依賴。
      imports: [App],
    })
      .compileComponents(); // 準備並編譯元件及其相關範本。
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    
    await fixture.whenStable(); 
    // await / async : 讓程式等待非同步工作完成後再繼續執行。
    // whenStable(): 等待 Angular 目前的非同步工作穩定下來

    const compiled = fixture.nativeElement as HTMLElement; 
    // fixture.nativeElement: 取得元件實際產生的 HTML DOM 元素
    // as HTMLElement: 告訴 TypeScript，把這個元素視為 HTML 元素來處理
    
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, frontend');
    // compiled.querySelector('h1'): 在 HTML DOM 中尋找第一個 <h1> 標籤
    // ?.textContent: 取得該 <h1> 標籤的文字內容，如果找不到 <h1>，則不會報錯。
    // toContain('Hello, frontend'): 驗證文字內容是否包含 "Hello, frontend" 
  });
});
