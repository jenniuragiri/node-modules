"use client";
import React from 'react';
'use client';
export const AppRouterContext = React.createContext(null);
export const LayoutRouterContext = React.createContext(null);
export const GlobalLayoutRouterContext = React.createContext(null);
export const TemplateContext = React.createContext(null);
if (process.env.NODE_ENV !== 'production') {
    AppRouterContext.displayName = 'AppRouterContext';
    LayoutRouterContext.displayName = 'LayoutRouterContext';
    GlobalLayoutRouterContext.displayName = 'GlobalLayoutRouterContext';
    TemplateContext.displayName = 'TemplateContext';
}

//# sourceMappingURL=app-router-context.js.map