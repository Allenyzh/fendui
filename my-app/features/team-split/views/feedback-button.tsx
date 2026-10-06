import type { TeamSplitController } from "../controller";

const buttonStyles = [
  "group/fx relative transition-[background,border-color,color,transform] ease-[ease] duration-[200ms,200ms,200ms,120ms]",
  "enabled:active:transform-[translateY(1px)_scale(.98)]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  "data-[state=done]:bg-accent data-[state=done]:border-accent data-[state=done]:text-accent-ink data-[state=done]:animate-fx-pop",
  "data-[state=done]:hover:bg-accent data-[state=done]:hover:border-accent data-[state=done]:hover:text-accent-ink",
  "data-[state=fail]:border-note data-[state=fail]:text-note data-[state=fail]:animate-fx-shake",
  "data-[state=fail]:hover:border-note data-[state=fail]:hover:text-note",
  "after:absolute after:-inset-px after:rounded-[inherit] after:border-2 after:border-solid after:border-accent after:opacity-0 after:pointer-events-none after:content-[''] data-[state=done]:after:animate-fx-ring",
  "motion-reduce:transition-none motion-reduce:animate-none motion-reduce:after:animate-none",
].join(" ");

const labelStyles = "[grid-area:1/1] inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-[opacity,transform] duration-180 ease-[ease] motion-reduce:transition-none";

type FeedbackButtonProps = {
  id: string;
  className: string;
  idle: string;
  done: string;
  fail: string;
  feedback: TeamSplitController["pasteFeedback"];
  disabled?: boolean;
  onClick: () => void | Promise<void>;
};

export function FeedbackButton({
  id,
  className,
  idle,
  done,
  fail,
  feedback,
  disabled,
  onClick,
}: FeedbackButtonProps) {
  const { buttonRef } = feedback;

  return (
    <button
      type="button"
      className={`${className} ${buttonStyles}`}
      id={id}
      ref={buttonRef}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="grid">
        <span className={`${labelStyles} group-data-[state=done]/fx:opacity-0 group-data-[state=done]/fx:transform-[translateY(-5px)] group-data-[state=fail]/fx:opacity-0 group-data-[state=fail]/fx:transform-[translateY(-5px)]`}>
          {idle}
        </span>
        <span
          className={`${labelStyles} opacity-0 transform-[translateY(5px)] group-data-[state=done]/fx:opacity-100 group-data-[state=done]/fx:transform-none`}
          aria-hidden="true"
        >
          <svg
            className="flex-none [stroke-dasharray:18] [stroke-dashoffset:18] group-data-[state=done]/fx:animate-tick-draw motion-reduce:animate-none motion-reduce:group-data-[state=done]/fx:[stroke-dashoffset:0]"
            viewBox="0 0 16 16"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 8.6 L6.4 12 L13 5" />
          </svg>
          {done}
        </span>
        <span
          className={`${labelStyles} opacity-0 transform-[translateY(5px)] group-data-[state=fail]/fx:opacity-100 group-data-[state=fail]/fx:transform-none`}
          aria-hidden="true"
        >
          {fail}
        </span>
      </span>
    </button>
  );
}
