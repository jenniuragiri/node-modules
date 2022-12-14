/// <reference types="react" />
import { ImageLoaderProps } from '../shared/lib/image-config';
declare const VALID_LOADING_VALUES: readonly ["lazy", "eager", undefined];
declare type LoadingValue = typeof VALID_LOADING_VALUES[number];
export { ImageLoaderProps };
export declare type ImageLoader = (p: ImageLoaderProps) => string;
declare type PlaceholderValue = 'blur' | 'empty';
declare type OnLoadingComplete = (img: HTMLImageElement) => void;
export interface StaticImageData {
    src: string;
    height: number;
    width: number;
    blurDataURL?: string;
    blurWidth?: number;
    blurHeight?: number;
}
interface StaticRequire {
    default: StaticImageData;
}
declare type StaticImport = StaticRequire | StaticImageData;
declare type SafeNumber = number | `${number}`;
export declare type ImageProps = Omit<JSX.IntrinsicElements['img'], 'src' | 'srcSet' | 'ref' | 'alt' | 'width' | 'height' | 'loading'> & {
    src: string | StaticImport;
    alt: string;
    width?: SafeNumber;
    height?: SafeNumber;
    fill?: boolean;
    loader?: ImageLoader;
    quality?: SafeNumber;
    priority?: boolean;
    loading?: LoadingValue;
    placeholder?: PlaceholderValue;
    blurDataURL?: string;
    unoptimized?: boolean;
    onLoadingComplete?: OnLoadingComplete;
    /**
     * @deprecated Use `fill` prop instead of `layout="fill"` or change import to `next/legacy/image`.
     * @see https://nextjs.org/docs/api-reference/next/legacy/image
     */
    layout?: string;
    /**
     * @deprecated Use `style` prop instead.
     */
    objectFit?: string;
    /**
     * @deprecated Use `style` prop instead.
     */
    objectPosition?: string;
    /**
     * @deprecated This prop does not do anything.
     */
    lazyBoundary?: string;
    /**
     * @deprecated This prop does not do anything.
     */
    lazyRoot?: string;
};
export default function Image({ src, sizes, unoptimized, priority, loading, className, quality, width, height, fill, style, onLoad, onLoadingComplete, placeholder, blurDataURL, layout, objectFit, objectPosition, lazyBoundary, lazyRoot, ...all }: ImageProps): JSX.Element;
