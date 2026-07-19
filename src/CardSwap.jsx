import React, {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import gsap from "gsap";

export const Card = forwardRef(function Card(
  { className = "", ...props },
  ref,
) {
  return <article ref={ref} {...props} className={`menu-card ${className}`.trim()} />;
});

const makeSlot = (index, distanceX, distanceY, total) => ({
  x: index * distanceX,
  y: -index * distanceY,
  z: -index * distanceX * 1.5,
  zIndex: total - index,
});

const placeNow = (element, slot, skew) => {
  gsap.set(element, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: "center center",
    zIndex: slot.zIndex,
    force3D: true,
  });
};

const CardSwap = forwardRef(function CardSwap(
  {
    width = 480,
    height = 540,
    cardDistance = 50,
    verticalDistance = 75,
    delay = 5500,
    pauseOnHover = true,
    skewAmount = 9,
    onActiveChange,
    children,
  },
  apiRef,
) {
  const childArray = useMemo(() => Children.toArray(children), [children]);
  const refs = useMemo(
    () => childArray.map(() => React.createRef()),
    [childArray.length],
  );
  const order = useRef(Array.from({ length: childArray.length }, (_, index) => index));
  const timelineRef = useRef(null);
  const intervalRef = useRef(null);
  const containerRef = useRef(null);

  const clearTimer = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const animateTo = (targetIndex) => {
    if (order.current.length < 2 || timelineRef.current?.isActive()) return false;

    const currentOrder = order.current;
    const front = currentOrder[0];
    if (targetIndex === front) return false;

    const remaining = currentOrder.filter((index) => index !== front && index !== targetIndex);
    const promoted = [targetIndex, ...remaining];
    const nextOrder = [...promoted, front];
    const frontElement = refs[front]?.current;
    if (!frontElement) return false;

    const config = {
      ease: "elastic.out(0.6,0.9)",
      durDrop: 1.1,
      durMove: 1.2,
      durReturn: 1.2,
      promoteOverlap: 0.88,
      returnDelay: 0.05,
    };

    const timeline = gsap.timeline();
    timelineRef.current = timeline;

    timeline.to(frontElement, {
      y: "+=520",
      duration: config.durDrop,
      ease: config.ease,
    });

    timeline.addLabel("promote", `-=${config.durDrop * config.promoteOverlap}`);
    timeline.call(() => onActiveChange?.(targetIndex), undefined, "promote");

    promoted.forEach((index, slotIndex) => {
      const element = refs[index]?.current;
      const slot = makeSlot(slotIndex, cardDistance, verticalDistance, refs.length);
      timeline.set(element, { zIndex: slot.zIndex }, "promote");
      timeline.to(
        element,
        {
          x: slot.x,
          y: slot.y,
          z: slot.z,
          duration: config.durMove,
          ease: config.ease,
        },
        `promote+=${slotIndex * 0.1}`,
      );
    });

    const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length);
    timeline.addLabel("return", `promote+=${config.durMove * config.returnDelay}`);
    timeline.call(
      () => gsap.set(frontElement, { zIndex: backSlot.zIndex }),
      undefined,
      "return",
    );
    timeline.to(
      frontElement,
      {
        x: backSlot.x,
        y: backSlot.y,
        z: backSlot.z,
        duration: config.durReturn,
        ease: config.ease,
      },
      "return",
    );
    timeline.call(() => {
      order.current = nextOrder;
    });
    return true;
  };

  const moveNext = () => {
    const target = order.current[1];
    return animateTo(target);
  };

  const movePrevious = () => {
    const target = order.current[order.current.length - 1];
    return animateTo(target);
  };

  const forceTo = (targetIndex) => {
    clearTimer();
    if (timelineRef.current?.isActive()) {
      timelineRef.current.progress(1);
      timelineRef.current.kill();
    }
    const moved = animateTo(targetIndex);
    intervalRef.current = window.setInterval(moveNext, delay);
    return moved;
  };

  useImperativeHandle(apiRef, () => ({
    next: moveNext,
    previous: movePrevious,
    goTo: forceTo,
    current: () => order.current[0],
  }));

  useEffect(() => {
    order.current = Array.from({ length: refs.length }, (_, index) => index);
    refs.forEach((ref, index) => {
      if (ref.current) {
        placeNow(
          ref.current,
          makeSlot(index, cardDistance, verticalDistance, refs.length),
          skewAmount,
        );
      }
    });
    onActiveChange?.(0);

    clearTimer();
    intervalRef.current = window.setInterval(moveNext, delay);

    const node = containerRef.current;
    const pause = () => {
      timelineRef.current?.pause();
      clearTimer();
    };
    const resume = () => {
      timelineRef.current?.play();
      clearTimer();
      intervalRef.current = window.setInterval(moveNext, delay);
    };

    if (pauseOnHover && node) {
      node.addEventListener("mouseenter", pause);
      node.addEventListener("mouseleave", resume);
    }

    return () => {
      clearTimer();
      timelineRef.current?.kill();
      if (node) {
        node.removeEventListener("mouseenter", pause);
        node.removeEventListener("mouseleave", resume);
      }
    };
  }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, refs]);

  const rendered = childArray.map((child, index) =>
    isValidElement(child)
      ? cloneElement(child, {
          key: child.key ?? index,
          ref: refs[index],
          style: { width, height, ...(child.props.style ?? {}) },
          onClick: (event) => {
            child.props.onClick?.(event);
            if (order.current[0] !== index) animateTo(index);
          },
        })
      : child,
  );

  return (
    <div
      ref={containerRef}
      className="card-swap-container"
      style={{ width, height }}
      data-card-distance={cardDistance}
      data-vertical-distance={verticalDistance}
      data-delay={delay}
      data-skew={skewAmount}
    >
      {rendered}
    </div>
  );
});

export default CardSwap;
