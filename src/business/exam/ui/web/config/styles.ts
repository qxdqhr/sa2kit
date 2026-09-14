import './exam-config.css';

type Styles = Record<string, string>;

export const styles: Styles = new Proxy({} as Styles, {
  get: (_target, prop: string | symbol) =>
    typeof prop === 'string' ? prop : String(prop),
});

export default styles;
