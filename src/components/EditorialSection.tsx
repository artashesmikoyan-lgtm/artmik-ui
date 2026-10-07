import { useId, type HTMLAttributes, type ReactNode } from "react";

export interface EditorialSectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  index?: ReactNode;
  eyebrow?: ReactNode;
  title?: ReactNode;
  children?: ReactNode;
}

export function EditorialSection({
  index,
  eyebrow,
  title,
  children,
  className,
  ...sectionProps
}: EditorialSectionProps) {
  const titleId = useId();

  return (
    <section
      {...sectionProps}
      className={["amui-editorial-section", className].filter(Boolean).join(" ")}
      aria-labelledby={title != null ? titleId : sectionProps["aria-labelledby"]}
    >
      {(index != null || eyebrow != null || title != null) && (
        <header className="amui-editorial-section__header">
          {index != null && <span className="amui-editorial-section__index">{index}</span>}
          <div className="amui-editorial-section__heading">
            {eyebrow != null && <p className="amui-editorial-section__eyebrow">{eyebrow}</p>}
            {title != null && <h2 className="amui-editorial-section__title" id={titleId}>{title}</h2>}
          </div>
        </header>
      )}
      <div className="amui-editorial-section__content">{children}</div>
    </section>
  );
}
