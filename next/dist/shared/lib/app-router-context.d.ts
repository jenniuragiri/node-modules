import React from 'react';
import type { FocusAndScrollRef } from '../../client/components/reducer';
import type { FlightRouterState, FlightData } from '../../server/app-render';
export declare type ChildSegmentMap = Map<string, CacheNode>;
/**
 * Cache node used in app-router / layout-router.
 */
export declare type CacheNode = {
    /**
     * In-flight request for this node.
     */
    data: ReturnType<typeof import('../../client/components/app-router').fetchServerResponse> | null;
    /**
     * React Component for this node.
     */
    subTreeData: React.ReactNode | null;
    /**
     * Child parallel routes.
     */
    parallelRoutes: Map<string, ChildSegmentMap>;
};
interface NavigateOptions {
    forceOptimisticNavigation?: boolean;
}
export interface AppRouterInstance {
    /**
     * Navigate to the previous history entry.
     */
    back(): void;
    /**
     * Navigate to the next history entry.
     */
    forward(): void;
    /**
     * Refresh the current page.
     */
    refresh(): void;
    /**
     * Navigate to the provided href.
     * Pushes a new history entry.
     */
    push(href: string, options?: NavigateOptions): void;
    /**
     * Navigate to the provided href.
     * Replaces the current history entry.
     */
    replace(href: string, options?: NavigateOptions): void;
    /**
     * Prefetch the provided href.
     */
    prefetch(href: string): void;
}
export declare const AppRouterContext: React.Context<AppRouterInstance | null>;
export declare const LayoutRouterContext: React.Context<{
    childNodes: CacheNode['parallelRoutes'];
    tree: FlightRouterState;
    url: string;
}>;
export declare const GlobalLayoutRouterContext: React.Context<{
    tree: FlightRouterState;
    changeByServerResponse: (previousTree: FlightRouterState, flightData: FlightData, overrideCanonicalUrl: URL | undefined) => void;
    focusAndScrollRef: FocusAndScrollRef;
}>;
export declare const TemplateContext: React.Context<React.ReactNode>;
export {};
