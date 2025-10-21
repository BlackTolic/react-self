import { beginComponent, endComponent, setRenderScheduler } from '../react/reactHooks';
// Minimal createRoot inspired by React 18 API shape
// Provides a Root with render/unmount methods and basic container validation.
// 中文说明：一个仿 React 18 的极简 createRoot 实现，提供 render/unmount，并做基本容器校验与 vNode 渲染。

/**
 * 中文：createRoot 的可选配置
 * - unstable_strictMode：是否启用严格模式（仅标记）
 * - identifierPrefix：标识符前缀（可用于生成唯一 id）
 * - onUncaughtError/onCaughtError/onRecoverableError：错误回调（保留 API 形状）
 * - hydrate：在 React 18 中已废弃，这里仅保持兼容
 */
export type CreateRootOptions = {
  unstable_strictMode?: boolean; // 是否启用严格模式（仅标记）
  identifierPrefix?: string; // 标识符前缀（可用于生成唯一 id）
  onUncaughtError?: (error: unknown) => void;
  onCaughtError?: (error: unknown) => void;
  onRecoverableError?: (error: unknown) => void;
  // hydrate is deprecated in React 18's createRoot; included for shape compatibility
  hydrate?: boolean;
};

export type Container = Element | Document | DocumentFragment;

/**
 * 中文：校验传入的容器是否是合法的 DOM 容器
 * 支持元素节点、文档节点、文档片段
 */
function isValidContainer(container: any): container is Container {
  return (
    container &&
    (container.nodeType === Node.ELEMENT_NODE ||
      container.nodeType === Node.DOCUMENT_NODE ||
      container.nodeType === Node.DOCUMENT_FRAGMENT_NODE)
  );
}

/**
 * 中文：ReactDOMRoot 表示一个渲染根，管理容器和生命周期（render/unmount）
 */
class ReactDOMRoot {
  private container: Container; // 渲染容器（元素、文档或文档片段）
  private disposed = false; // 是否已卸载（标记）
  private identifierPrefix: string; // 标识符前缀（可用于生成唯一 id）
  private isStrictMode: boolean; // 是否启用严格模式（仅标记）
  private lastChildren: any; // 最近一次渲染的根 children

  // 中文：记录容器与配置；strictMode 在本实现中仅作标记用途
  constructor(container: Container, opts?: CreateRootOptions) {
    this.container = container;
    this.identifierPrefix = opts?.identifierPrefix ?? '';
    this.isStrictMode = !!opts?.unstable_strictMode;
    // 注册全局调度器：在 setState 被调用时触发本根的重新渲染
    setRenderScheduler(() => {
      if (!this.disposed) {
        this.render(this.lastChildren);
      }
    });
  }

  /**
   * 中文：渲染入口。清空目标，再以宽松方式挂载 children（支持多种类型）
   * JSX 元素会被转换为 vNode 再渲染
   */
  render(children: VNode|string|number|null) {
    if (this.disposed) return;
    this.lastChildren = children;

    // 中文：Document 使用 body 或 documentElement 作为挂载目标，否则直接用传入容器
    const target: Element | DocumentFragment =
      this.container.nodeType === Node.DOCUMENT_NODE
        ? (this.container as Document).body || (this.container as Document).documentElement
        : (this.container as Element | DocumentFragment);
        // console.log(target,'target1111')
    // 中文：渲染前先清空容器内容
    while (target.firstChild) target.removeChild(target.firstChild);
    // 中文：入口挂载调用，递归处理不同类型的 children
    // 这里只保留最外层的<div id="app"></div>
    appendChildFlexible(target, children);
  }

  /**
   * 中文：卸载根。清空容器并标记 disposed，后续 render 将被忽略
   */
  unmount() {
    const target: Element | DocumentFragment =
      this.container.nodeType === Node.DOCUMENT_NODE
        ? (this.container as Document).body || (this.container as Document).documentElement
        : (this.container as Element | DocumentFragment);

    while (target.firstChild) target.removeChild(target.firstChild);
    this.disposed = true;
  }
}

/**
 * 中文：按类型将 child 附加到 DOM
 * - Node：直接 appendChild
 * - string/number：转为文本节点
 * - Array：遍历递归处理
 * - vNode 对象：调用 createDomFromVnode
 * - 其他类型：作为文本处理
 */
function appendChildFlexible(parent: Element | DocumentFragment, child: VNode|string|number|null|Node) {
  // console.log(parent ,'开始执行appendChildFlexible 获取parent')
  // console.log(child ,'开始执行appendChildFlexible 获取child')
  if (child == null) return;
  // 中文：直接 appendChild 节点
  if (child instanceof Node) {
    parent.appendChild(child);
    return;
  }
  if (typeof child === 'string' || typeof child === 'number') {
    parent.appendChild(document.createTextNode(String(child)));
    return;
  }
  if (Array.isArray(child)) {
    for (const c of child) appendChildFlexible(parent, c);
    return;
  }
  // 中文：递归处理 vNode 对象（递归调用 appendChildFlexible）
  if (typeof child === 'object' && child && 'type' in child) {
    // 这里将vnode转换成node
    const node = createDomFromVnode(child as VNode);
    if (node) parent.appendChild(node);
    return;
  }
  parent.appendChild(document.createTextNode(String(child)));
}

/**
 * 中文：极简 vNode 结构；type 可为标签名/函数/Fragment 符号
 * props 为属性字典，children 为子节点（单个或数组）
 */
export type VNode = {
  type: string;
  props?: Record<string, any>;
  children?: any;
};

/**
 * 中文：将 vNode 转为真实 Node
 * 支持：
 * - Fragment（Symbol.for('react.self.fragment')）
 * - 函数组件（返回 Node/vNode/原始值）
 * - 原生元素（事件 onXxx，style 对象，普通属性）
 */
function createDomFromVnode(vnode: VNode): Node | null {
    try {
        const FRAGMENT = Symbol.for('react.self.fragment');
        const type: any = vnode.type;
        const props = vnode.props || {};
        const children = vnode.children;

        // 中文：Fragment → DocumentFragment；遍历附加所有子节点
        if (typeof type === 'symbol' && type === FRAGMENT) {
            const frag = document.createDocumentFragment();
            if (Array.isArray(children)) {
                for (const child of children) appendChildFlexible(frag, child);
            } else {
                appendChildFlexible(frag, children);
            }
            return frag;
        }

        // 中文：函数组件：执行得到返回值并转换为 Node
        if (typeof type === 'function') {
            beginComponent(vnode as any);
            let rendered: any;
            try {
                rendered = type({ ...props, children });
            } finally {
                endComponent();
            }
            if (rendered instanceof Node) return rendered;
            if (typeof rendered === 'object' && rendered && 'type' in rendered) {
                return createDomFromVnode(rendered as any);
            }
            return document.createTextNode(String(rendered));
        }

        // 中文：原生元素：创建标签并设置 props（style、事件、属性）
        const el = document.createElement(type);
        for (const [key, value] of Object.entries(props)) {
            if (key === 'style' && value && typeof value === 'object') {
                Object.assign((el as HTMLElement).style, value as any);
            } else if (key.startsWith('on') && typeof value === 'function') {
                const event = key.slice(2).toLowerCase();
                el.addEventListener(event, value as any);
            } else if (value != null) { 
                el.setAttribute(key, String(value));
            }
        }

        if (children == null) {
            // no-op
        } else if (Array.isArray(children)) {
            for (const child of children) appendChildFlexible(el, child);
        } else {
            appendChildFlexible(el, children);
        }
        return el;
    } catch {
        // 中文：异常兜底，返回 null 以避免渲染中断
        return null;
    }
}

/**
 * 中文：创建根。校验容器合法性；对已废弃的 hydrate 参数给出提示；返回根实例
 */
export const createRoot = (
  container: Container,
  options?: CreateRootOptions,
) => {
  // console.log(container,'container',options,'options')
  if (!isValidContainer(container)) {
    throw new Error('Target container is not a DOM element.');
  }

  if (options?.hydrate) {
    console.warn(
      'hydrate through createRoot is deprecated. Use hydrateRoot(container, <App />) instead.',
    );
  }

  return new ReactDOMRoot(container, options);
};