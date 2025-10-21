// ... existing code ...
/**
 * 极简 Hooks 实现：useState
 * 依赖渲染器在调用函数组件前后调用 beginComponent/endComponent，
 * 并在根注册 setRenderScheduler 用于触发重新渲染。
 */

export type StateUpdater<S> = (action: S | ((prev: S) => S)) => void;
type ComponentKey = object;

const states = new WeakMap<ComponentKey, any[]>();
const cursors = new WeakMap<ComponentKey, number>();

let currentComponent: ComponentKey | null = null; // 当前渲染的组件键
let scheduleRender: (() => void) | null = null; // 重渲染调度器
let renderScheduled = false; // 是否已调度重渲染

const scheduleMicrotask = (fn: () => void) => {
  if (typeof queueMicrotask === 'function') queueMicrotask(fn);
  else Promise.resolve().then(fn);
};

/**
 * 渲染器注册重渲染调度器
 * 当 setState 被调用时使用该调度器触发一次重渲染
 */
export function setRenderScheduler(scheduler: () => void) {
  scheduleRender = scheduler;
}

/**
 * 在调用函数组件前设置当前组件上下文，并重置 hook 游标
 * componentKey 需保证“实例唯一”，可用 vNode 对象或 {type, key} 作为键
 */
export function beginComponent(componentKey: ComponentKey) {
  currentComponent = componentKey;
  cursors.set(componentKey, 0);
  if (!states.has(componentKey)) states.set(componentKey, []);
}

/** 结束函数组件渲染，清理当前上下文 */
export function endComponent() {
  currentComponent = null;
}

/**
 * useState：返回 [state, setState]
 * - 首次渲染根据 initial 初始化状态槽
 * - setState 支持值或函数（接收 prev 返回 next）
 * - 使用 microtask 合并短时间内的多次 setState，避免过度重渲染
 */
export function useState<S>(initial: S | (() => S)): [S, StateUpdater<S>] {
  console.log('useState', initial, currentComponent);
  if (!currentComponent) {
    throw new Error('useState must be called within a function component render.');
  }
  const key = currentComponent;
  const cursor = cursors.get(key) ?? 0;
  const arr = states.get(key)!;

  if (arr.length <= cursor) {
    arr.push(typeof initial === 'function' ? (initial as () => S)() : initial);
  }
  const setState: StateUpdater<S> = (action) => {
    const prev = arr[cursor] as S;
    const next = typeof action === 'function' ? (action as (p: S) => S)(prev) : action;
    if (Object.is(prev, next)) return;

    arr[cursor] = next;

    if (scheduleRender) {
      if (!renderScheduled) {
        renderScheduled = true;
        scheduleMicrotask(() => {
          renderScheduled = false;
          try {
            scheduleRender!();
          } catch (e) {
            console.error('Scheduled render failed:', e);
          }
        });
      }
    } else {
      console.warn('No render scheduler registered. Call setRenderScheduler in your renderer.');
    }
  };

  cursors.set(key, cursor + 1);
  return [arr[cursor] as S, setState];
}