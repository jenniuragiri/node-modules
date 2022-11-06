import _extends from '@babel/runtime/helpers/esm/extends';
import _objectWithoutPropertiesLoose from '@babel/runtime/helpers/esm/objectWithoutPropertiesLoose';
import { useRef, useReducer, useEffect, createElement, useLayoutEffect } from 'react';

var isBrowser = typeof document !== "undefined";

// React currently throws a warning when using useLayoutEffect on the server.
var useIsomorphicLayoutEffect =  isBrowser ? useLayoutEffect : useEffect;

function reducer() {
  return true;
}

function LazyHydrate(props) {
  var childRef = useRef(null); // Always render on server

  var _React$useReducer = useReducer(reducer, !( isBrowser)),
      hydrated = _React$useReducer[0],
      hydrate = _React$useReducer[1];

  var noWrapper = props.noWrapper,
      ssrOnly = props.ssrOnly,
      whenIdle = props.whenIdle,
      whenVisible = props.whenVisible,
      promise = props.promise,
      _props$on = props.on,
      on = _props$on === void 0 ? [] : _props$on,
      children = props.children,
      didHydrate = props.didHydrate,
      rest = _objectWithoutPropertiesLoose(props, ["noWrapper", "ssrOnly", "whenIdle", "whenVisible", "promise", "on", "children", "didHydrate"]);

  if ('production' !== process.env.NODE_ENV && !ssrOnly && !whenIdle && !whenVisible && !on.length && !promise) {
    console.error("LazyHydration: Enable atleast one trigger for hydration.\n" + "If you don't want to hydrate, use ssrOnly");
  }

  useIsomorphicLayoutEffect(function () {
    // No SSR Content
    if (!childRef.current.hasChildNodes()) {
      hydrate();
    }
  }, []);
  useEffect(function () {
    if (hydrated && didHydrate) {
      didHydrate();
    } // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [hydrated]);
  useEffect(function () {
    if (ssrOnly || hydrated) return;
    var rootElement = childRef.current;
    var cleanupFns = [];

    function cleanup() {
      cleanupFns.forEach(function (fn) {
        fn();
      });
    }

    if (promise) {
      promise.then(hydrate, hydrate);
    }

    if (whenVisible) {
      var element = noWrapper ? rootElement : // As root node does not have any box model, it cannot intersect.
      rootElement.firstElementChild;

      if (element && typeof IntersectionObserver !== "undefined") {
        var observerOptions = typeof whenVisible === "object" ? whenVisible : {
          rootMargin: "250px"
        };
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting || entry.intersectionRatio > 0) {
              hydrate();
            }
          });
        }, observerOptions);
        io.observe(element);
        cleanupFns.push(function () {
          io.disconnect();
        });
      } else {
        return hydrate();
      }
    }

    if (whenIdle) {
      // @ts-ignore
      if (typeof requestIdleCallback !== "undefined") {
        // @ts-ignore
        var idleCallbackId = requestIdleCallback(hydrate, {
          timeout: 500
        });
        cleanupFns.push(function () {
          // @ts-ignore
          cancelIdleCallback(idleCallbackId);
        });
      } else {
        var id = setTimeout(hydrate, 2000);
        cleanupFns.push(function () {
          clearTimeout(id);
        });
      }
    }

    var events = [].concat(on);
    events.forEach(function (event) {
      rootElement.addEventListener(event, hydrate, {
        once: true,
        passive: true
      });
      cleanupFns.push(function () {
        rootElement.removeEventListener(event, hydrate, {});
      });
    });
    return cleanup;
  }, [hydrated, on, ssrOnly, whenIdle, whenVisible, didHydrate, promise, noWrapper]);
  var WrapperElement = typeof noWrapper === "string" ? noWrapper : "div";

  if (hydrated) {
    if (noWrapper) {
      return children;
    }

    return /*#__PURE__*/createElement(WrapperElement, _extends({
      ref: childRef,
      style: {
        display: "contents"
      }
    }, rest), children);
  } else {
    return /*#__PURE__*/createElement(WrapperElement, _extends({}, rest, {
      ref: childRef,
      suppressHydrationWarning: true,
      dangerouslySetInnerHTML: {
        __html: ""
      }
    }));
  }
}

export default LazyHydrate;
