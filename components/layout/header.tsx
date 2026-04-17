"use client";

import { ReactNode } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumb?: Array<{ label: string; href?: string }>;
}

export function Header({ title, subtitle, actions, breadcrumb }: HeaderProps) {
  return (
    <div className="flex items-start justify-between py-7 px-8 border-b border-[#1e1e2e]">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-[#3a3a50] text-xs">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="text-xs text-[#6b6b85] hover:text-[#f0f0f8] transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-xs text-[#6b6b85]">{crumb.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
        <h1 className="text-xl font-semibold text-[#f0f0f8] tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-[#6b6b85] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
