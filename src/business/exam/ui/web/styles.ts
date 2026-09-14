import './exam-page.css';

/**
 * 答卷页样式：plain CSS + 同名 class（避免 CSS Modules 进 tsup 丢 scoped hash）。
 * 用法保持 `styles['start-container']` / `styles.visible`。
 */
type Styles = Record<string, string>;

export const styles: Styles = new Proxy({} as Styles, {
  get: (_target, prop: string | symbol) =>
    typeof prop === 'string' ? prop : String(prop),
});

export default styles;
