"use client"
import React from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: "blue" | "black" | "white" | "red"
  size?: "sm" | "md" | "lg"
  variant?: "solid" | "ghost"
  isLoading?: boolean
  fullWidth?: boolean
  iconOnly?: boolean
  icon?: React.ElementType
  children?: React.ReactNode
}

export function Button({
  children,
  color = "blue",
  size = "md",
  variant = "solid",
  disabled = false,
  isLoading = false,
  fullWidth = false,
  iconOnly = false,
  icon: Icon,
  className,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-[4px] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"

  const colorStyles: Record<string, string> = {
    blue: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    black: "bg-neutral-900 text-white hover:bg-neutral-800 focus:ring-neutral-700",
    white: "bg-white text-neutral-900 border border-gray-300 hover:bg-gray-100 focus:ring-gray-300",
    red: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  }

  const sizeStyles: Record<string, string> = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  }

  const variantStyles: Record<string, string> = {
    solid: "",
    ghost: "bg-transparent hover:bg-gray-100 text-neutral-700",
  }

  return (
    <button
      className={cn(
        baseStyles,
        colorStyles[color],
        sizeStyles[size],
        variantStyles[variant],
        iconOnly && "px-2",
        fullWidth ? "w-full" : "w-auto",
        isLoading && "relative pointer-events-none",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4 mr-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {Icon && <Icon className={cn("w-4 h-4", children && !iconOnly && "mr-2")} />}
      {!iconOnly && children}
    </button>
  )
}
