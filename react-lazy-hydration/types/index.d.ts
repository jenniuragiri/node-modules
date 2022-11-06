import * as React from "react";
export declare type LazyProps = {
    ssrOnly?: boolean;
    whenIdle?: boolean;
    whenVisible?: boolean | IntersectionObserverInit;
    noWrapper?: boolean | keyof JSX.IntrinsicElements;
    didHydrate?: VoidFunction;
    promise?: Promise<any>;
    on?: (keyof HTMLElementEventMap)[] | keyof HTMLElementEventMap;
    children: React.ReactElement;
};
declare type Props = Omit<React.HTMLProps<HTMLElement>, "dangerouslySetInnerHTML"> & LazyProps;
declare type VoidFunction = () => void;
declare function LazyHydrate(props: Props): JSX.Element;
export default LazyHydrate;
