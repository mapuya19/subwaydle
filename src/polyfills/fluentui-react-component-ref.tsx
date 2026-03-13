/**
 * Drop-in replacement for @fluentui/react-component-ref that is compatible
 * with React 19 (which removed ReactDOM.findDOMNode).
 *
 * semantic-ui-react 2.x depends on @fluentui/react-component-ref for its
 * internal <Ref> component.  The original uses findDOMNode to locate the
 * DOM node of class-component children; this version instead attaches a
 * callback ref via cloneElement, which works for host (DOM) elements and
 * forwardRef components — covering all of semantic-ui-react's usage.
 *
 * Remove this file once semantic-ui-react is replaced with a maintained
 * component library.
 */
import * as React from 'react';

/* ------------------------------------------------------------------ */
/*  handleRef / isRefObject  — unchanged from the original            */
/* ------------------------------------------------------------------ */

export function handleRef(
  ref: React.Ref<any> | ((node: any) => void) | null | undefined,
  node: any,
): void {
  if (typeof ref === 'function') {
    ref(node);
    return;
  }
  if (ref !== null && typeof ref === 'object') {
    (ref as React.MutableRefObject<any>).current = node;
  }
}

export function isRefObject(ref: unknown): ref is React.RefObject<any> {
  return (
    ref !== null &&
    typeof ref === 'object' &&
    Object.prototype.hasOwnProperty.call(ref, 'current')
  );
}

/* ------------------------------------------------------------------ */
/*  Ref / RefFindNode / RefForward                                     */
/* ------------------------------------------------------------------ */

interface RefProps {
  innerRef?: React.Ref<any> | ((node: any) => void);
  children: React.ReactElement<any>;
  [key: string]: any;
}

/**
 * RefForward — for children that already accept a ref (forwardRef components).
 * Clones the child with a combined callback ref.
 */
export class RefForward extends React.Component<RefProps> {
  private currentNode: any;

  private handleRefOverride = (node: any) => {
    const { children, innerRef } = this.props;
    handleRef((children as any).ref, node);
    handleRef(innerRef, node);
    this.currentNode = node;
  };

  componentDidUpdate(prevProps: RefProps) {
    if (prevProps.innerRef !== this.props.innerRef) {
      handleRef(this.props.innerRef, this.currentNode);
    }
  }

  componentWillUnmount() {
    delete this.currentNode;
  }

  render() {
    const { children } = this.props;
    return React.cloneElement(children, { ref: this.handleRefOverride });
  }
}

/**
 * RefFindNode — React 19-compatible replacement.
 *
 * The original used ReactDOM.findDOMNode(this) to walk the fiber tree and
 * locate the first host DOM node rendered by the child.  Since findDOMNode
 * was removed in React 19, we instead clone the child element with a
 * callback ref.  This works for:
 *   - Host elements (<div>, <span>, etc.) — ref points directly at the DOM node.
 *   - forwardRef components — ref is forwarded to the underlying DOM node.
 *
 * semantic-ui-react always wraps host elements (ElementType resolves to
 * 'div', 'button', etc.) inside <Ref>, so this covers all real usage.
 */
export class RefFindNode extends React.Component<RefProps> {
  private prevNode: any = null;

  private handleRef = (node: any) => {
    if (this.prevNode !== node) {
      this.prevNode = node;
      handleRef(this.props.innerRef, node);
    }
  };

  componentDidUpdate(prevProps: RefProps) {
    if (prevProps.innerRef !== this.props.innerRef) {
      handleRef(this.props.innerRef, this.prevNode);
    }
  }

  componentWillUnmount() {
    handleRef(this.props.innerRef, null);
    this.prevNode = null;
  }

  render() {
    const { children } = this.props;
    const existingRef = (children as any).ref;

    return React.cloneElement(children, {
      ref: (node: any) => {
        handleRef(existingRef, node);
        this.handleRef(node);
      },
    });
  }
}

/**
 * Ref — the top-level component that semantic-ui-react actually imports.
 * Picks RefForward for forwardRef children, RefFindNode otherwise.
 *
 * In the original implementation this distinction mattered because
 * RefForward used cloneElement + ref while RefFindNode used findDOMNode.
 * Now both paths use cloneElement + ref, but we keep the split for API
 * compatibility.
 */
export const Ref: React.FC<RefProps> = (props) => {
  const { children, innerRef, ...rest } = props;
  const child = React.Children.only(children);

  const isForward =
    child &&
    typeof child === 'object' &&
    (child as any).$$typeof === Symbol.for('react.forward_ref');
  const ElementType = isForward ? RefForward : RefFindNode;

  const childWithProps =
    child && rest && Object.keys(rest).length > 0
      ? React.cloneElement(child, rest)
      : child;

  return React.createElement(ElementType, { innerRef } as any, childWithProps);
};
