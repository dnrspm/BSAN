"use client"
import React from "react"
import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  size?: "sm" | "md"
  isInvalid?: boolean
  helperText?: string
  errorMessage?: string
  showCounter?: boolean
  leftAddon?: React.ReactNode
  rightAddon?: React.ReactNode
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

export function Input({
  type = "text",
  size = "md",
  disabled = false,
  isInvalid = false,
  helperText = "",
  errorMessage = "",
  showCounter = false,
  maxLength,
  leftAddon,
  rightAddon,
  icon,
  iconRight,
  className,
  value,
  ...props
}: InputProps) {
  const inputBase =
    "block w-full rounded-[4px] border bg-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"

  const sizeStyles: Record<string, string> = {
    sm: "text-sm px-2 py-1",
    md: "text-sm px-3 py-2",
  }

  const stateStyles = cn({
    "border-[#808489]": !isInvalid && !disabled,
    "border-red-500 text-red-600 focus:ring-red-500 focus:border-red-500": isInvalid,
    "bg-white text-gray-500 border-[#808489] cursor-not-allowed": disabled,
  })

  const characterCount = showCounter && maxLength ? `${String(value ?? "").length}/${maxLength}` : null

  return (
    <div className="w-full space-y-1">
      <div className="relative flex rounded-[4px] shadow-sm">
        {leftAddon && (
          <span className="inline-flex items-center px-3 rounded-l-[4px] border border-r-0 border-[#808489] bg-[#F9F9F9] text-gray-500 text-sm">
            {leftAddon}
          </span>
        )}
        <div className="relative flex items-center w-full">
          {icon && (
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {icon}
            </span>
          )}
          <input
            type={type}
            value={value}
            className={cn(
              inputBase,
              sizeStyles[size],
              stateStyles,
              icon && "pl-10",
              iconRight && "pr-10",
              leftAddon && "rounded-l-none",
              rightAddon && "rounded-r-none",
              className
            )}
            disabled={disabled}
            maxLength={maxLength}
            {...props}
          />
          {iconRight && (
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              {iconRight}
            </span>
          )}
        </div>
        {rightAddon && (
          <span className="inline-flex items-center px-3 rounded-r-[4px] border border-l-0 border-[#808489] bg-[#F9F9F9] text-gray-500 text-sm">
            {rightAddon}
          </span>
        )}
      </div>
      {isInvalid && errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
      {!isInvalid && helperText && <p className="text-sm text-gray-500">{helperText}</p>}
      {characterCount && <p className="text-sm text-gray-400 text-right">{characterCount}</p>}
    </div>
  )
}
