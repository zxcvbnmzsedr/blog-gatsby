import {Markmap} from '.';

export type IMarkmap = typeof Markmap;

export interface IMarkmapOptions {
    id?: string;
    duration?: number;
    nodeFont?: string;
    nodeMinHeight?: number;
    spacingVertical?: number;
    spacingHorizontal?: number;
    autoFit?: boolean;
    fitRatio?: number;
    color?: (node: INode) => string;
    paddingX?: number;
    nodeClick?: (e,d) => void;
    style?: (id: string) => string;
    isScale: boolean;
    extension: boolean;
}

export interface IMarkmapState {
    id: string;
    data?: INode;
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
}

export interface IMarkmapFlexTreeItem {
    parent: IMarkmapFlexTreeItem;
    data: INode;
    depth: number;
    xSize: number;
    ySize: number;
    ySizeInner: number;
    x: number;
    y: number;
}

export interface IMarkmapLinkItem {
    source: IMarkmapFlexTreeItem;
    target: IMarkmapFlexTreeItem;
}


export interface IAssets {
    styles?: CSSItem[];
    scripts?: JSItem[];
}

export interface IMarkmapCreateOptions {
    /**
     * Markdown content as string.
     */
    content?: string;
    /**
     * Output file path of the markmap HTML file.
     * If not provided, the same basename as the Markdown input file will be used.
     */
    output?: string;
}

export interface IAssetsMap {
    [key: string]: IAssets,
}

export interface IFeatures {
    [key: string]: boolean;
}

export interface ITransformResult {
    root: INode;
    features: IFeatures;
}

export interface IHierarchy<T> {
    /**
     * type
     */
    t: string;
    /**
     * payload
     */
    p?: any;
    /**
     * children
     */
    c?: T[];
}

export interface INode extends IHierarchy<INode> {
    /**
     * depth
     */
    d?: number;
    /**
     * value
     */
    v: string;
    originId?:string
}

export type JSScriptItem = {
    type: 'script';
    data: {
        src: string;
        async?: boolean;
        defer?: boolean;
    };
};
export type JSIIFEItem = {
    type: 'iife';
    data: {
        fn: (...args: any[]) => void;
        getParams?: (context: any) => void | any[];
    };
};
export type JSItem = JSScriptItem | JSIIFEItem;
export type CSSItem = {
    type: 'style' | 'stylesheet';
    data: any;
};

export interface IWrapContext<T extends (...args: any[]) => any> {
    args: Parameters<T>,
    result?: ReturnType<T>,
}

export interface IDeferred<T> {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error?: any) => void;
}
