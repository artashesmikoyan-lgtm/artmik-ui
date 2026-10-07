import { useId, type HTMLAttributes, type ReactNode } from "react";

export interface EditorialCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  index?: ReactNode;
  eyebrow?: ReactNode;
  title?: ReactNode;
  children?: ReactNode;
}

export function EditorialCard({
  index,
  eyebrow,
  title,
  children,
  className,
  ...articleProps
}: EditorialCardProps) {
  const titleId = useId();

  return (
    <article
      {...articleProps}
      className={["amui-editorial-card", className].filter(Boolean).join(" ")}
      aria-labelledby={title != null ? titleId : articleProps["aria-labelledby"]}
    >
      {(index != null || eyebrow != null || title != null) && (
        <header className="amui-editorial-card__header">
          {index != null && <span className="amui-editorial-card__index">{index}</span>}
          {eyebrow != null && <p className="amui-editorial-card__eyebrow">{eyebrow}</p>}
          {title != null && <h3 className="amui-editorial-card__title" id={titleId}>{title}</h3>}
        </header>
      )}
      {children != null && <div className="amui-editorial-card__content">{children}</div>}
    </article>
  );
}
