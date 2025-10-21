export const Fragment = Symbol.for('react.self.fragment');

// 将JSX转成VNode结构
export function jsx(type, props, key) {
  const p = props || {};
  const { children, ...rest } = p;
  if (key != null) rest.key = key;
  return { type, props: rest, children };
}

export const jsxs = jsx;

export function createElement(type, props, ...children) {
  const p = props || {};
  const restChildren = children.length === 1 ? children[0] : children;
  return { type, props: p, children: restChildren };
}